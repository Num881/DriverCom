const db = require('../db');

async function init() {

    // юзеры
    if (!(await db.schema.hasTable('users'))) {
        await db.schema.createTable('users', table => {
            table.increments('id').primary();
            table.string('username').unique().notNullable();
            table.string('password').notNullable();
            table.string('role').notNullable(); // driver | passenger
        });
    }

    // машины
    if (!(await db.schema.hasTable('cars'))) {
        await db.schema.createTable('cars', table => {
            table.increments('id').primary();
            table.integer('driver_id').references('id').inTable('users').onDelete('CASCADE');
            table.string('model').notNullable();
            table.integer('seats_total').notNullable();
        });
    }

    // маршруты
    if (!(await db.schema.hasTable('routes'))) {
        await db.schema.createTable('routes', table => {
            table.increments('id').primary();
            table.string('from_city').notNullable();
            table.string('to_city').notNullable();
            table.json('stops');
        });
    }

    // поездки
    if (!(await db.schema.hasTable('trips'))) {
        await db.schema.createTable('trips', table => {
            table.increments('id').primary();
            table.integer('driver_id').references('id').inTable('users');
            table.integer('car_id').references('id').inTable('cars');
            table.integer('route_id').references('id').inTable('routes');
            table.date('date').notNullable();
            table.float('price').notNullable();
        });
    }

    // брони
    if (!(await db.schema.hasTable('bookings'))) {
        await db.schema.createTable('bookings', table => {
            table.increments('id').primary();
            table.integer('user_id').references('id').inTable('users');
            table.integer('trip_id').references('id').inTable('trips');
        });
    }

    console.log('DB initialized');
    process.exit(0);
}

init();
