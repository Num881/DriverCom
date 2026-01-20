const BookingService = require('../services/bookingService');
const { requireFields } = require('../utils/validation');

async function bookingRoutes(fastify) {

    // Получение броней пользователя
    fastify.get('/', { preHandler: [fastify.authenticate] }, async (request, reply) => {
        const error = requireFields(request.query, ['user_id']);
        if (error) return reply.code(400).send({ error });

        try {
            return await BookingService.getUserBookings(request.query.user_id);
        } catch (err) {
            return reply.code(400).send({ error: err.message });
        }
    });

    // Создание брони + защита от двойной брони
    fastify.post('/', { preHandler: [fastify.authenticate] }, async (request, reply) => {
        const error = requireFields(request.body, ['trip_id']);
        if (error) return reply.code(400).send({ error });

        try {
            // Проверка на повторное бронирование
            const existing = await fastify.db('bookings')
                .where({
                    user_id: request.user.id,
                    trip_id: request.body.trip_id
                })
                .first();

            if (existing) {
                return reply.code(400).send({ error: 'You already booked this trip' });
            }

            // Если всё ок создаём
            const bookingId = await BookingService.create(request.user.id, request.body.trip_id);
            return { id: bookingId };
        } catch (err) {
            return reply.code(400).send({ error: err.message });
        }
    });

    // Отмена брони + проверка владения
    fastify.delete('/:id', { preHandler: [fastify.authenticate] }, async (request, reply) => {
        try {
            // Проверка, что это бронирование текущего пользователя
            const booking = await fastify.db('bookings')
                .where({
                    id: request.params.id,
                    user_id: request.user.id
                })
                .first();

            if (!booking) {
                return reply.code(403).send({ error: 'Not your booking or booking not found' });
            }

            await BookingService.cancel(request.params.id);
            return { message: 'Booking cancelled' };
        } catch (err) {
            return reply.code(400).send({ error: err.message });
        }
    });
}

module.exports = bookingRoutes;