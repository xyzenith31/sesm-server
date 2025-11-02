// contoh-sesm-server/middlewares/upload.middleware.js
const multer = require('multer');
const path = require('path');
const fs = require('fs-extra'); // fs-extra untuk memastikan direktori ada

// Tentukan direktori upload
// CATATAN: Ini masih menyimpan SEMUA file ke 'uploads/feedback'.
// Ini adalah bug di kode Anda, tapi saya tidak akan mengubahnya sesuai permintaan Anda.
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
        
        // [PERBAIKAN] Dapatkan ekstensi dari mimetype jika originalname tidak punya ekstensi
        let extension = path.extname(file.originalname).toLowerCase();
        if (extension === '') {
            // Ini terjadi di 'node_images'
            switch(file.mimetype) {
                case 'image/png': extension = '.png'; break;
                case 'image/jpeg': extension = '.jpg'; break;
                case 'image/gif': extension = '.gif'; break;
                case 'image/webp': extension = '.webp'; break;
                default: extension = '.dat'; // fallback
            }
        }
        
        cb(null, file.fieldname + '-' + uniqueSuffix + extension);
    }
});

// [PERBAIKAN UTAMA DI SINI]
// Filter file (Opsional tapi direkomendasikan)
const fileFilter = (req, file, cb) => {
    
    // Daftar MimeType yang diizinkan (lebih robust)
    const allowedMimeTypes = [
        'image/jpeg', 'image/pjpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
        'video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/mpeg',
        'application/pdf',
        'application/msword', // .doc
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
    ];
    
    // Daftar Ekstensi yang diizinkan (HARUS menyertakan titik)
    const allowedExtnames = [
        '.jpeg', '.jpg', '.png', '.gif', '.webp', '.svg',
        '.mp4', '.mov', '.quicktime', '.avi', '.mpeg',
        '.pdf',
        '.doc', '.docx'
    ];

    const mimeMatch = allowedMimeTypes.includes(file.mimetype);
    const extMatch = allowedExtnames.includes(path.extname(file.originalname).toLowerCase());

    // [PERBAIKAN LOGIKA]
    // 1. Jika fieldname adalah 'node_images', kita HANYA percaya mimetype-nya
    //    karena 'originalname' adalah ID node (cth: 'node_abc'), bukan nama file.
    if (file.fieldname === 'node_images') {
        if (mimeMatch) {
            return cb(null, true); // Izinkan jika mimetype gambar cocok
        }
    }

    // 2. Untuk semua file lain, cek mimetype DAN ekstensi
    if (mimeMatch && extMatch) {
        return cb(null, true); // File diizinkan
    }
    
    // 3. Jika file ditolak
    const errorMsg = `Tipe file tidak diizinkan (mimetype: ${file.mimetype}, ext: ${path.extname(file.originalname)}). Hanya izinkan gambar, video, pdf, doc/docx.`;
    cb(new Error(errorMsg), false);
};


// Batasi ukuran file (cth: 10MB)
const limits = {
    fileSize: 10 * 1024 * 1024 // 10 MB
};

// Middleware upload
const upload = multer({
    storage: feedbackStorage, // Tetap gunakan storage lama
    fileFilter: fileFilter,   // Tapi gunakan fileFilter yang sudah diperbaiki
    limits: limits
});

module.exports = upload; // Ekspor tetap sama