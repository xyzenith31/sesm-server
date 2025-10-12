// contoh-server-sesm/routes/materi.routes.js
const { authJwt } = require("../middlewares");
const { materiController } = require("../controllers");
const upload = require("../middlewares/upload.middleware.js");

module.exports = function (app) {
  app.use(function (req, res, next) {
    res.header(
      "Access-Control-Allow-Headers",
      "x-access-token, Origin, Content-Type, Accept"
    );
    next();
  });

  // === RUTE UNTUK SISWA ===
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
  
  app.get(
    "/api/mapel/:jenjang/:kelas/:namaMapel",
    [authJwt.verifyToken],
    materiController.getChaptersBySubjectName
  );

  app.get(
    "/api/mapel/:jenjang/:namaMapel",
    [authJwt.verifyToken],
    materiController.getChaptersBySubjectName
  );

  // === RUTE UNTUK GURU / ADMIN ===
  const adminPrefix = "/api/admin";

  // --- RUTE BARU UNTUK BANK SOAL ---
  app.get(
    `${adminPrefix}/all-questions`,
    [authJwt.verifyToken, authJwt.isGuru],
    materiController.getAllQuestionsForBank
  );

  // Rute Manajemen Materi
  app.get(
    `${adminPrefix}/materi`,
    [authJwt.verifyToken, authJwt.isGuru],
    materiController.getMateriForAdmin
  );

  app.get(
    `${adminPrefix}/materi/:materiKey`,
    [authJwt.verifyToken, authJwt.isGuru],
    materiController.getDetailMateriForAdmin
  );

  app.post(
    `${adminPrefix}/materi/chapters`,
    [authJwt.verifyToken, authJwt.isGuru],
    materiController.addChapter
  );

  app.post(
    `${adminPrefix}/materi/:materiKey/questions`,
    [authJwt.verifyToken, authJwt.isGuru, upload.array('media', 5)],
    materiController.addQuestion
  );
  
  // --- RUTE BARU UNTUK EDIT SOAL ---
  app.put(
    `${adminPrefix}/materi/questions/:questionId`,
    [authJwt.verifyToken, authJwt.isGuru, upload.array('media', 5)],
    materiController.updateQuestion
  );

  app.delete(
    `${adminPrefix}/materi/chapters/:materiKey`,
    [authJwt.verifyToken, authJwt.isGuru],
    materiController.deleteChapter
  );

  app.delete(
    `${adminPrefix}/materi/questions/:questionId`,
    [authJwt.verifyToken, authJwt.isGuru],
    materiController.deleteQuestion
  );
};