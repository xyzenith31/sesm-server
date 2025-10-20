// contoh-server-sesm/controllers/quiz.controller.js
const Quiz = require("../models/quiz.model.js");
const Point = require("../models/point.model.js"); // Impor model Point

// === FUNGSI DIPERBARUI: updateQuizSettings (Menambah setting_allow_repeat_points) ===
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
        setting_strict_scoring,
        setting_points_per_correct,
        setting_allow_repeat_points // <-- Tambahkan setting baru
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
        setting_points_per_correct,
        setting_allow_repeat_points // <-- Tambahkan setting baru
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
            console.warn(`[WARN] Quiz settings update affected 0 rows for quizId: ${quizId}.`);
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


// === FUNGSI DIPERBARUI: submitQuiz (Logika Poin Utama) ===
exports.submitQuiz = async (req, res) => {
    const userId = req.userId;
    const { quizId } = req.params;
    const { answers } = req.body; // answers: [{ questionId: ..., answer: ... }]
    const numericQuizId = parseInt(quizId, 10);

    if (!answers || !Array.isArray(answers)) {
        return res.status(400).send({ message: "Format jawaban tidak valid." });
    }
    if (isNaN(numericQuizId)) {
        return res.status(400).send({ message: "ID Kuis tidak valid." });
    }

    try {
        // 1. Cek apakah user sudah pernah submit kuis ini
        const alreadySubmitted = await Quiz.checkIfSubmitted(userId, numericQuizId);
        console.log(`[INFO] User ${userId} already submitted quiz ${numericQuizId}? ${alreadySubmitted}`);

        // 2. Ambil info kuis (termasuk setting allowRepeatPoints)
        const quizInfo = await Quiz.findById(numericQuizId);
        if (!quizInfo) {
             return res.status(404).send({ message: "Kuis tidak ditemukan." });
        }
        const allowRepeatPoints = quizInfo.allowRepeatPoints; // Ambil setting dari info kuis
        console.log(`[INFO] Quiz ${numericQuizId} allowRepeatPoints setting: ${allowRepeatPoints}`);

        // 3. Proses submit jawaban (kalkulasi skor & poin oleh model)
        const result = await Quiz.submit(userId, numericQuizId, answers);
        const calculatedPoints = result.pointsEarned; // Poin hasil perhitungan
        const percentageScore = result.score;
        let pointsAwarded = 0; // Poin yang *benar-benar* diberikan

        // 4. Tentukan apakah poin akan diberikan
        if (!alreadySubmitted || allowRepeatPoints) {
            pointsAwarded = calculatedPoints; // Berikan poin hasil kalkulasi
            if (pointsAwarded > 0) {
                console.log(`[INFO] Awarding ${pointsAwarded} points to user ${userId} for quiz ${numericQuizId}.`);
                await Point.addPoints(
                    userId,
                    pointsAwarded,
                    'QUIZ_COMPLETION',
                    `Menyelesaikan kuis: ${quizInfo.title} ID ${numericQuizId}` // Tambah ID ke detail
                );
            } else {
                 console.log(`[INFO] Calculated points is 0 or less (${calculatedPoints}), skipping Point.addPoints for user ${userId}.`);
            }
        } else {
            console.log(`[INFO] User ${userId} already submitted quiz ${numericQuizId} and repeat points are disallowed. Awarding 0 points.`);
            pointsAwarded = 0; // Tidak dapat poin jika sudah submit dan repeat tidak diizinkan
        }

        // 5. Kirim response
        const responseMessage = alreadySubmitted && !allowRepeatPoints
            ? `Kuis berhasil dikumpulkan kembali. Anda sudah pernah mendapatkan poin untuk kuis ini.`
            : `Kuis berhasil dikumpulkan! Anda mendapatkan ${pointsAwarded} poin.`;

        console.log(`[SUCCESS] Quiz submission processed for user ${userId}, quiz ${numericQuizId}. Points Awarded: ${pointsAwarded}, Score: ${percentageScore}%`);

        res.status(200).send({
            message: responseMessage,
            submissionId: result.submissionId,
            pointsEarned: pointsAwarded, // Kirim poin yang BENAR-BENAR diberikan
            score: percentageScore
        });

    } catch (error) {
        console.error(`[FATAL] Error during submitQuiz controller for user ${userId}, quiz ${numericQuizId}:`, error);
        res.status(500).send({ message: `Gagal memproses jawaban: ${error.message}` });
    }
};

// --- Fungsi Lainnya ---
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
        const quizData = await Quiz.getQuestionsForQuiz(req.params.quizId);
        if (!quizData || (quizData.questions.length === 0 && Object.keys(quizData.settings || {}).length === 0)) {
             return res.status(404).send({ message: "Kuis tidak ditemukan atau belum memiliki soal." });
        }
        res.status(200).json(quizData);
    } catch (error) {
        console.error(`[ERROR] Failed to get quiz for student ${req.params.quizId}:`, error);
        res.status(500).send({ message: `Gagal mengambil data kuis: ${error.message}` });
    }
};

exports.createQuiz = async (req, res) => {
    try {
        const { title, description, recommended_level } = req.body;
        const creatorId = req.userId;

        console.log("[DEBUG] createQuiz - Received data:", { title, description, recommended_level, creatorId });
        console.log("[DEBUG] createQuiz - File:", req.file);

        if (!title) {
            console.error("[ERROR] createQuiz - Title is missing");
            return res.status(400).send({ message: "Judul kuis tidak boleh kosong." });
        }
        if (!creatorId) {
            console.error("[ERROR] createQuiz - Creator ID (req.userId) is missing");
            return res.status(401).send({ message: "Otentikasi gagal, ID pembuat tidak ditemukan." });
        }

        const coverImageUrl = req.file ? req.file.path.replace(/\\/g, "/") : null;
        console.log("[DEBUG] createQuiz - coverImageUrl:", coverImageUrl);

        const newQuiz = await Quiz.create(title, description, creatorId, coverImageUrl, recommended_level);

        console.log("[SUCCESS] createQuiz - Quiz created:", newQuiz);
        res.status(201).send({ message: "Kuis berhasil dibuat!", data: newQuiz });

    } catch (error) {
        console.error("[FATAL] ERROR SAAT CREATE QUIZ:", error);
        res.status(500).send({
            message: "Terjadi kesalahan internal saat membuat kuis.",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
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

exports.getQuizDetailsForAdmin = async (req, res) => {
    try {
        const questions = await Quiz.getQuestionsForAdmin(req.params.quizId);
        res.status(200).json(questions);
    } catch (error) {
         console.error(`[ERROR] Failed to get admin details for quiz ${req.params.quizId}:`, error);
         res.status(500).send({ message: `Gagal mengambil detail kuis: ${error.message}` });
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

exports.addQuestionToQuiz = async (req, res) => {
    const { quizId } = req.params;
    const { question_text, question_type, options, links, essayAnswer } = req.body;

    if (!question_text || !question_type) {
        return res.status(400).send({ message: "Teks pertanyaan dan tipe soal wajib diisi." });
    }

    try {
        const media_attachments = [];
        if (req.files && req.files.length > 0) {
            req.files.forEach(file => {
                 if (file.path) {
                    media_attachments.push({ type: 'file', url: file.path.replace(/\\/g, "/") });
                 } else {
                     console.warn(`[WARN] Uploaded file missing path during addQuestionToQuiz ${quizId}:`, file.originalname);
                 }
            });
        }
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

        const questionData = {
            question_text,
            question_type,
            options: parsedOptions,
            essayAnswer: essayAnswer || null,
            media_attachments: media_attachments,
        };

        const newQuestion = await Quiz.addQuestion(quizId, questionData);
        console.log(`[SUCCESS] Question added successfully to quiz ${quizId}. New ID: ${newQuestion.id}`);
        res.status(201).send({ message: "Soal berhasil ditambahkan.", data: newQuestion });

    } catch (error) {
        console.error(`[FATAL] Error during addQuestionToQuiz controller for ${quizId}:`, error);
        res.status(500).send({ message: `Terjadi kesalahan internal saat menambah soal: ${error.message}` });
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

exports.updateQuestion = async (req, res) => {
    const { questionId } = req.params;
    const { question_text, question_type, options, existingMedia, links, essayAnswer } = req.body;

    if (!question_text || !question_type) {
        console.warn(`[WARN] Missing question_text or question_type for updateQuestion ${questionId}`);
        return res.status(400).send({ message: "Teks pertanyaan dan tipe soal wajib diisi." });
    }

    try {
        const media_attachments = [];
        if (req.files && req.files.length > 0) {
            req.files.forEach(file => {
                 if (file.path) {
                    media_attachments.push({ type: 'file', url: file.path.replace(/\\/g, "/") });
                } else {
                     console.warn(`[WARN] Uploaded file missing path for question ${questionId}:`, file.originalname);
                }
            });
        }
        if (existingMedia) {
             try {
                const parsedExistingMedia = JSON.parse(existingMedia);
                const validExistingMedia = parsedExistingMedia.filter(item => item && item.type && item.url);
                media_attachments.push(...validExistingMedia);
            } catch (e) {
                console.error(`[ERROR] Failed to parse existingMedia JSON for question ${questionId}:`, existingMedia, e);
            }
        }
        if (links) {
            try {
                const parsedLinks = JSON.parse(links);
                const validLinks = parsedLinks.filter(link => link && typeof link === 'string' && link.startsWith('http'));
                validLinks.forEach(linkUrl => {
                    media_attachments.push({ type: 'link', url: linkUrl });
                });
            } catch (e) {
                 console.error(`[ERROR] Failed to parse links JSON for question ${questionId}:`, links, e);
            }
        }

        let parsedOptions = [];
        if (question_type && question_type.includes('pilihan-ganda')) {
            if (options) {
                 try {
                    parsedOptions = JSON.parse(options);
                    if (!Array.isArray(parsedOptions)) {
                         console.warn(`[WARN] Invalid options format (not an array) for question ${questionId}`);
                         return res.status(400).send({ message: "Format opsi jawaban tidak valid (harus array)." });
                    }
                    if (parsedOptions.length > 0 && !parsedOptions.some(o => o && o.isCorrect)) {
                         console.warn(`[WARN] No correct answer provided for multiple choice question ${questionId}`);
                        return res.status(400).send({ message: "Harus ada setidaknya satu jawaban benar untuk pilihan ganda." });
                    }
                } catch (e) {
                     console.error(`[ERROR] Failed to parse options JSON for question ${questionId}:`, options, e);
                    return res.status(400).send({ message: "Format data opsi JSON tidak valid." });
                }
            }
        }

        const questionData = {
            question_text,
            question_type,
            options: parsedOptions,
            essayAnswer: essayAnswer || null,
            media_attachments: media_attachments,
        };

        console.log(`[DEBUG] Data being sent to Quiz.updateQuestion for ${questionId}:`, JSON.stringify(questionData, null, 2));

        const updatedQuestion = await Quiz.updateQuestion(questionId, questionData);
        console.log(`[SUCCESS] Question ${questionId} updated successfully.`);
        res.status(200).send({ message: "Soal berhasil diperbarui.", data: updatedQuestion });

    } catch (error) {
        console.error(`[FATAL] Error during updateQuestion controller for ${questionId}:`, error);
        res.status(500).send({ message: `Terjadi kesalahan saat memperbarui soal: ${error.message}` });
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