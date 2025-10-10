const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Tentukan direktori upload
const uploadDir = 'uploads/quiz_images/';

// Pastikan direktori ada, jika tidak, buatkan
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Konfigurasi penyimpanan file menggunakan multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Simpan file di folder yang sudah kita tentukan
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Buat nama file yang unik untuk menghindari nama file yang sama
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// Filter untuk memastikan tipe file yang diizinkan (gambar, video, audio, dokumen)
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'video/mp4', 'video/webm', 'video/ogg',
    'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp3',
    'application/pdf',
    'application/msword', // untuk .doc
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document' // untuk .docx
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true); // Terima file
  } else {
    cb(new Error('Tipe file tidak diizinkan! Hanya gambar, video, audio, dan dokumen.'), false); // Tolak file
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter, // Gunakan filter yang baru
  limits: {
    fileSize: 1024 * 1024 * 50 // Naikkan batas ukuran file menjadi 50MB untuk video
  }
});

module.exports = upload;