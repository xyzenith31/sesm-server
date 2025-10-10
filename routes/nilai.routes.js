// contoh-server-sesm/routes/nilai.routes.js
const { authJwt } = require("../middlewares");
const nilaiController = require("../controllers/nilai.controller.js");

module.exports = function (app) {
    const prefix = "/api/admin/nilai";

    app.put(
        "/api/admin/chapters/:chapterId/grading-mode",
        [authJwt.verifyToken, authJwt.isGuru],
        nilaiController.updateGradingMode
    );

    app.get(
        `${prefix}/chapter/:chapterId`,
        [authJwt.verifyToken, authJwt.isGuru],
        nilaiController.getSubmissionsForChapter
    );
    
    app.get(
        `${prefix}/submission/:submissionId`,
        [authJwt.verifyToken, authJwt.isGuru],
        nilaiController.getSubmissionDetails
    );

    app.post(
        `${prefix}/submission/:submissionId`,
        [authJwt.verifyToken, authJwt.isGuru],
        nilaiController.gradeSubmission
    );

    // --- RUTE BARU UNTUK OVERRIDE JAWABAN ---
    app.patch(
        `${prefix}/answer/:answerId`,
        [authJwt.verifyToken, authJwt.isGuru],
        nilaiController.overrideAnswer
    );
};