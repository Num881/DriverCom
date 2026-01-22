const fastify = require('fastify')({ logger: true });
const fastifyJwt = require('@fastify/jwt');
const fastifyCors = require('@fastify/cors');

const { jwtSecret } = require('./config');

// CORS — разрешаем все нужные методы, включая DELETE
fastify.register(fastifyCors, {
    origin: 'http://localhost:5173', // или ['http://localhost:5173'] для массива
    methods: ['GET', 'POST', 'OPTIONS', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['Content-Length', 'X-Requested-With'],
    credentials: true,
    maxAge: 86400, // кэширование preflight на 24 часа
});

// Подключаем db как декоратор (чтобы был доступен как fastify.db)
fastify.decorate('db', require('./db'));

// JWT
fastify.register(fastifyJwt, { secret: jwtSecret });

// Декоратор аутентификации
fastify.decorate('authenticate', async function (request, reply) {
    try {
        await request.jwtVerify();
    } catch (err) {
        reply.code(401).send({ error: 'Unauthorized' });
    }
});

// Роуты — регистрируем ТОЛЬКО ОДИН раз каждый
fastify.register(require('./routes/auth'), { prefix: '/auth' });
fastify.register(require('./routes/drivers'), { prefix: '/drivers' });
fastify.register(require('./routes/bookings'), { prefix: '/bookings' });

// Запуск сервера
const port = 3000;

const start = async () => {
    try {
        await fastify.listen({ port, host: '0.0.0.0' });
        console.log(`Server running at http://127.0.0.1:${port}`);
    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
};

start();