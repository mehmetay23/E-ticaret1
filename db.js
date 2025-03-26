const { Pool } = require('pg');
require('dotenv').config();

// PostgreSQL bağlantı havuzu
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT
});

// Bağlantıyı test et
pool.query('SELECT NOW()', (err, res) => {
    if (err) {
        console.error('Veritabanı bağlantı hatası:', err);
    } else {
        console.log('Veritabanı bağlantısı başarılı');
    }
});

module.exports = {
    pool
}; 