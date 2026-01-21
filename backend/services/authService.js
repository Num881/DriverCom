const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { jwtSecret } = require('../config');
const db = require('../db');

class AuthService {
    //регистрация
     async register(username, password, role) {
        console.log('REGISTER SERVICE - Регистрация:', username, role);

        const trimmedUsername = username.trim();
        if (!trimmedUsername || trimmedUsername.length < 3) {
            throw new Error('Имя пользователя слишком короткое или пустое');
        }

        const existing = await db('users').where({ username: trimmedUsername }).first();
        if (existing) {
            console.log('REGISTER SERVICE - Пользователь уже существует');
            throw new Error('Пользователь с таким именем уже существует');
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const [id] = await db('users').insert({
            username: trimmedUsername,
            password: hashedPassword,
            role,
        });

        console.log('REGISTER SERVICE - Пользователь создан с ID:', id);
        return { id, username: trimmedUsername, role };
    }
    //логин
    async login(username, password) {
        console.log('LOGIN SERVICE - Поиск пользователя:', username);

        const user = await db('users').where({ username }).first();
        if (!user) {
            console.log('LOGIN SERVICE - Пользователь НЕ НАЙДЕН');
            throw new Error('Пользователь не найден');
        }

        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
            console.log('LOGIN SERVICE - Неверный пароль');
            throw new Error('Неверный пароль');
        }

        const token = jwt.sign({ id: user.id, role: user.role }, jwtSecret, { expiresIn: '1h' });
        return { token, role: user.role };  // ← возвращаем и token, и role
    }
}

module.exports = new AuthService();