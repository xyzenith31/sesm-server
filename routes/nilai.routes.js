const { authJwt } = require("../middlewares");
const nilaiController = require("../controllers/nilai.controller.js");

module.exports = function (app) {
    const prefix = "/api/admin/nilai";

    app.put(
        "/api/admin/chapters/:chapterId/grading-mode", // Mengubah mode
        [authJwt.verifyToken, authJwt.isGuru],
        nilaiController.updateGradingMode
    );

    app.get(
        `${prefix}/chapter/:chapterId`, // Lihat submission per bab
        [authJwt.verifyToken, authJwt.isGuru],
        nilaiController.getSubmissionsForChapter    
    );

    app.get(
        `${prefix}/submission/:submissionId`, // Lihat detail jawaban
        [authJwt.verifyToken, authJwt.isGuru],
        nilaiController.getSubmissionDetails
    );

    app.post(
        `${prefix}/submission/:submissionId`, // Kirim nilai
        [authJwt.verifyToken, authJwt.isGuru],
        nilaiController.gradeSubmission
    );
};