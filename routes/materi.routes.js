const controller = require("../controllers/materi.controller.js");
// Di sini kita bisa menambahkan middleware auth untuk guru di rute admin
// const { authJwt } = require("../middlewares");

module.exports = function(app) {
    // === RUTE UNTUK SISWA (PUBLIK) ===
    // GET /api/materi/pai_1 -> Siswa mengambil soal untuk dikerjakan
    app.get(
        "/api/materi/:materiKey",
        controller.getMateriByKey
    );

    // === RUTE UNTUK GURU (ADMIN) ===
    const adminPrefix = "/api/admin/materi";

    // GET /api/admin/materi -> Guru mengambil semua daftar bab untuk ditampilkan di dashboard
    app.get(
        adminPrefix,
        // [authJwt.verifyToken, authJwt.isGuru], // (Opsional) Bisa ditambahkan nanti untuk keamanan
        controller.getAllMateriForAdmin
    );

    // POST /api/admin/materi/pai_1/questions -> Guru menambah soal baru ke bab 'pai_1'
    app.post(
        `${adminPrefix}/:materiKey/questions`,
        controller.addQuestion
    );

    // PUT /api/admin/materi/pai_1/questions/q1_2 -> Guru mengupdate soal 'q1_2'
    app.put(
        `${adminPrefix}/:materiKey/questions/:questionId`,
        controller.updateQuestion
    );
    
    // DELETE /api/admin/materi/pai_1/questions/q1_2 -> Guru menghapus soal 'q1_2'
    app.delete(
        `${adminPrefix}/:materiKey/questions/:questionId`,
        controller.deleteQuestion
    );
};