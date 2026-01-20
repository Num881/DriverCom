const db = require('../db');

class User {
    static async create(username, password, role) {
        const [id] = await db('users').insert({ username, password, role });
        return { id, username, role };
    }

    static findByUsername(username) {
        return db('users').where({ username }).first();
    }

    static findById(id) {
        return db('users').where({ id }).first();
    }
}

module.exports = User;
