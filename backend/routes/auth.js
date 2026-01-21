const AuthService = require('../services/authService');
const { requireRole } = require('../utils/auth');

async function authRoutes(fastify) {

    // регистрация
    fastify.post('/register', async (request, reply) => {
        const body = request.body;
        console.log('REGISTER - Полученное тело:', body);
        console.log('REGISTER - username:', body?.username, typeof body?.username);
        console.log('REGISTER - password:', body?.password ? 'пришёл' : 'не пришёл');
        console.log('REGISTER - role:', body?.role, typeof body?.role);

        const { username, password, role } = body;

        if (!username || typeof username !== 'string' || username.trim() === '') {
            console.log('REGISTER - Ошибка: username пустой или не строка');
            return reply.code(400).send({ error: 'username обязателен и должен быть строкой' });
        }

        if (!password || typeof password !== 'string' || password.trim() === '') {
            console.log('REGISTER - Ошибка: password пустой или не строка');
            return reply.code(400).send({ error: 'password обязателен и должен быть строкой' });
        }

        if (!role || typeof role !== 'string' || !['driver', 'passenger'].includes(role.trim())) {
            console.log('REGISTER - Ошибка: role некорректный', role);
            return reply.code(400).send({ error: 'role должен быть "driver" или "passenger"' });
        }

        try {
            // ← ВСЯ ЛОГИКА ПЕРЕНЕСЕНА В СЕРВИС
            const user = await AuthService.register(username, password, role.trim());

            console.log('REGISTER - Успех, пользователь создан:', user.id);
            return { id: user.id, username: user.username, role: user.role };
        } catch (err) {
            console.error('REGISTER - Ошибка:', err.message);
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
            const { token, role } = await AuthService.login(username, password);  // ← получаем и token, и role
            return { token, role };
        } catch (err) {
            return reply.code(401).send({ error: err.message });
        }
    });

}

module.exports = authRoutes;
