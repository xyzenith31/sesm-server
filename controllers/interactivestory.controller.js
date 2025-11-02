// contoh-sesm-server/controllers/interactivestory.controller.js
const InteractiveStory = require("../models/interactivestory.model.js");
const Point = require("../models/point.model.js");
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');

// Helper untuk menghapus file
const deleteFile = (filePath) => {
    if (!filePath) return;
    const fullPath = path.join(__dirname, '..', filePath); 
    
    fs.unlink(fullPath, (err) => {
        if (err) {
            if (err.code !== 'ENOENT') { 
                console.warn(`Gagal menghapus file: ${fullPath}`, err);
            }
        }
    });
};


// Helper untuk memproses data cerita
const processStoryData = (body, files) => {
    // [PERBAIKAN] Ambil story_data (yang sudah jadi string JSON dari FormData)
    if (!body.story_data) {
        return "{}"; // Kembalikan JSON kosong jika tidak ada
    }

    let storyDataObject;
    try {
         // Parse string JSON dari FormData
        storyDataObject = JSON.parse(body.story_data); 
    } catch (e) {
        console.error("Gagal parse story_data dari FormData:", e);
        return "{}"; // Kembalikan JSON kosong jika parse gagal
    }


    if (files && files.node_images) {
        const imageMap = {};
        files.node_images.forEach(file => {
            const nodeId = file.originalname; // Ini adalah ID node
            if (nodeId) {
                // Buat path relatif yang benar
                imageMap[nodeId] = `uploads/story/node/${file.filename}`;
            }
        });

        for (const key in storyDataObject) {
            // Timpa path gambar HANYA JIKA file baru diupload untuk node itu
            if (imageMap[key]) {
                // Hapus file lama jika ada (untuk update)
                if (storyDataObject[key] && storyDataObject[key].image) {
                    deleteFile(storyDataObject[key].image);
                }
                // Set path ke file yang baru
                storyDataObject[key].image = imageMap[key];
            }
        }
    }
    // Kembalikan sebagai string JSON untuk disimpan ke DB
    return JSON.stringify(storyDataObject);
};

// --- UNTUK SISWA ---
exports.getAllStories = async (req, res) => {
    try {
        const stories = await InteractiveStory.getAll();
        res.status(200).json(stories);
    } catch (error) {
        res.status(500).send({ message: "Gagal mengambil data cerita." });
    }
};

// [PERBAIKAN] getStoryDataById
exports.getStoryDataById = async (req, res) => {
    try {
        // Model mengembalikan data (sudah diparse oleh mysql2)
        const storyData = await InteractiveStory.findById(req.params.id);
        
        if (storyData) {
            // [DIHAPUS] JSON.parse() dihapus. Langsung kirim objeknya.
            res.status(200).json(storyData);
        } else {
            res.status(404).send({ message: "Data cerita tidak ditemukan." });
        }
    } catch (error) {
        console.error("GET STORY DATA BY ID ERROR:", error);
        res.status(500).send({ message: "Gagal mengambil data cerita." });
    }
};

exports.recordCompletion = async (req, res) => {
    const { id } = req.params;
    const { endingKey } = req.body;
    const userId = req.userId;
    try {
        const affectedRows = await InteractiveStory.recordCompletion(userId, id, endingKey);
        if (affectedRows > 0) {
            const pointsToAdd = 30;
            await Point.addPoints(
                userId, pointsToAdd, 'STORY_ENDING',
                `Menyelesaikan akhir cerita: ${endingKey} dari cerita ID: ${id}`
            );
            res.status(200).send({ message: "Penyelesaian berhasil dicatat. Anda mendapatkan poin!", pointsAwarded: pointsToAdd });
        } else {
            res.status(200).send({ message: "Anda sudah pernah menyelesaikan akhir cerita ini.", pointsAwarded: 0 });
        }
    } catch (error) {
        console.error("RECORD COMPLETION ERROR:", error);
        res.status(500).send({ message: "Gagal mencatat penyelesaian cerita." });
    }
};


// --- UNTUK GURU ---
exports.createStory = async (req, res) => {
    try {
        if (!req.body.title || req.body.title.trim() === '') {
             return res.status(400).send({ message: "Judul cerita tidak boleh kosong." });
        }

        const storyId = req.body.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').substring(0, 50) + '-' + uuidv4().substring(0, 4);
        
        // Panggil helper yang sudah diperbaiki
        const finalStoryData = processStoryData(req.body, req.files);
        const coverImageFile = req.files?.cover_image?.[0];

        const storyData = {
            id: storyId,
            title: req.body.title,
            synopsis: req.body.synopsis,
            category: req.body.category,
            read_time: parseInt(req.body.read_time) || 5,
            total_endings: parseInt(req.body.total_endings) || 1,
            cover_image: coverImageFile ? `uploads/story/cover/${coverImageFile.filename}` : null,
            story_data: finalStoryData, // Ini adalah string JSON
            creator_id: req.userId
        };

        const newStory = await InteractiveStory.create(storyData);
        res.status(201).json(newStory);
    } catch (error) {
        console.error("CREATE STORY ERROR:", error);
        res.status(500).send({ message: "Gagal membuat cerita baru." });
    }
};

exports.updateStory = async (req, res) => {
    try {
        // 1. Ambil data path lama
        const oldPaths = await InteractiveStory.getStoryPaths(req.params.id);
        
        // Panggil helper
        const finalStoryData = processStoryData(req.body, req.files);
        const coverImageFile = req.files?.cover_image?.[0]; 

        const storyData = {
            title: req.body.title,
            synopsis: req.body.synopsis,
            category: req.body.category,
            read_time: parseInt(req.body.read_time) || 5,
            total_endings: parseInt(req.body.total_endings) || 1,
            story_data: finalStoryData,
        };
        
        if (coverImageFile) {
            // Hapus cover lama jika ada
            if (oldPaths && oldPaths.cover_image) {
                deleteFile(oldPaths.cover_image);
            }
            // Set cover baru
            storyData.cover_image = `uploads/story/cover/${coverImageFile.filename}`;
        }
        
        const affectedRows = await InteractiveStory.update(req.params.id, storyData);
        if (affectedRows === 0) {
            return res.status(404).send({ message: "Cerita tidak ditemukan." });
        }
        res.status(200).send({ message: "Cerita berhasil diperbarui." });
    } catch (error) {
        console.error("UPDATE STORY ERROR:", error);
        res.status(500).send({ message: "Gagal memperbarui cerita." });
    }
};

// [PERBAIKAN] deleteStory
exports.deleteStory = async (req, res) => {
    const storyId = req.params.id;
    try {
        const storyPaths = await InteractiveStory.getStoryPaths(storyId);

        if (!storyPaths) {
            return res.status(404).send({ message: "Cerita tidak ditemukan." });
        }

        if (storyPaths.cover_image) {
            deleteFile(storyPaths.cover_image);
        }

        if (storyPaths.story_data) {
            try {
                // [DIHAPUS] JSON.parse() dihapus. story_data sudah jadi objek.
                const storyData = storyPaths.story_data; 
                for (const key in storyData) {
                    if (storyData[key] && storyData[key].image) {
                        deleteFile(storyData[key].image);
                    }
                }
            } catch (e) {
                console.error("Gagal memproses story_data saat menghapus file:", e);
            }
        }

        const affectedRows = await InteractiveStory.delete(storyId);
        if (affectedRows === 0) {
            return res.status(404).send({ message: "Cerita tidak ditemukan." });
        }
        
        res.status(200).send({ message: "Cerita dan semua file terkait berhasil dihapus." });
    
    } catch (error) {
        console.error("DELETE STORY ERROR:", error);
        res.status(500).send({ message: "Gagal menghapus cerita." });
    }
};

exports.getStorySubmissions = async (req, res) => {
    try {
        const submissions = await InteractiveStory.getSubmissions(req.params.id);
        res.status(200).json(submissions);
    } catch (error) {
        res.status(500).send({ message: "Gagal mengambil data pengerjaan." });
    }
};