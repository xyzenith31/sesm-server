// contoh backend/middlewares/story.upload.js
const multer = require('multer');
const path = require('path');
const fs = require('fs-extra'); // Pastikan Anda sudah install: npm install fs-extra

// --- Tentukan Direktori ---
const storyBaseDir = path.join(__dirname, '..', 'uploads', 'story');
const storyCoverDir = path.join(storyBaseDir, 'cover');
const storyNodeDir = path.join(storyBaseDir, 'node');

// --- Pastikan Direktori Ada ---
fs.ensureDirSync(storyCoverDir);
fs.ensureDirSync(storyNodeDir);

// --- Filter File (Hanya Gambar) ---
const fileFilter = (req, file, cb) => {
    const allowedMimeTypes = [
        'image/jpeg', 'image/pjpeg', 'image/png', 'image/gif', 'image/webp',
    ];
    const mimeMatch = allowedMimeTypes.includes(file.mimetype);
    if (mimeMatch) {
        cb(null, true);
    } else {
        cb(new Error('Tipe file gambar tidak diizinkan (jpeg, png, gif, webp).'), false);
    }
};

// --- Storage Engine Dinamis ---
const storyStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Arahkan file ke folder yang benar berdasarkan fieldname
        if (file.fieldname === 'cover_image') {
            cb(null, storyCoverDir); // Ke /uploads/story/cover
        } else if (file.fieldname === 'node_images') {
            cb(null, storyNodeDir); // Ke /uploads/story/node
        } else {
            cb(new Error('Fieldname file tidak dikenal'), null);
        }
    },
    filename: (req, file, cb) => {
        // Dapatkan ekstensi dari mimetype
        let extension = '.dat'; // fallback
        switch(file.mimetype) {
            case 'image/png': extension = '.png'; break;
            case 'image/jpeg': extension = '.jpg'; break;
            case 'image/gif': extension = '.gif'; break;
            case 'image/webp': extension = '.webp'; break;
        }

        let finalFilename;
        
        if (file.fieldname === 'node_images') {
            // Untuk node, nama file = ID node (dari originalname) + ekstensi
            // cth: "node_abc123.png"
            finalFilename = file.originalname + extension;
        } else {
            // Untuk cover, buat nama unik
            // cth: "cover_image-1678886400000.png"
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            finalFilename = file.fieldname + '-' + uniqueSuffix + extension;
        }

        cb(null, finalFilename);
    }
});

// Batas ukuran file
const limits = {
    fileSize: 10 * 1024 * 1024 // 10 MB
};

// Buat instance multer
const storyUploads = multer({
    storage: storyStorage,
    fileFilter: fileFilter,
    limits: limits
});

// Ekspor instance
module.exports = storyUploads;