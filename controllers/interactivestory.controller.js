// contoh-sesm-server/controllers/interactivestory.controller.js
const InteractiveStory = require("../models/interactivestory.model.js");
const Point = require("../models/point.model.js");
const { v4: uuidv4 } = require('uuid');

// Fungsi helper untuk memproses data cerita dan memetakan gambar yang diunggah
const processStoryData = (body, files) => {
    if (!body.story_data) {
        return null;
    }
    let storyDataObject = JSON.parse(body.story_data);

    if (files && files.node_images) {
        const imageMap = {};
        files.node_images.forEach(file => {
            const nodeId = file.originalname;
            if (nodeId) {
                imageMap[nodeId] = file.path.replace(/\\/g, "/");
            }
        });

        for (const key in storyDataObject) {
            if (imageMap[key]) {
                storyDataObject[key].image = imageMap[key];
            }
        }
    }
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

// [PERBAIKAN] Parsing string JSON sebelum mengirim respons
exports.getStoryDataById = async (req, res) => {
    try {
        const storyDataString = await InteractiveStory.findById(req.params.id);
        if (storyDataString) {
            // Parse string dari database menjadi objek JSON
            res.status(200).json(JSON.parse(storyDataString));
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
                userId,
                pointsToAdd,
                'STORY_ENDING',
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
        const storyId = req.body.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').substring(0, 50) + '-' + uuidv4().substring(0, 4);
        
        const finalStoryData = processStoryData(req.body, req.files);
        const coverImageFile = req.files?.cover_image?.[0];

        const storyData = {
            id: storyId,
            title: req.body.title,
            synopsis: req.body.synopsis,
            category: req.body.category,
            read_time: parseInt(req.body.read_time) || 5,
            total_endings: parseInt(req.body.total_endings) || 1,
            cover_image: coverImageFile ? coverImageFile.path.replace(/\\/g, "/") : null,
            story_data: finalStoryData,
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
            storyData.cover_image = coverImageFile.path.replace(/\\/g, "/");
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

exports.deleteStory = async (req, res) => {
    try {
        const affectedRows = await InteractiveStory.delete(req.params.id);
        if (affectedRows === 0) {
            return res.status(404).send({ message: "Cerita tidak ditemukan." });
        }
        res.status(200).send({ message: "Cerita berhasil dihapus." });
    } catch (error) {
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