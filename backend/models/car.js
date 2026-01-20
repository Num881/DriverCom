const db = require('../db');

class Car {
    static create(driver_id, model, seats_total) {
        return db('cars').insert({ driver_id, model, seats_total });
    }

    static findById(id) {
        return db('cars').where({ id }).first();
    }
}

module.exports = Car;
