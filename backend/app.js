const fastify = require('fastify')({ logger: true });
const authRoutes = require('./routes/auth');
const driversRoutes = require('./routes/drivers');
const bookingsRoutes = require('./routes/bookings');
const fastifyJwt = require('@fastify/jwt');
const { jwtSecret } = require('./config');

// доступ к бд
fastify.decorate('db', require('./db'));

// JWT
fastify.register(fastifyJwt, { secret: jwtSecret });
fastify.decorate("authenticate", async function(request, reply) {
    try {
        await request.jwtVerify();
    } catch (err) {
        reply.code(401).send({ error: 'Unauthorized' });
    }
});

// Роуты
fastify.register(authRoutes, { prefix: '/auth' });
fastify.register(driversRoutes, { prefix: '/drivers' });
fastify.register(bookingsRoutes, { prefix: '/bookings' });


// Запуск сервера
const port = 3000;

fastify.listen({ port }, (err, address) => {
    if (err) throw err;
    console.log(`Server running at ${address}`);
});
