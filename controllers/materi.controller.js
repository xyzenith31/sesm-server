// contoh-server-sesm/controllers/materi.controller.js
const Materi = require("../models/materi.model.js");
const Point = require("../models/point.model.js"); // Impor model Point

// --- FUNGSI BARU ---
exports.addQuestionsFromBankToChapter = async (req, res) => {
    const { materiKey } = req.params;
    const { questionIds } = req.body;

    if (!questionIds || !Array.isArray(questionIds) || questionIds.length === 0) {
        return res.status(400).send({ message: "Daftar ID soal tidak valid." });
    }

    try {
        const questionsAdded = await Materi.addQuestionsFromBankToChapter(materiKey, questionIds);
        res.status(201).send({ message: `${questionsAdded} soal berhasil ditambahkan dari bank.` });
    } catch (error) {
        console.error("Add Questions from Bank to Chapter Error:", error);
        res.status(500).send({ message: "Terjadi kesalahan saat menambah soal dari bank." });
    }
};


exports.updateChapterSettings = async (req, res) => {
    const { chapterId } = req.params;
    const settings = req.body;
    if (typeof settings !== 'object' || settings === null || Object.keys(settings).length === 0) {
        return res.status(400).send({ message: "Data pengaturan tidak valid." });
    }
    try {
        const result = await Materi.updateChapterSettings(chapterId, settings);
        if (result.affectedRows === 0) {
            return res.status(404).send({ message: "Materi tidak ditemukan." });
        }
        res.status(200).send({ message: "Pengaturan materi berhasil diperbarui." });
    } catch (error) {
        console.error("Update Chapter Settings Error:", error);
        res.status(500).send({ message: "Terjadi kesalahan saat memperbarui pengaturan." });
    }
};

exports.submitAnswers = async (req, res) => {
    const userId = req.userId;
    const { materiKey } = req.params;
    const { answers } = req.body;

    try {
        const chapter = await Materi.findChapterByMateriKey(materiKey);
        if (!chapter) return res.status(404).send({ message: "Bab tidak ditemukan." });

        const pointsAwarded = 820; // Poin yang diberikan tetap
        let finalScore = null; // Skor akhir, null jika manual atau tidak ada PG
        const questions = await Materi.getQuestionsByChapterKey(materiKey);

        if (chapter.grading_mode === 'otomatis') {
            let correctMcCount = 0;
            let totalMcQuestions = 0;
            let anyWrong = false; // Flag jika ada jawaban salah

            // Buat submission ID *sebelum* loop jawaban
            const submissionId = await Materi.createSubmission(userId, chapter.id, null, true, 'selesai'); // Skor awal null

            for (const ans of answers) {
                const question = questions.find(q => q.id === ans.questionId);
                let isCorrect = null; // Default null untuk esai atau jika tidak ada kunci

                if (question) {
                    if (question.tipe_soal.includes('pilihan-ganda')) {
                        totalMcQuestions++;
                        // Periksa jawaban PG (case-insensitive & trim)
                        if (question.correctAnswer && (ans.answer || '').trim().toLowerCase() === question.correctAnswer.trim().toLowerCase()) {
                            isCorrect = true;
                            correctMcCount++;
                        } else {
                            isCorrect = false;
                            anyWrong = true; // Set flag jika ada PG yang salah
                        }
                    }
                    // Simpan jawaban siswa (esai akan memiliki isCorrect = null)
                    await Materi.saveStudentAnswer(submissionId, ans.questionId, ans.answer, isCorrect);
                } else {
                     console.warn(`Question ID ${ans.questionId} not found for materiKey ${materiKey}`);
                }
            }

            // Hitung skor persentase jika ada soal PG
            if (totalMcQuestions > 0) {
                 // Terapkan penalti jika ada (opsional, logika ini bisa dihilangkan jika tidak perlu)
                // Logika skor baru: Persentase
                finalScore = Math.round((correctMcCount / totalMcQuestions) * 100);

                // Terapkan setting 'Nilai Nol Jika Ada yang Salah'
                if (chapter.setting_fail_on_any_wrong && anyWrong) {
                    finalScore = 0;
                }

            } else {
                finalScore = 100; // Jika tidak ada PG, anggap 100 (atau null sesuai kebutuhan)
            }

            // Update skor di tabel submission
            await Materi.gradeSubmissionManually(submissionId, finalScore);

        } else { // Penilaian manual
            // Buat submission dengan status menunggu dan skor null
            const submissionId = await Materi.createSubmission(userId, chapter.id, null, false, 'menunggu'); // Status 'menunggu'
            for (const ans of answers) {
                 const questionExists = await Materi.checkQuestionExists(ans.questionId);
                 if(questionExists){
                     // Simpan jawaban dengan isCorrect = null
                    await Materi.saveStudentAnswer(submissionId, ans.questionId, ans.answer, null);
                 } else {
                     console.warn(`Question ID ${ans.questionId} not found for materiKey ${materiKey} in manual grading`);
                 }
            }
            finalScore = null; // Skor null untuk mode manual
        }

        // Tambahkan poin setelah submit (selalu dilakukan)
        await Point.addPoints(
            userId,
            pointsAwarded,
            'MATERI_COMPLETION',
            `Menyelesaikan materi: ${chapter.judul}`
        );

        const responseMessage = chapter.grading_mode === 'otomatis'
            ? `Jawaban berhasil dikumpulkan. Skor Pilihan Ganda Anda: ${finalScore !== null ? finalScore : 'N/A'}. Anda mendapatkan ${pointsAwarded} poin!`
            : `Jawaban berhasil dikumpulkan dan menunggu penilaian guru. Anda mendapatkan ${pointsAwarded} poin!`;

        res.status(200).send({
            message: responseMessage,
            score: finalScore, // Kirim skor (bisa null jika manual)
            pointsAwarded: pointsAwarded
        });

    } catch (error) {
        console.error("Submit Answer Error:", error);
        res.status(500).send({ message: "Terjadi kesalahan internal saat memproses jawaban." });
    }
};

exports.updateQuestion = async (req, res) => {
    const { questionId } = req.params;
    try {
        const mediaFiles = req.files;
        // Ambil lampiran yang sudah ada (existing) DARI body request
        const existing_attachments = req.body.attachments ? JSON.parse(req.body.attachments) : [];
        // Ambil file BARU yang diupload
        const new_media_objects = mediaFiles ? mediaFiles.map(file => ({ type: 'file', url: file.path.replace(/\\/g, "/") })) : [];

        // Gabungkan keduanya
        const all_media = [...existing_attachments, ...new_media_objects];

        const questionData = {
            ...req.body,
            options: req.body.options ? JSON.parse(req.body.options) : [],
            media_urls: all_media // Simpan gabungan media
        };
        const updatedQuestion = await Materi.updateQuestion(questionId, questionData);
        res.status(200).json({ message: "Soal berhasil diperbarui.", data: updatedQuestion });
    } catch (error) {
        console.error("Update Question Error:", error);
        res.status(500).send({ message: error.message });
    }
};

exports.addQuestion = async (req, res) => {
    const { materiKey } = req.params;
    try {
        const mediaFiles = req.files;
        const all_attachments = [];

        if (mediaFiles) {
            mediaFiles.forEach(file => {
                all_attachments.push({ type: 'file', url: file.path.replace(/\\/g, "/") });
            });
        }
        if (req.body.links) {
            const links = JSON.parse(req.body.links);
            links.forEach(link => all_attachments.push({ type: 'link', url: link.url }));
        }
        if (req.body.texts) {
            const texts = JSON.parse(req.body.texts);
            texts.forEach(text => all_attachments.push({ type: 'text', content: text.content }));
        }

        const questionData = {
            ...req.body,
            options: req.body.options ? JSON.parse(req.body.options) : [],
            media_urls: all_attachments
        };
        const newQuestion = await Materi.createQuestion(materiKey, questionData);
        res.status(201).json(newQuestion);
    } catch (error) {
        console.error("Add Question Error:", error);
        res.status(500).send({ message: error.message });
    }
};

exports.getAllQuestionsForBank = async (req, res) => {
    const { jenjang, kelas } = req.query;
    if (!jenjang) return res.status(400).send({ message: "Query 'jenjang' dibutuhkan." });
    try {
        const data = await Materi.getAllQuestionsForBank(jenjang, kelas);
        res.status(200).json(data);
    } catch (error) {
        res.status(500).send({ message: error.message });
    }
};

exports.getMateriForAdmin = async (req, res) => {
    const { jenjang, kelas } = req.query;
    if (!jenjang) return res.status(400).send({ message: "Query 'jenjang' dibutuhkan." });
    if (jenjang.toUpperCase() === 'SD' && !kelas) return res.status(400).send({ message: "Query 'kelas' dibutuhkan untuk jenjang SD." });
    try {
        const data = await Materi.getAdminDashboardData(jenjang, kelas);
        res.status(200).json(data);
    } catch (error) {
        res.status(500).send({ message: error.message });
    }
};

exports.getDetailMateriForAdmin = async (req, res) => {
    const { materiKey } = req.params;
    try {
        const chapter = await Materi.findChapterByMateriKey(materiKey);
        const questions = await Materi.getQuestionsByChapterKey(materiKey);
        res.status(200).json({
            judul: chapter ? chapter.judul : "Tidak Ditemukan",
            questions
        });
    } catch (error) {
        res.status(500).send({ message: error.message });
    }
};

exports.addChapter = async (req, res) => {
    const { judul, subjectId } = req.body;
    if (!judul || !subjectId) return res.status(400).send({ message: "Data 'judul' dan 'subjectId' dibutuhkan." });
    try {
        const newChapter = await Materi.createChapter(judul, subjectId);
        res.status(201).json(newChapter);
    } catch (error) {
        res.status(500).send({ message: error.message });
    }
};

exports.deleteChapter = async (req, res) => {
    const { materiKey } = req.params;
    try {
        const affectedRows = await Materi.deleteChapter(materiKey);
        if (affectedRows === 0) return res.status(404).send({ message: "Bab tidak ditemukan." });
        res.status(200).send({ message: "Bab berhasil dihapus." });
    } catch (error) {
        res.status(500).send({ message: error.message });
    }
};

exports.deleteQuestion = async (req, res) => {
    const { questionId } = req.params;
    try {
        const affectedRows = await Materi.deleteQuestion(questionId);
        if (affectedRows === 0) return res.status(404).send({ message: "Soal tidak ditemukan." });
        res.status(200).send({ message: "Soal dan file terkait berhasil dihapus." });
    } catch (error) {
        res.status(500).send({ message: error.message });
    }
};

exports.getChaptersBySubjectName = async (req, res) => {
    const { jenjang, kelas, namaMapel } = req.params;
    try {
        const chapters = await Materi.findChaptersBySubjectName(jenjang, kelas, namaMapel);
        res.status(200).json(chapters);
    } catch (error) {
        res.status(500).send({ message: error.message });
    }
};

exports.getMateriSiswa = async (req, res) => {
    const { materiKey } = req.params;
    try {
        const questionsWithAnswers = await Materi.getQuestionsByChapterKey(materiKey);
        // Hapus kunci jawaban sebelum dikirim ke siswa
        const questionsForSiswa = questionsWithAnswers.map(({ correctAnswer, jawaban_esai, ...q }) => q);
        res.status(200).json(questionsForSiswa);
    } catch (error) {
        res.status(500).send({ message: error.message });
    }
};