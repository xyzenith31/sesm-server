// contoh-sesm-server/server.js
const express = require('express');
const cors = require('cors');
const os = require('os');
require('dotenv').config();

const app = express();

// ✅ PERBAIKAN: Menaikkan batas ukuran payload
app.use(cors());
app.use(express.json({ limit: '50mb' })); // Naikkan batas untuk JSON
app.use(express.urlencoded({ limit: '50mb', extended: true })); // Naikkan batas untuk URL-encoded

app.use('/uploads', express.static('uploads'));

// Route utama
app.get('/', (req, res) => {
  res.json({ message: 'Selamat datang di API backend.' });
});

// Routes
require('./routes')(app);

const PORT = process.env.PORT || 8080;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`\nServer backend berhasil berjalan.`);
  console.log(`  -> Local:    http://localhost:${PORT}`);
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