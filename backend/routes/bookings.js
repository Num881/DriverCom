const db = require('../db');

async function bookingsRoutes(fastify) {
    // Бронирование места (POST /bookings)
    fastify.post('/', { preHandler: [fastify.authenticate] }, async (request, reply) => {
        const { trip_id } = request.body;
        const userId = request.user.id;

        if (!trip_id) {
            return reply.code(400).send({ error: 'trip_id обязателен' });
        }

        try {
            // Проверка существования поездки
            const trip = await db('trips').where({ id: trip_id }).first();
            if (!trip) {
                return reply.code(404).send({ error: 'Поездка не найдена' });
            }

            // Проверка свободных мест (опционально, но полезно)
            const bookingsCount = await db('bookings').where({ trip_id }).count('* as count').first();
            if (bookingsCount.count >= trip.seats_total) {
                return reply.code(400).send({ error: 'Места закончились' });
            }

            // Проверка, не забронировал ли уже этот пользователь
            const existing = await db('bookings').where({ trip_id, user_id: userId }).first();
            if (existing) {
                return reply.code(400).send({ error: 'Вы уже забронировали место' });
            }

            const [id] = await db('bookings').insert({
                trip_id,
                user_id: userId,
            });

            return { id, message: 'Место забронировано' };
        } catch (err) {
            console.error('ERROR BOOKING:', err.message);
            return reply.code(500).send({ error: 'Ошибка бронирования' });
        }
    });

    fastify.delete('/:id', {
        preHandler: [fastify.authenticate],
        schema: {
            body: false,  // ← явно говорим, что тело не нужно
        }
    }, async (request, reply) => {
        const bookingId = request.params.id;
        const userId = request.user.id;

        try {
            const booking = await db('bookings')
                .where({ id: bookingId, user_id: userId })
                .first();

            if (!booking) {
                return reply.code(404).send({ error: 'Бронь не найдена или не твоя' });
            }

            await db('bookings').where({ id: bookingId }).del();

            return { message: 'Бронь отменена' };
        } catch (err) {
            console.error('ERROR DELETE BOOKING:', err.message);
            return reply.code(500).send({ error: 'Ошибка отмены' });
        }
    });

    // Мои брони (GET /bookings/my)
    fastify.get('/my', { preHandler: [fastify.authenticate] }, async (request, reply) => {
        const userId = request.user.id;

        try {
            const bookings = await db('bookings')
                .join('trips', 'bookings.trip_id', 'trips.id')
                .join('cars', 'trips.car_id', 'cars.id')
                .join('routes', 'trips.route_id', 'routes.id')
                .where('bookings.user_id', userId)
                .select(
                    'bookings.id',
                    'trips.id as trip_id',
                    'routes.from_city',
                    'routes.to_city',
                    'trips.date',
                    'cars.model as car_model'
                );

            return bookings;  // ← просто возвращаем без toISOString
        } catch (err) {
            console.error('ERROR GET MY BOOKINGS:', err.message);
            return reply.code(500).send({ error: 'Ошибка получения броней: ' + err.message });
        }
    });
}

module.exports = bookingsRoutes;