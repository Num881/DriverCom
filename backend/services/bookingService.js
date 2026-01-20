const Booking = require('../models/Booking');
const Trip = require('../models/Trip');
const Car = require('../models/Car');

class BookingService {
    static async create(user_id, trip_id) {
        const trip = await Trip.findById(trip_id);
        if (!trip) throw new Error('Trip not found');

        const car = await Car.findById(trip.car_id);
        const { count } = await Booking.countByTrip(trip_id);

        if (count >= car.seats_total) {
            throw new Error('No free seats');
        }

        return Booking.create(user_id, trip_id);
    }

    static cancel(id) {
        return Booking.delete(id);
    }

    static async getUserBookings(user_id) {
        return db('bookings')
            .join('trips', 'bookings.trip_id', 'trips.id')
            .join('routes', 'trips.route_id', 'routes.id')
            .where({'bookings.user_id': user_id})
            .select(
                'bookings.id',
                'trips.date',
                'trips.price',
                'routes.from_city',
                'routes.to_city'
            );
    }
}

module.exports = BookingService;
