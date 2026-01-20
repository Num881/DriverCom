const db = require('../db');

class Trip {
    static create(driver_id, car_id, route_id, date, price) {
        return db('trips').insert({ driver_id, car_id, route_id, date, price });
    }

    static findById(id) {
        return db('trips').where({ id }).first();
    }

    static findByRoute(from_city, to_city, date) {
        return db('trips')
            .join('routes', 'trips.route_id', 'routes.id')
            .where({
                'routes.from_city': from_city,
                'routes.to_city': to_city,
                date
            });
    }
}

module.exports = Trip;
