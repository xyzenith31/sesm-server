const express = require('express');
const cors = require('cors');
const os = require('os'); // Tambahkan ini untuk mendapatkan info jaringan
require('dotenv').config();

const app = express();

// Middleware (Tidak berubah)
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static('uploads')); //

// Route utama (Tidak berubah)
app.get('/', (req, res) => {
  res.json({ message: 'Selamat datang di API backend.' }); //
});

// Routes (Tidak berubah)
require('./routes')(app); //

// --- BAGIAN YANG DIPERBARUI: Menjalankan server ---

const PORT = process.env.PORT || 8080; //

app.listen(PORT, '0.0.0.0', () => {
  console.log(`\nServer backend berhasil berjalan.`);

  // Menampilkan alamat Local
  console.log(`  -> Local:    http://localhost:${PORT}`);

  // Mencari dan menampilkan alamat Network
  const interfaces = os.networkInterfaces();
  Object.keys(interfaces).forEach((devName) => {
    interfaces[devName].forEach((details) => {
      if (details.family === 'IPv4' && !details.internal) {
        console.log(`  -> Network:  http://${details.address}:${PORT}`);
      }
    });
  });

  console.log('\nTekan CTRL+C untuk menghentikan server.');
});