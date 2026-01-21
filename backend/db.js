const knex = require('knex')({
    client: 'sqlite3',
    connection: {
        filename: './database.db'  // или твой путь
    },
    useNullAsDefault: true
});

module.exports = knex;