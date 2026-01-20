const db = require('../db');

class Booking {
    static create(user_id, trip_id) {
        return db('bookings').insert({ user_id, trip_id });
    }

    static countByTrip(trip_id) {
        return db('bookings').where({ trip_id }).count('id as count').first();
    }

    static delete(id) {
        return db('bookings').where({ id }).del();
    }
}

module.exports = Booking;
