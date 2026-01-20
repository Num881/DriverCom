const { requireRole } = require('../utils/auth');
const Car = require('../models/car');
const Route = require('../models/route');
const Trip = require('../models/trip');
const Booking = require('../models/booking');

async function driverRoutes(fastify) {
    const requireDriver = requireRole('driver');

    //Машины
    fastify.post('/cars', { preHandler: [fastify.authenticate, requireDriver] }, async (request, reply) => {
        const { model, seats_total } = request.body;
        if (!model || !seats_total || seats_total < 1) {
            return reply.code(400).send({ error: 'model и seats_total обязательны, seats_total > 0' });
        }
        try {
            const [id] = await Car.create(request.user.id, model, Number(seats_total));
            return { id, model, seats_total }; // id теперь число
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

    //Маршруты
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

    // Поездки
    fastify.post('/trips', { preHandler: [fastify.authenticate, requireDriver] }, async (request, reply) => {
        const { car_id, route_id, date, price } = request.body;
        if (!car_id || !route_id || !date || !price) {
            return reply.code(400).send({ error: 'Все поля обязательны' });
        }
        try {
            const car = await fastify.db('cars')
                .where({ id: car_id, driver_id: request.user.id })
                .first();
            if (!car) return reply.code(403).send({ error: 'Машина не ваша' });

            const [id] = await Trip.create(request.user.id, Number(car_id), Number(route_id), date, Number(price));
            return { id, driver_id: request.user.id, car_id, route_id, date, price };
        } catch (err) {
            fastify.log.error(err);
            return reply.code(400).send({ error: err.message });
        }
    });

    fastify.get('/trips', { preHandler: [fastify.authenticate, requireDriver] }, async (request, reply) => {
        try {
            // Получаем все данные одним запросом
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

            // Парсим stops и готовим временные поля
            const parsedTrips = trips.map(trip => ({
                ...trip,
                stops: JSON.parse(trip.stops || '[]')
            }));

            // Добавляем booked_seats и free_seats
            for (const trip of parsedTrips) {
                const { count } = await Booking.countByTrip(trip.id);
                trip.booked_seats = Number(count);  // точно число
                trip.free_seats = trip.seats_total - Number(count);
            }

            return parsedTrips;
        } catch (err) {
            fastify.log.error(err);
            return reply.code(500).send({ error: 'Ошибка получения поездок' });
        }
    });

    fastify.get('/trips/search', { preHandler: [fastify.authenticate] }, async (request, reply) => {
        const { from_city, to_city, date } = request.query;
        if (!from_city || !to_city) return reply.code(400).send({ error: 'from_city и to_city обязательны' });

        try {
            let query = fastify.db('trips')
                .join('cars', 'trips.car_id', 'cars.id')
                .join('routes', 'trips.route_id', 'routes.id')
                .where('routes.from_city', 'like', `%${from_city}%`)
                .andWhere('routes.to_city', 'like', `%${to_city}%`)
                .select(
                    'trips.*',
                    'cars.model as car_model',
                    'cars.seats_total',
                    'routes.from_city',
                    'routes.to_city',
                    'routes.stops'
                );

            if (date) query = query.andWhere('trips.date', '>=', date);

            const trips = await query;

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
            return reply.code(500).send({ error: 'Ошибка поиска' });
        }
    });
}

module.exports = driverRoutes;