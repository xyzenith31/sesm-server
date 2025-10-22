// contoh-sesm-server/middlewares/upload.middleware.js
const multer = require('multer');
const path = require('path');
const fs = require('fs-extra'); // fs-extra untuk memastikan direktori ada

// Tentukan direktori upload
const feedbackUploadDir = path.join(__dirname, '..', 'uploads', 'feedback');

// Pastikan direktori ada
fs.ensureDirSync(feedbackUploadDir);

// Konfigurasi Multer Storage untuk Feedback
const feedbackStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, feedbackUploadDir); // Simpan ke folder uploads/feedback
    },
    filename: (req, file, cb) => {
        // Buat nama file unik: timestamp + nama asli
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const extension = path.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix + extension);
    }
});

// Filter file (Opsional tapi direkomendasikan)
const fileFilter = (req, file, cb) => {
    // Izinkan gambar, video, pdf, doc
    const allowedTypes = /jpeg|jpg|png|gif|mp4|mov|quicktime|pdf|doc|docx/;
    const mimetype = allowedTypes.test(file.mimetype);
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());

    if (mimetype && extname) {
        return cb(null, true);
    }
    cb(new Error('Tipe file tidak diizinkan. Hanya izinkan gambar, video, pdf, doc/docx.'), false);
};

// Batasi ukuran file (cth: 10MB)
const limits = {
    fileSize: 10 * 1024 * 1024 // 10 MB
};

// Middleware upload
const upload = multer({
    storage: feedbackStorage,
    fileFilter: fileFilter,
    limits: limits
});

module.exports = upload;