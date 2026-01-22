const db = require('../db');
const { requireRole } = require('../utils/auth');

async function driverRoutes(fastify) {
    const requireDriver = requireRole('driver');

    // Машины (только водители)
    fastify.post('/cars', { preHandler: [fastify.authenticate, requireDriver] }, async (request, reply) => {
        const { model, seats_total } = request.body;
        if (!model || !seats_total || seats_total < 1) {
            return reply.code(400).send({ error: 'model и seats_total обязательны, seats_total > 0' });
        }
        try {
            const [id] = await db('cars').insert({
                driver_id: request.user.id,
                model,
                seats_total: Number(seats_total),
            });
            return { id, model, seats_total };
        } catch (err) {
            fastify.log.error(err);
            return reply.code(500).send({ error: 'Ошибка при создании машины' });
        }
    });

    fastify.get('/cars', { preHandler: [fastify.authenticate, requireDriver] }, async (request) => {
        try {
            return await db('cars')
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
            const [id] = await db('routes').insert({
                from_city,
                to_city,
                stops: JSON.stringify(stops),
            });
            return { id, from_city, to_city, stops };
        } catch (err) {
            fastify.log.error(err);
            return reply.code(500).send({ error: 'Ошибка создания маршрута' });
        }
    });

    fastify.get('/routes', { preHandler: [fastify.authenticate] }, async () => {
        try {
            const routes = await db('routes').select('*');
            return routes.map(r => ({
                ...r,
                stops: JSON.parse(r.stops || '[]'),
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
            let car = await db('cars')
                .where({ driver_id: request.user.id, model: car_model })
                .first();

            if (!car) {
                const [id] = await db('cars').insert({
                    driver_id: request.user.id,
                    model: car_model,
                    seats_total: Number(seats_total),
                });
                car = { id };
            }

            // Создаём маршрут
            const [routeId] = await db('routes').insert({
                from_city,
                to_city,
                stops: JSON.stringify([]),
            });

            // Создаём поездку
            const [tripId] = await db('trips').insert({
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
            const trips = await db('trips')
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
                stops: JSON.parse(trip.stops || '[]'),
            }));

            for (const trip of parsedTrips) {
                const { count } = await db('bookings')
                    .count('* as count')
                    .where('trip_id', trip.id)
                    .first();
                trip.booked_seats = Number(count);
                trip.free_seats = trip.seats_total - Number(count);
            }

            return parsedTrips;
        } catch (err) {
            fastify.log.error(err);
            return reply.code(500).send({ error: 'Ошибка получения поездок' });
        }
    });

    // Получение одной поездки (для редактирования)
    fastify.get('/trips/:id', { preHandler: [fastify.authenticate, requireDriver] }, async (request, reply) => {
        const tripId = request.params.id;
        const userId = request.user.id;

        try {
            const trip = await db('trips')
                .join('cars', 'trips.car_id', 'cars.id')
                .join('routes', 'trips.route_id', 'routes.id')
                .where({ 'trips.id': tripId, 'trips.driver_id': userId })
                .select(
                    'trips.id',
                    'routes.from_city',
                    'routes.to_city',
                    'trips.date',
                    'trips.price',
                    'cars.seats_total',
                    'cars.model as car_model'
                )
                .first();

            if (!trip) {
                return reply.code(404).send({ error: 'Поездка не найдена или не принадлежит вам' });
            }

            const { count } = await db('bookings').count('* as count').where('trip_id', tripId).first();
            trip.booked_seats = Number(count);
            trip.free_seats = trip.seats_total - Number(count);
            trip.stops = JSON.parse(trip.stops || '[]');

            return trip;
        } catch (err) {
            fastify.log.error(err);
            return reply.code(500).send({ error: 'Ошибка получения поездки' });
        }
    });

    // Редактирование поездки
    fastify.patch('/trips/:id', { preHandler: [fastify.authenticate, requireDriver] }, async (request, reply) => {
        const tripId = request.params.id;
        const userId = request.user.id;
        const { from_city, to_city, date, price, seats_total, car_model } = request.body;

        try {
            // Находим поездку
            const trip = await db('trips').where({ id: tripId, driver_id: userId }).first();
            if (!trip) return reply.code(404).send({ error: 'Поездка не найдена или не ваша' });

            // 1. Обновляем поля в trips
            const tripUpdates = {};
            if (date) tripUpdates.date = date;
            if (price !== undefined) tripUpdates.price = Number(price);

            if (Object.keys(tripUpdates).length > 0) {
                await db('trips').where({ id: tripId }).update(tripUpdates);
            }

            // 2. Если изменилась машина или количество мест
            if (car_model || seats_total !== undefined) {
                let car;

                if (car_model) {
                    // Ищем машину по модели у этого водителя
                    car = await db('cars')
                        .where({ driver_id: userId, model: car_model })
                        .first();
                } else {
                    // Если модель не меняется — берём текущую
                    car = await db('cars').where({ id: trip.car_id }).first();
                }

                if (!car) {
                    // Если машины нет — создаём новую
                    const [newCarId] = await db('cars').insert({
                        driver_id: userId,
                        model: car_model || 'Без модели',
                        seats_total: seats_total !== undefined ? Number(seats_total) : 4,
                    });
                    car = { id: newCarId };
                } else if (seats_total !== undefined) {
                    // Если модель не меняется, но меняется количество мест — обновляем машину
                    await db('cars').where({ id: car.id }).update({
                        seats_total: Number(seats_total),
                    });
                }

                // Обновляем связь поездки с машиной
                await db('trips').where({ id: tripId }).update({ car_id: car.id });
            }

            // 3. Если изменились города — создаём новый маршрут
            if (from_city || to_city) {
                const [routeId] = await db('routes').insert({
                    from_city: from_city || trip.from_city,
                    to_city: to_city || trip.to_city,
                    stops: JSON.stringify([]),
                });

                await db('trips').where({ id: tripId }).update({ route_id: routeId });
            }

            return { message: 'Поездка успешно обновлена' };
        } catch (err) {
            fastify.log.error(err);
            return reply.code(500).send({ error: 'Ошибка обновления: ' + err.message });
        }
    });

    // Удаление поездки
    fastify.delete('/trips/:id', { preHandler: [fastify.authenticate, requireDriver] }, async (request, reply) => {
        const tripId = request.params.id;
        const userId = request.user.id;

        try {
            const trip = await db('trips').where({ id: tripId, driver_id: userId }).first();
            if (!trip) return reply.code(404).send({ error: 'Поездка не найдена или не ваша' });

            await db('bookings').where({ trip_id: tripId }).del();
            await db('trips').where({ id: tripId }).del();

            return { message: 'Поездка удалена' };
        } catch (err) {
            fastify.log.error(err);
            return reply.code(500).send({ error: 'Ошибка удаления' });
        }
    });

    // Поиск поездок — доступно всем авторизованным
    fastify.get('/trips/search', { preHandler: [fastify.authenticate] }, async (request, reply) => {
        const { from_city = '', to_city = '', date_from, date_to, price_min, price_max } = request.query;

        try {
            let query = db('trips')
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

            if (from_city.trim()) query = query.where('routes.from_city', 'like', `%${from_city.trim()}%`);
            if (to_city.trim()) query = query.where('routes.to_city', 'like', `%${to_city.trim()}%`);

            if (date_from) query = query.andWhere('trips.date', '>=', date_from);
            if (date_to) query = query.andWhere('trips.date', '<=', date_to);

            if (price_min) query = query.andWhere('trips.price', '>=', Number(price_min));
            if (price_max) query = query.andWhere('trips.price', '<=', Number(price_max));

            const trips = await query;

            for (const trip of trips) {
                const { count } = await db('bookings').count('* as count').where('trip_id', trip.id).first();
                trip.booked_seats = Number(count);
                trip.free_seats = trip.seats_total - Number(count);
                trip.stops = JSON.parse(trip.stops || '[]');
            }

            return trips;
        } catch (err) {
            fastify.log.error(err);
            return reply.code(500).send({ error: 'Ошибка поиска' });
        }
    });
}

module.exports = driverRoutes;