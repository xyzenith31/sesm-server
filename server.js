const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors()); // Mengaktifkan CORS
app.use(express.json()); // Mem-parse body request sebagai JSON
app.use(express.urlencoded({ extended: true })); // Mem-parse body request dari form

// Route utama
app.get('/', (req, res) => {
  res.json({ message: 'Selamat datang di API backend.' });
});

// Mengimpor dan menggunakan routes otentikasi
require('./routes/auth.routes.js')(app);

// ✅ Tambahkan baris berikut sesuai instruksi AI
require('./routes/user.routes.js')(app);

// Menjalankan server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server berjalan di port ${PORT}.`);
});