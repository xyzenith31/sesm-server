// contoh-sesm-server/routes/bookmark.routes.js
const { authJwt } = require("../middlewares");
const upload = require("../middlewares/upload.middleware.js");
const controller = require("../controllers/bookmark.controller.js");

module.exports = function (app) {
    app.use((req, res, next) => {
        res.header("Access-Control-Allow-Headers", "x-access-token, Origin, Content-Type, Accept");
        next();
    });

    // --- RUTE SISWA ---
    app.get("/api/bookmarks", [authJwt.verifyToken], controller.getAllBookmarks);
    app.post("/api/bookmarks/:bookmarkId/submit", [authJwt.verifyToken], controller.submitAnswers);
    app.get("/api/bookmarks/my-submissions", [authJwt.verifyToken], controller.getMySubmissions);
    // Rute baru untuk siswa melihat detail nilainya
    app.get("/api/bookmarks/submissions/:submissionId", [authJwt.verifyToken], controller.getStudentSubmissionDetails);


    // --- RUTE GURU ---
    const adminPrefix = "/api/admin/bookmarks";
    app.post(adminPrefix, [authJwt.verifyToken, authJwt.isGuru, upload.fields([{ name: 'mainFile', maxCount: 1 }, { name: 'coverImage', maxCount: 1 }])], controller.createBookmark);
    
    app.put(`${adminPrefix}/:bookmarkId`, [authJwt.verifyToken, authJwt.isGuru, upload.fields([{ name: 'mainFile', maxCount: 1 }, { name: 'coverImage', maxCount: 1 }])], controller.updateBookmark);
    
    app.delete(`${adminPrefix}/:bookmarkId`, [authJwt.verifyToken, authJwt.isGuru], controller.deleteBookmark);
    
    // Rute Nilai
    app.get(`${adminPrefix}/:bookmarkId/submissions`, [authJwt.verifyToken, authJwt.isGuru], controller.getSubmissions);
    app.get(`${adminPrefix}/submissions/:submissionId`, [authJwt.verifyToken, authJwt.isGuru], controller.getSubmissionDetails);
    app.post(`${adminPrefix}/submissions/:submissionId/grade`, [authJwt.verifyToken, authJwt.isGuru], controller.gradeSubmission);
};