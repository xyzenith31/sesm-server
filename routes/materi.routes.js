const { authJwt } = require("../middlewares");
const { materiController } = require("../controllers");
const upload = require("../middlewares/upload.middleware.js"); // 1. Impor middleware upload

module.exports = function (app) {
  app.use(function (req, res, next) {
    res.header(
      "Access-Control-Allow-Headers",
      "x-access-token, Origin, Content-Type, Accept"
    );
    next();
  });

  // === RUTE UNTUK SISWA (Hanya GET) ===

  // --- PERBAIKAN FINAL ADA DI SINI ---
  // Rute untuk submit jawaban diperbarui agar lebih fleksibel
  app.post(
    "/api/materi/:materiKey/submit",
    [authJwt.verifyToken],
    materiController.submitAnswers
  );

  app.get(
    "/api/materi/:materiKey",
    [authJwt.verifyToken],
    materiController.getMateriSiswa
  );
  
  // Rute untuk SD (membutuhkan jenjang dan kelas)
  app.get(
    "/api/mapel/:jenjang/:kelas/:namaMapel",
    [authJwt.verifyToken],
    materiController.getChaptersBySubjectName
  );

  // Rute untuk TK (hanya membutuhkan jenjang, tanpa kelas)
  app.get(
    "/api/mapel/:jenjang/:namaMapel",
    [authJwt.verifyToken],
    materiController.getChaptersBySubjectName
  );


  // === RUTE UNTUK GURU / ADMIN (CRUD LENGKAP & TERPROTEKSI) ===
  const adminPrefix = "/api/admin/materi";

  app.get(
    adminPrefix,
    [authJwt.verifyToken, authJwt.isGuru],
    materiController.getMateriForAdmin
  );

  app.get(
    `${adminPrefix}/:materiKey`,
    [authJwt.verifyToken, authJwt.isGuru],
    materiController.getDetailMateriForAdmin
  );

  app.post(
    `${adminPrefix}/chapters`,
    [authJwt.verifyToken, authJwt.isGuru],
    materiController.addChapter
  );

  // --- PERBAIKAN DI SINI ---
  // Tambahkan middleware upload.array('media', 5) untuk menangani hingga 5 file
  app.post(
    `${adminPrefix}/:materiKey/questions`,
    [authJwt.verifyToken, authJwt.isGuru, upload.array('media', 5)], // 2. Tambahkan middleware
    materiController.addQuestion
  );

  app.delete(
    `${adminPrefix}/chapters/:materiKey`,
    [authJwt.verifyToken, authJwt.isGuru],
    materiController.deleteChapter
  );

  app.delete(
    `${adminPrefix}/questions/:questionId`,
    [authJwt.verifyToken, authJwt.isGuru],
    materiController.deleteQuestion
  );
};