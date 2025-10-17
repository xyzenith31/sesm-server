// contoh-sesm-server/routes/point.routes.js
const { authJwt } = require("../middlewares");
const controller = require("../controllers/point.controller.js");

module.exports = function(app) {
    app.use(function(req, res, next) {
        res.header(
            "Access-Control-Allow-Headers",
            "x-access-token, Origin, Content-Type, Accept"
        );
        next();
    });

    const prefix = "/api/points";

    // Endpoint untuk mendapatkan total poin & info peringkat (untuk halaman Profil)
    app.get(
        `${prefix}/summary`,
        [authJwt.verifyToken],
        controller.getSummary
    );

    // Endpoint untuk mendapatkan riwayat perolehan poin (untuk Laporan Belajar)
    app.get(
        `${prefix}/history`,
        [authJwt.verifyToken],
        controller.getHistory
    );
    
    // Rute untuk riwayat kuis
    app.get(
        `${prefix}/quiz-history`,
        [authJwt.verifyToken],
        controller.getQuizHistory
    );

    // Rute untuk riwayat materi per mapel
    app.get(
        `${prefix}/subject-history/:subjectName`,
        [authJwt.verifyToken],
        controller.getSubjectHistory
    );
};