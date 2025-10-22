// src/controllers/challenge.controller.js
const Point = require("../models/point.model.js");
const db = require("../config/database.config.js"); // Untuk akses DB
const { dailyChallengesData } = require('../data/dailyChallengeDataStatic'); // Impor data statis
const seedrandom = require('seedrandom'); // <-- [PERBAIKAN 1] Impor library seedrandom

// --- Helper Functions ---

// [PERBAIKAN 2] Fungsi ini diupdate untuk menggunakan seeded random
const determineTodaysChallenges = (userId, count = 3) => {
    // Buat seed unik berdasarkan userId dan tanggal hari ini
    const todayStr = new Date().toISOString().split('T')[0]; // Format YYYY-MM-DD
    const seed = `${userId}-${todayStr}`;
    const rng = seedrandom(seed); // Inisialisasi generator angka acak

    // Log untuk debugging (opsional)
    // console.log(`[DEBUG] Generating challenges for seed: ${seed}`);

    // Acak array menggunakan generator yang sudah di-seed
    // Ini memastikan urutan acak yang sama untuk seed yang sama
    const shuffled = [...dailyChallengesData].sort(() => 0.5 - rng());
    return shuffled.slice(0, count).map(c => c.id); // Hanya kembalikan ID
};


// Fungsi untuk mendapatkan detail tantangan berdasarkan ID dari data statis
const getChallengeDetailsByIds = (ids) => {
    return dailyChallengesData.filter(c => ids.includes(c.id));
};

// Fungsi untuk memeriksa apakah tantangan sudah diselesaikan HARI INI
const checkCompletionStatus = async (userId, challengeIds) => {
    if (!challengeIds || challengeIds.length === 0) {
        return {};
    }
    const placeholders = challengeIds.map(() => '?').join(',');
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    const query = `
        SELECT challenge_id, points_awarded
        FROM daily_challenge_completions
        WHERE user_id = ? AND DATE(completion_date) = ? AND challenge_id IN (${placeholders})
    `;
    const params = [userId, today, ...challengeIds];

    try {
        const [rows] = await db.execute(query, params);
        const completionMap = {};
        rows.forEach(row => {
            completionMap[row.challenge_id] = { completed: true, points: row.points_awarded };
        });
        return completionMap;
    } catch (error) {
        console.error("Error checking completion status:", error);
        return {}; // Kembalikan objek kosong jika error
    }
};


// --- Controller Functions ---

exports.getTodaysChallenges = async (req, res) => {
    const userId = req.userId;
    try {
        // 1. Tentukan ID tantangan untuk hari ini (sekarang menggunakan seeded random)
        const todaysChallengeIds = determineTodaysChallenges(userId, 3); // Ambil 3 ID

        // 2. Ambil detail lengkap tantangan berdasarkan ID
        let challengesDetails = getChallengeDetailsByIds(todaysChallengeIds);

        // 3. Cek status penyelesaian dari database
        const completionStatus = await checkCompletionStatus(userId, todaysChallengeIds);

        // 4. Gabungkan detail dengan status penyelesaian
        challengesDetails = challengesDetails.map(challenge => {
            const status = completionStatus[challenge.id];
            return {
                ...challenge,
                // Pastikan 'quiz' tidak dikirim jika tidak ada atau manual check
                quiz: (challenge.quiz && challenge.type !== 'manual_check') ? challenge.quiz : undefined,
                type: challenge.type, // Kirim tipe
                completed: status?.completed || false,
                points: status?.points || 0, // Poin yg didapat HARI INI
                // Hapus correctAnswer dari data yang dikirim ke frontend
                correctAnswer: undefined
            };
        });

        res.status(200).json(challengesDetails);
    } catch (error) {
        console.error("Error in getTodaysChallenges:", error);
        res.status(500).send({ message: "Gagal mengambil tantangan harian." });
    }
};

exports.completeChallenge = async (req, res) => {
    const userId = req.userId;
    const { challengeId } = req.params;

    try {
        const today = new Date().toISOString().split('T')[0];

        // 1. Cek apakah sudah diselesaikan hari ini
        const [existing] = await db.execute(
            "SELECT id FROM daily_challenge_completions WHERE user_id = ? AND challenge_id = ? AND DATE(completion_date) = ?",
            [userId, challengeId, today]
        );

        if (existing.length > 0) {
            console.log(`[Challenge Complete] User ${userId} already completed challenge ${challengeId} today.`);
            return res.status(200).send({ message: "Tantangan sudah diselesaikan hari ini.", pointsAwarded: 0 });
        }

        // 2. Cari info tantangan (dari data statis dalam contoh ini)
        const challengeInfo = dailyChallengesData.find(c => c.id === challengeId);
        if (!challengeInfo) {
            return res.status(404).send({ message: "Tantangan tidak ditemukan." });
        }
        // Jangan proses jika tipe manual check
        if (challengeInfo.type === 'manual_check') {
             return res.status(400).send({ message: "Tantangan ini perlu dicek manual.", pointsAwarded: 0 });
        }


        // 3. Hitung poin random (ini tetap pakai Math.random biasa, tidak masalah)
        const randomPoints = Math.floor(Math.random() * (100 - 40 + 1)) + 40;

        // 4. Tambahkan poin menggunakan Point Model
        await Point.addPoints(
            userId,
            randomPoints,
            'DAILY_CHALLENGE',
            `Menyelesaikan tantangan: ${challengeInfo.title}`
        );

        // 5. Catat penyelesaian ke DB
        await db.execute(
            "INSERT INTO daily_challenge_completions (user_id, challenge_id, completion_date, points_awarded) VALUES (?, ?, NOW(), ?)",
            [userId, challengeId, randomPoints]
        );

        console.log(`[Challenge Complete] User ${userId} completed challenge ${challengeId}, awarded ${randomPoints} points.`);
        res.status(200).send({ message: "Tantangan berhasil diselesaikan!", pointsAwarded: randomPoints });

    } catch (error) {
        console.error("Error in completeChallenge:", error);
        res.status(500).send({ message: "Gagal memproses penyelesaian tantangan." });
    }
};

// exports.claimDailyReward = async (req, res) => { ... } // Implementasi jika diperlukan