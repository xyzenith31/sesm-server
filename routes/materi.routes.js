const { authJwt } = require("../middlewares");
const { materiController } = require("../controllers");

module.exports = function (app) {
  app.use(function (req, res, next) {
    res.header(
      "Access-Control-Allow-Headers",
      "x-access-token, Origin, Content-Type, Accept"
    );
    next();
  });

  // === RUTE UNTUK SISWA (Hanya GET) ===

  app.get(
    "/api/materi/:materiKey",
    [authJwt.verifyToken],
    materiController.getMateriSiswa
  );

  // --- PERBAIKAN FINAL ADA DI SINI ---
  // Kita definisikan dua rute terpisah untuk menangani SD (dengan kelas) dan TK (tanpa kelas).
  // Ini adalah cara yang paling kompatibel.

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

  app.post(
    `${adminPrefix}/:materiKey/questions`,
    [authJwt.verifyToken, authJwt.isGuru],
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