const db = require('../db');

class Route {
    static create(from_city, to_city, stops) {
        return db('routes').insert({
            from_city,
            to_city,
            stops: JSON.stringify(stops)
        });
    }

    static findById(id) {
        return db('routes').where({ id }).first();
    }
}

module.exports = Route;
