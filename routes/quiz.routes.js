// contoh-server-sesm/routes/quiz.routes.js
const { authJwt } = require("../middlewares");
const upload = require("../middlewares/upload.middleware.js");
const controller = require("../controllers/quiz.controller.js");

module.exports = function (app) {
    app.use(function (req, res, next) {
        res.header( "Access-Control-Allow-Headers", "x-access-token, Origin, Content-Type, Accept" );
        next();
    });

    // === RUTE SISWA ===
    const studentPrefix = "/api/quizzes";
    app.get(studentPrefix, [authJwt.verifyToken], controller.listAllQuizzes);
    app.get(`${studentPrefix}/:quizId`, [authJwt.verifyToken], controller.getQuizForStudent);
    app.post(`${studentPrefix}/:quizId/submit`, [authJwt.verifyToken], controller.submitQuiz);

    // === RUTE GURU ===
    const adminPrefix = "/api/admin/quizzes";

    app.post( adminPrefix, [authJwt.verifyToken, authJwt.isGuru, upload.single('coverImage')], controller.createQuiz );
    app.delete( `${adminPrefix}/:quizId`, [authJwt.verifyToken, authJwt.isGuru], controller.deleteQuiz );
    app.get( `${adminPrefix}/:quizId/details`, [authJwt.verifyToken, authJwt.isGuru], controller.getQuizDetailsForAdmin );
    app.get( `${adminPrefix}/:quizId/submissions`, [authJwt.verifyToken, authJwt.isGuru], controller.getSubmissionsForQuiz );
    app.post( `${adminPrefix}/:quizId/questions`, [authJwt.verifyToken, authJwt.isGuru, upload.array('mediaFiles', 5)], controller.addQuestionToQuiz );
    app.post( `${adminPrefix}/:quizId/add-from-bank`, [authJwt.verifyToken, authJwt.isGuru], controller.addQuestionsFromBank );
    
    // --- RUTE BARU UNTUK PENGATURAN KUIS ---
    app.put(
        `${adminPrefix}/:quizId/settings`,
        [authJwt.verifyToken, authJwt.isGuru],
        controller.updateQuizSettings
    );

    // --- RUTE EDIT & HAPUS SOAL SPESIFIK ---
    app.put(
        `${adminPrefix}/questions/:questionId`,
        [authJwt.verifyToken, authJwt.isGuru, upload.array('mediaFiles', 5)],
        controller.updateQuestion
    );

    app.delete(
        `${adminPrefix}/questions/:questionId`,
        [authJwt.verifyToken, authJwt.isGuru],
        controller.deleteQuestion
    );
};