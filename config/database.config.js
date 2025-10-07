const mysql = require('mysql2');
require('dotenv').config();

// Membuat connection pool untuk efisiensi koneksi
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Menggunakan promise wrapper untuk kemudahan penggunaan dengan async/await
module.exports = pool.promise();