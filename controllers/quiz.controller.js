// contoh-server-sesm/controllers/quiz.controller.js
const Quiz = require("../models/quiz.model.js");
const Point = require("../models/point.model.js"); // Impor model Point

// === FUNGSI DIPERBARUI: updateQuizSettings ===
exports.updateQuizSettings = async (req, res) => {
    const quizId = parseInt(req.params.quizId, 10);
    // Ambil semua setting yang relevan dari body
    const {
        setting_is_timer_enabled,
        setting_time_per_question,
        setting_randomize_questions,
        setting_randomize_answers,
        setting_show_leaderboard,
        setting_show_memes,
        setting_allow_redemption,
        setting_strict_scoring, // <-- BARU
        setting_points_per_correct // <-- BARU
     } = req.body;

     // Buat objek settings yang akan dikirim ke model
     const settings = {
        setting_is_timer_enabled,
        setting_time_per_question,
        setting_randomize_questions,
        setting_randomize_answers,
        setting_show_leaderboard,
        setting_show_memes,
        setting_allow_redemption,
        setting_strict_scoring,
        setting_points_per_correct
     };

    // --- LOGGING UNTUK DEBUGGING ---
    console.log(`[INFO] Request to update settings for quizId: ${req.params.quizId}`);
    console.log(`[DATA] Received settings payload:`, settings);

    if (isNaN(quizId)) {
        console.error(`[ERROR] Invalid quizId received: ${req.params.quizId}`);
        return res.status(400).send({ message: "ID Kuis tidak valid." });
    }

    try {
        // Kirim objek settings ke model
        const result = await Quiz.updateSettings(quizId, settings);
        if (result.affectedRows === 0) {
            // Ini bisa terjadi jika quizId tidak ada ATAU jika tidak ada field valid yang diupdate
             console.warn(`[WARN] Quiz settings update affected 0 rows for quizId: ${quizId}.`);
             // Kita anggap sukses jika tidak ada error, mungkin hanya tidak ada yg perlu diupdate
            // return res.status(404).send({ message: `Kuis dengan ID ${quizId} tidak ditemukan atau tidak ada pengaturan valid yang diubah.` });
        }
        console.log(`[SUCCESS] Settings for quizId: ${quizId} updated (affected rows: ${result.affectedRows}).`);
        res.status(200).send({ message: "Pengaturan kuis berhasil diperbarui." });
    } catch (error) {
        console.error(`[FATAL] Error updating settings for quizId: ${quizId}`, error);
        res.status(500).send({
            message: "Terjadi kesalahan internal pada server saat update pengaturan.",
            error: error.message // Kirim pesan error asli untuk debug
        });
    }
};

// === FUNGSI EDIT SOAL ===
exports.updateQuestion = async (req, res) => {
    const { questionId } = req.params;
     // Ambil semua field yang mungkin dari body
    const { question_text, question_type, options, existingMedia, links, essayAnswer } = req.body;

    // Validasi dasar
    if (!question_text || !question_type) {
        console.warn(`[WARN] Missing question_text or question_type for updateQuestion ${questionId}`);
        return res.status(400).send({ message: "Teks pertanyaan dan tipe soal wajib diisi." });
    }

    try {
        // Proses media (gabungkan file baru dan existing/link)
        const media_attachments = [];
        // File baru yang diupload (jika ada)
        if (req.files && req.files.length > 0) {
            req.files.forEach(file => {
                 // Pastikan path ada sebelum menambahkannya
                if (file.path) {
                    media_attachments.push({ type: 'file', url: file.path.replace(/\\/g, "/") });
                } else {
                     console.warn(`[WARN] Uploaded file missing path for question ${questionId}:`, file.originalname);
                }
            });
        }
         // Media existing (yang tidak dihapus dari frontend)
        if (existingMedia) {
             try {
                const parsedExistingMedia = JSON.parse(existingMedia);
                // Filter hanya item yang valid (punya type dan url)
                const validExistingMedia = parsedExistingMedia.filter(item => item && item.type && item.url);
                media_attachments.push(...validExistingMedia);
            } catch (e) {
                console.error(`[ERROR] Failed to parse existingMedia JSON for question ${questionId}:`, existingMedia, e);
                 // Jangan hentikan proses, lanjutkan tanpa existing media jika parse gagal
            }
        }
        // Links (jika ada)
        if (links) {
            try {
                const parsedLinks = JSON.parse(links);
                // Filter hanya link yang valid
                const validLinks = parsedLinks.filter(link => link && typeof link === 'string' && link.startsWith('http'));
                validLinks.forEach(linkUrl => {
                    media_attachments.push({ type: 'link', url: linkUrl });
                });
            } catch (e) {
                 console.error(`[ERROR] Failed to parse links JSON for question ${questionId}:`, links, e);
            }
        }


        // Proses Opsi Jawaban
        let parsedOptions = []; // Default array kosong
        if (question_type && question_type.includes('pilihan-ganda')) {
            if (options) {
                 try {
                    parsedOptions = JSON.parse(options);
                    // Validasi: harus array dan minimal ada 1 jawaban benar
                    if (!Array.isArray(parsedOptions)) {
                         console.warn(`[WARN] Invalid options format (not an array) for question ${questionId}`);
                         return res.status(400).send({ message: "Format opsi jawaban tidak valid (harus array)." });
                    }
                     // Pastikan minimal ada satu jawaban benar jika ada opsi
                    if (parsedOptions.length > 0 && !parsedOptions.some(o => o && o.isCorrect)) {
                         console.warn(`[WARN] No correct answer provided for multiple choice question ${questionId}`);
                        return res.status(400).send({ message: "Harus ada setidaknya satu jawaban benar untuk pilihan ganda." });
                    }
                } catch (e) {
                     console.error(`[ERROR] Failed to parse options JSON for question ${questionId}:`, options, e);
                    return res.status(400).send({ message: "Format data opsi JSON tidak valid." });
                }
            } else {
                 // Jika tipe PG tapi tidak ada opsi dikirim, mungkin frontend error?
                 console.warn(`[WARN] Multiple choice question type received without options for question ${questionId}`);
                 // Kita bisa set parsedOptions ke array kosong atau return error, tergantung kebutuhan
                 // return res.status(400).send({ message: "Opsi jawaban dibutuhkan untuk tipe soal pilihan ganda." });
            }
        }

        // Siapkan data untuk dikirim ke model
        const questionData = {
            question_text,
            question_type,
            options: parsedOptions, // Akan kosong jika bukan PG atau jika ada error parse
            essayAnswer: essayAnswer || null, // Pastikan null jika kosong
            media_attachments: media_attachments,
        };

        console.log(`[DEBUG] Data being sent to Quiz.updateQuestion for ${questionId}:`, JSON.stringify(questionData, null, 2));


        // Panggil model untuk update
        const updatedQuestion = await Quiz.updateQuestion(questionId, questionData);
        console.log(`[SUCCESS] Question ${questionId} updated successfully.`);
        res.status(200).send({ message: "Soal berhasil diperbarui.", data: updatedQuestion });

    } catch (error) {
        console.error(`[FATAL] Error during updateQuestion controller for ${questionId}:`, error);
        res.status(500).send({ message: `Terjadi kesalahan saat memperbarui soal: ${error.message}` });
    }
};

exports.updateQuiz = async (req, res) => {
    const { quizId } = req.params;
    const { title, description, recommended_level } = req.body; // Ambil data dari body

    if (!title) {
        // Hapus file yang terlanjur diupload jika validasi gagal
        if (req.file) deleteFile(req.file.path.replace(/\\/g, "/"));
        return res.status(400).send({ message: "Judul kuis tidak boleh kosong." });
    }

    try {
        // Siapkan data untuk diupdate di model
        const dataToUpdate = {
            title,
            description: description || null,
            recommended_level: recommended_level || 'Semua',
        };

        // Cek apakah ada file gambar sampul baru diupload
        if (req.file) {
            dataToUpdate.cover_image_url = req.file.path.replace(/\\/g, "/"); // Path file baru
            console.log(`[Update Quiz ${quizId}] New cover image uploaded:`, dataToUpdate.cover_image_url);
        } else {
             // Jika tidak ada file baru, kita tidak mengirim cover_image_url
             // Model akan menangani apakah file lama perlu dihapus atau tidak
             console.log(`[Update Quiz ${quizId}] No new cover image uploaded.`);
        }

        console.log(`[Update Quiz ${quizId}] Data to update in model:`, dataToUpdate);

        // Panggil fungsi model untuk update (buat fungsi ini di quiz.model.js)
        const affectedRows = await Quiz.updateById(quizId, dataToUpdate);

        if (affectedRows === 0) {
            // Hapus file baru jika update gagal (misal quizId tidak ditemukan)
            if (req.file) deleteFile(dataToUpdate.cover_image_url);
            console.warn(`[Update Quiz ${quizId}] Quiz not found or no changes made.`);
            return res.status(404).send({ message: "Kuis tidak ditemukan atau tidak ada data yang diubah." });
        }

        console.log(`[Update Quiz ${quizId}] Quiz updated successfully.`);
        res.status(200).send({ message: "Detail kuis berhasil diperbarui." });

    } catch (error) {
        // Hapus file baru jika terjadi error server
        if (req.file) deleteFile(req.file?.path.replace(/\\/g, "/"));
        console.error(`[FATAL] Error updating quiz ${quizId}:`, error);
        res.status(500).send({ message: "Gagal memperbarui detail kuis.", error: error.message });
    }
};

// === FUNGSI TAMBAH SOAL ===
exports.addQuestionToQuiz = async (req, res) => {
    const { quizId } = req.params;
    // Ambil semua field yang mungkin
    const { question_text, question_type, options, links, essayAnswer } = req.body;

    // Validasi dasar
    if (!question_text || !question_type) {
        return res.status(400).send({ message: "Teks pertanyaan dan tipe soal wajib diisi." });
    }

    try {
        // Proses media (file upload dan link)
        const media_attachments = [];
        // File baru
        if (req.files && req.files.length > 0) {
            req.files.forEach(file => {
                 if (file.path) {
                    media_attachments.push({ type: 'file', url: file.path.replace(/\\/g, "/") });
                 } else {
                     console.warn(`[WARN] Uploaded file missing path during addQuestionToQuiz ${quizId}:`, file.originalname);
                 }
            });
        }
        // Links
        if (links) {
            try {
                const parsedLinks = JSON.parse(links);
                const validLinks = parsedLinks.filter(link => link && typeof link === 'string' && link.startsWith('http'));
                validLinks.forEach(linkUrl => {
                    media_attachments.push({ type: 'link', url: linkUrl });
                });
            } catch (e) {
                 console.error(`[ERROR] Failed to parse links JSON for addQuestionToQuiz ${quizId}:`, links, e);
            }
        }

        // Proses Opsi Jawaban
        let parsedOptions = [];
        if (question_type && question_type.includes('pilihan-ganda')) {
            if (options) {
                 try {
                    parsedOptions = JSON.parse(options);
                    if (!Array.isArray(parsedOptions) || parsedOptions.length < 2 || !parsedOptions.some(o => o && o.isCorrect)) {
                        return res.status(400).send({ message: "Pilihan ganda harus memiliki minimal 2 opsi dan satu jawaban benar." });
                    }
                } catch (e) {
                     console.error(`[ERROR] Failed to parse options JSON for addQuestionToQuiz ${quizId}:`, options, e);
                    return res.status(400).send({ message: "Format data opsi JSON tidak valid." });
                }
            } else {
                return res.status(400).send({ message: "Opsi jawaban dibutuhkan untuk tipe soal pilihan ganda." });
            }
        }

        // Siapkan data untuk model
        const questionData = {
            question_text,
            question_type,
            options: parsedOptions,
            essayAnswer: essayAnswer || null,
            media_attachments: media_attachments,
        };

        // Panggil model
        const newQuestion = await Quiz.addQuestion(quizId, questionData);
        console.log(`[SUCCESS] Question added successfully to quiz ${quizId}. New ID: ${newQuestion.id}`);
        res.status(201).send({ message: "Soal berhasil ditambahkan.", data: newQuestion });

    } catch (error) {
        console.error(`[FATAL] Error during addQuestionToQuiz controller for ${quizId}:`, error);
        res.status(500).send({ message: `Terjadi kesalahan internal saat menambah soal: ${error.message}` });
    }
};


// === FUNGSI DIPERBARUI: submitQuiz ===
exports.submitQuiz = async (req, res) => {
    const userId = req.userId;
    const { quizId } = req.params;
    const { answers } = req.body; // answers: [{ questionId: ..., answer: ... }]

    if (!answers || !Array.isArray(answers)) {
        return res.status(400).send({ message: "Format jawaban tidak valid." });
    }

    try {
        // 1. Proses submit kuis menggunakan model yang sudah dimodifikasi
        // Model sekarang mengembalikan { submissionId, pointsEarned, score }
        const result = await Quiz.submit(userId, quizId, answers);
        const pointsEarned = result.pointsEarned; // Ambil total poin yang didapat
        const percentageScore = result.score; // Ambil skor persentase

        // 2. Tambahkan poin ke riwayat poin pengguna
        const quizInfo = await Quiz.findById(quizId); // Ambil info kuis untuk detail aktivitas

        // Hanya tambahkan poin jika poin yang didapat > 0
        if (pointsEarned > 0) {
             console.log(`[INFO] Calling Point.addPoints for user ${userId}, points: ${pointsEarned}`);
             // !!! Poin ditambahkan HANYA SEKALI di sini dengan TOTAL POIN !!!
             await Point.addPoints(
                userId,
                pointsEarned, // Gunakan total poin yang didapat
                'QUIZ_COMPLETION',
                `Menyelesaikan kuis: ${quizInfo ? quizInfo.title : `ID ${quizId}`}`
            );
             console.log(`[INFO] Point.addPoints finished for user ${userId}`);
        } else {
             console.log(`[INFO] Skipping Point.addPoints for user ${userId} because pointsEarned is ${pointsEarned}.`);
        }


        // 3. Kirim response ke user, sesuaikan pesan
        const responseMessage = pointsEarned > 0
            ? `Kuis berhasil dikumpulkan dan Anda mendapatkan ${pointsEarned} poin!`
            : `Kuis berhasil dikumpulkan. Anda mendapatkan ${pointsEarned} poin kali ini.`;

        console.log(`[INFO] Quiz submission successful for user ${userId}, quiz ${quizId}. Points: ${pointsEarned}, Score: ${percentageScore}`);

        res.status(200).send({
            message: responseMessage,
            submissionId: result.submissionId,
            pointsEarned: pointsEarned, // Kirim total poin yang didapat
            score: percentageScore // Kirim juga skor persentase
        });

    } catch (error) {
        console.error(`[FATAL] Error during submitQuiz controller for user ${userId}, quiz ${quizId}:`, error);
        res.status(500).send({ message: `Gagal memproses jawaban: ${error.message}` });
    }
};

// --- Fungsi Lain (Tetap Sama) ---
exports.createQuiz = async (req, res) => {
    try {
        const { title, description, recommended_level } = req.body;
        const creatorId = req.userId; // Pastikan middleware authJwt bekerja dan mengisi ini

        console.log("[DEBUG] createQuiz - Received data:", { title, description, recommended_level, creatorId }); // Tambah log
        console.log("[DEBUG] createQuiz - File:", req.file); // Log info file

        if (!title) {
            console.error("[ERROR] createQuiz - Title is missing");
            return res.status(400).send({ message: "Judul kuis tidak boleh kosong." });
        }
        if (!creatorId) {
            console.error("[ERROR] createQuiz - Creator ID (req.userId) is missing");
            return res.status(401).send({ message: "Otentikasi gagal, ID pembuat tidak ditemukan." });
        }

        // Path gambar, pastikan tidak error jika req.file tidak ada
        const coverImageUrl = req.file ? req.file.path.replace(/\\/g, "/") : null;
        console.log("[DEBUG] createQuiz - coverImageUrl:", coverImageUrl);

        // Panggil model
        const newQuiz = await Quiz.create(title, description, creatorId, coverImageUrl, recommended_level);

        console.log("[SUCCESS] createQuiz - Quiz created:", newQuiz);
        res.status(201).send({ message: "Kuis berhasil dibuat!", data: newQuiz });

    } catch (error) {
        // Log error lengkap di server
        console.error("[FATAL] ERROR SAAT CREATE QUIZ:", error);
        res.status(500).send({
            message: "Terjadi kesalahan internal saat membuat kuis.",
            // Kirim detail error HANYA saat development, jangan di produksi
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

exports.addQuestionsFromBank = async (req, res) => {
    const { quizId } = req.params;
    const { questionIds } = req.body;
    if (!questionIds || !Array.isArray(questionIds) || questionIds.length === 0) return res.status(400).send({ message: "Daftar ID soal tidak valid." });
    try {
        const questionsAdded = await Quiz.addQuestionsFromBank(quizId, questionIds);
        res.status(201).send({ message: `${questionsAdded} soal berhasil ditambahkan dari bank.` });
    } catch (error) {
        console.error("Add from Bank Error:", error);
        res.status(500).send({ message: "Terjadi kesalahan saat menambah soal dari bank." });
    }
};

exports.deleteQuiz = async (req, res) => {
    try {
        const affectedRows = await Quiz.delete(req.params.quizId);
        if (affectedRows === 0) return res.status(404).send({ message: "Kuis tidak ditemukan." });
        res.status(200).send({ message: "Kuis berhasil dihapus." });
    } catch (error) {
         console.error(`[ERROR] Failed to delete quiz ${req.params.quizId}:`, error);
         res.status(500).send({ message: `Gagal menghapus kuis: ${error.message}` });
    }
};

exports.deleteQuestion = async (req, res) => {
    try {
        const affectedRows = await Quiz.deleteQuestion(req.params.questionId);
        if (affectedRows === 0) return res.status(404).send({ message: "Soal tidak ditemukan." });
        res.status(200).send({ message: "Soal berhasil dihapus." });
    } catch (error) {
         console.error(`[ERROR] Failed to delete question ${req.params.questionId}:`, error);
         res.status(500).send({ message: `Gagal menghapus soal: ${error.message}` });
    }
};

exports.getQuizDetailsForAdmin = async (req, res) => {
    try {
        const questions = await Quiz.getQuestionsForAdmin(req.params.quizId);
        res.status(200).json(questions);
    } catch (error) {
         console.error(`[ERROR] Failed to get admin details for quiz ${req.params.quizId}:`, error);
         res.status(500).send({ message: `Gagal mengambil detail kuis: ${error.message}` });
     }
};

exports.listAllQuizzes = async (req, res) => {
    try {
        const quizzes = await Quiz.getAll();
        res.status(200).json(quizzes);
    } catch (error) {
         console.error("[ERROR] Failed to list all quizzes:", error);
         res.status(500).send({ message: `Gagal mengambil daftar kuis: ${error.message}` });
     }
};

exports.getQuizForStudent = async (req, res) => {
    try {
        // Model sekarang mengembalikan { questions, settings }
        const quizData = await Quiz.getQuestionsForQuiz(req.params.quizId);
        if (!quizData || (quizData.questions.length === 0 && Object.keys(quizData.settings || {}).length === 0)) { // Periksa settings juga
             // Handle kasus kuis tidak ditemukan
             return res.status(404).send({ message: "Kuis tidak ditemukan atau belum memiliki soal." });
        }
        res.status(200).json(quizData); // Kirim objek lengkap
    } catch (error) {
        console.error(`[ERROR] Failed to get quiz for student ${req.params.quizId}:`, error);
        res.status(500).send({ message: `Gagal mengambil data kuis: ${error.message}` });
    }
};

exports.getSubmissionsForQuiz = async (req, res) => {
    try {
        const submissions = await Quiz.getSubmissionsByQuizId(req.params.quizId);
        res.status(200).json(submissions);
    } catch (error) {
        console.error(`[ERROR] Error in getSubmissionsForQuiz controller for quiz ${req.params.quizId}:`, error);
        res.status(500).send({ message: `Gagal mengambil data submission kuis: ${error.message}` });
    }
};