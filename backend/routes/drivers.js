const db = require('../db')
const { requireRole } = require('../utils/auth');
const Car = require('../models/car');
const Route = require('../models/route');
const Trip = require('../models/trip');
const Booking = require('../models/booking');


async function driverRoutes(fastify) {
    const requireDriver = requireRole('driver');

    // Машины (только водители)
    fastify.post('/cars', { preHandler: [fastify.authenticate, requireDriver] }, async (request, reply) => {
        const { model, seats_total } = request.body;
        if (!model || !seats_total || seats_total < 1) {
            return reply.code(400).send({ error: 'model и seats_total обязательны, seats_total > 0' });
        }
        try {
            const [id] = await Car.create(request.user.id, model, Number(seats_total));
            return { id, model, seats_total };
        } catch (err) {
            fastify.log.error(err);
            return reply.code(500).send({ error: 'Ошибка при создании машины' });
        }
    });

    fastify.get('/cars', { preHandler: [fastify.authenticate, requireDriver] }, async (request) => {
        try {
            return await fastify.db('cars')
                .where({ driver_id: request.user.id })
                .select('id', 'model', 'seats_total');
        } catch (err) {
            fastify.log.error(err);
            return reply.code(500).send({ error: 'Ошибка получения списка машин' });
        }
    });

    // Маршруты (доступны всем авторизованным)
    fastify.post('/routes', { preHandler: [fastify.authenticate] }, async (request, reply) => {
        const { from_city, to_city, stops } = request.body;
        if (!from_city || !to_city || !Array.isArray(stops)) {
            return reply.code(400).send({ error: 'from_city, to_city и stops (массив) обязательны' });
        }
        try {
            const [id] = await Route.create(from_city, to_city, stops);
            return { id, from_city, to_city, stops };
        } catch (err) {
            fastify.log.error(err);
            return reply.code(500).send({ error: 'Ошибка создания маршрута' });
        }
    });

    fastify.get('/routes', { preHandler: [fastify.authenticate] }, async () => {
        try {
            const routes = await fastify.db('routes').select('*');
            return routes.map(r => ({
                ...r,
                stops: JSON.parse(r.stops || '[]')
            }));
        } catch (err) {
            return [];
        }
    });

    // Поездки — создание (только водители)
    fastify.post('/trips', { preHandler: [fastify.authenticate, requireDriver] }, async (request, reply) => {
        const { from_city, to_city, date, price, seats_total, car_model } = request.body;

        if (!from_city || !to_city || !date || !price || !seats_total || !car_model) {
            return reply.code(400).send({ error: 'Все поля обязательны' });
        }

        try {
            // Создаём или находим машину
            let car = await fastify.db('cars')
                .where({ driver_id: request.user.id, model: car_model })
                .first();

            if (!car) {
                const [id] = await fastify.db('cars').insert({
                    driver_id: request.user.id,
                    model: car_model,
                    seats_total: Number(seats_total),
                });
                car = { id };
            }

            // Создаём маршрут
            const [routeId] = await fastify.db('routes').insert({
                from_city,
                to_city,
                stops: JSON.stringify([]),
            });

            // Создаём поездку
            const [tripId] = await fastify.db('trips').insert({
                driver_id: request.user.id,
                car_id: car.id,
                route_id: routeId,
                date,
                price: Number(price),
            });

            return { id: tripId, message: 'Поездка создана' };
        } catch (err) {
            fastify.log.error(err);
            return reply.code(500).send({ error: 'Ошибка создания поездки' });
        }
    });

    // Личные поездки водителя
    fastify.get('/trips', { preHandler: [fastify.authenticate, requireDriver] }, async (request, reply) => {
        try {
            const trips = await fastify.db('trips')
                .join('cars', 'trips.car_id', 'cars.id')
                .join('routes', 'trips.route_id', 'routes.id')
                .where({ 'trips.driver_id': request.user.id })
                .select(
                    'trips.*',
                    'cars.model as car_model',
                    'cars.seats_total',
                    'routes.from_city',
                    'routes.to_city',
                    'routes.stops'
                );

            const parsedTrips = trips.map(trip => ({
                ...trip,
                stops: JSON.parse(trip.stops || '[]')
            }));

            for (const trip of parsedTrips) {
                const { count } = await Booking.countByTrip(trip.id);
                trip.booked_seats = Number(count);
                trip.free_seats = trip.seats_total - Number(count);
            }

            return parsedTrips;
        } catch (err) {
            fastify.log.error(err);
            return reply.code(500).send({ error: 'Ошибка получения поездок' });
        }
    });

    // Поиск поездок — доступно всем авторизованным (пассажиры видят всё)
    fastify.get('/trips/search', { preHandler: [fastify.authenticate] }, async (request, reply) => {
        const { from_city = '', to_city = '', date } = request.query;

        try {
            let query = db('trips')  // ← db, а НЕ fastify.db
                .join('cars', 'trips.car_id', 'cars.id')
                .join('routes', 'trips.route_id', 'routes.id')
                .select(
                    'trips.*',
                    'cars.model as car_model',
                    'cars.seats_total',
                    'routes.from_city',
                    'routes.to_city',
                    'routes.stops'
                );

            if (from_city.trim()) {
                query = query.where('routes.from_city', 'like', `%${from_city.trim()}%`);
            }
            if (to_city.trim()) {
                query = query.where('routes.to_city', 'like', `%${to_city.trim()}%`);
            }
            if (date) {
                query = query.andWhere('trips.date', '>=', date);
            }

            const trips = await query;

            // Парсинг booked_seats и free_seats
            for (const trip of trips) {
                const { count } = await db('bookings')  // ← db, а НЕ fastify.db
                    .count('* as count')
                    .where('trip_id', trip.id)
                    .first();

                trip.booked_seats = Number(count);
                trip.free_seats = trip.seats_total - Number(count);
                trip.stops = JSON.parse(trip.stops || '[]');
            }

            return trips;
        } catch (err) {
            console.error('ERROR IN /trips/search:', err.message);
            console.error('Stack trace:', err.stack);
            fastify.log.error(err);
            return reply.code(500).send({ error: 'Ошибка поиска: ' + err.message });
        }
    });
}

module.exports = driverRoutes;