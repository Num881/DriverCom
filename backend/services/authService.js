const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { jwtSecret } = require('../config');

class AuthService {
    //регистрация
    static async register(username, password, role) {
        const existing = await User.findByUsername(username);
        if (existing) throw new Error('Username already exists');
        const hash = await bcrypt.hash(password, 10);
        return User.create(username, hash, role);
    }
    //логин
    static async login(username, password) {
        const user = await User.findByUsername(username);
        if (!user) throw new Error('Invalid credentials');

        const valid = await bcrypt.compare(password, user.password);
        if (!valid) throw new Error('Invalid credentials');

        return jwt.sign(
            { id: user.id, role: user.role },
            jwtSecret
        );
    }

}

module.exports = AuthService;
