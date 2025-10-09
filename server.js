const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Route utama
app.get('/', (req, res) => {
  res.json({ message: 'Selamat datang di API backend.' });
});

// Routes
require('./routes')(app); // Cukup panggil index.js dari direktori routes

// Menjalankan server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server berjalan di port ${PORT}.`);
});