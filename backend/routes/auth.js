const AuthService = require('../services/authService');
const { requireRole } = require('../utils/auth');

async function authRoutes(fastify) {

    // регистрация
    fastify.post('/register', async (request, reply) => {
        console.log('HEADERS:', request.headers);
        console.log('BODY RAW:', request.body);
        console.log('CONTENT-TYPE:', request.headers['content-type']);

        const { username, password, role } = request.body;
        if (!username || !password || !role || !['driver', 'passenger'].includes(role)) {
            return reply.code(400).send({ error: 'Username, password and role (driver/passenger) required' });
        }

        try {
            const user = await AuthService.register(username, password, role);
            return { id: user.id, username: user.username, role: user.role };
        } catch (err) {
            return reply.code(400).send({ error: err.message });
        }
    });

    // логин
    fastify.post('/login', async (request, reply) => {
        console.log('LOGIN - Полученное тело запроса:', request.body);
        console.log('LOGIN - Username из тела:', request.body?.username);
        console.log('LOGIN - Password из тела:', request.body?.password ? 'пришёл (не показываем для безопасности)' : 'не пришёл');

        const { username, password } = request.body;
        if (!username || !password) {
            return reply.code(400).send({ error: 'Username and password required' });
        }

        try {
            const token = await AuthService.login(username, password);
            return { token };
        } catch (err) {
            return reply.code(401).send({ error: err.message });
        }

    });

}

module.exports = authRoutes;
