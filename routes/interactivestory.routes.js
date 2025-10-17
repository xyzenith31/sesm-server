// contoh-sesm-server/routes/interactivestory.routes.js
const { authJwt } = require("../middlewares");
const upload = require("../middlewares/upload.middleware.js");
const controller = require("../controllers/interactivestory.controller.js");

module.exports = function(app) {
    app.use(function(req, res, next) {
        res.header(
            "Access-Control-Allow-Headers",
            "x-access-token, Origin, Content-Type, Accept"
        );
        next();
    });

    // --- Rute Siswa ---
    const studentPrefix = "/api/interactive-stories";
    app.get(studentPrefix, [authJwt.verifyToken], controller.getAllStories);
    app.get(`${studentPrefix}/:id`, [authJwt.verifyToken], controller.getStoryDataById);
    // [TAMBAHAN] Rute untuk siswa mengirim data penyelesaian
    app.post(`${studentPrefix}/:id/complete`, [authJwt.verifyToken], controller.recordCompletion);


    // --- Rute Guru ---
    const adminPrefix = "/api/admin/interactive-stories";
    const storyUploads = upload.fields([
        { name: 'cover_image', maxCount: 1 },
        { name: 'node_images' }
    ]);

    app.post(adminPrefix, [authJwt.verifyToken, authJwt.isGuru, storyUploads], controller.createStory);
    app.put(`${adminPrefix}/:id`, [authJwt.verifyToken, authJwt.isGuru, storyUploads], controller.updateStory);
    app.delete(`${adminPrefix}/:id`, [authJwt.verifyToken, authJwt.isGuru], controller.deleteStory);
    
    // [TAMBAHAN] Rute untuk guru melihat data pengerjaan
    app.get(`${adminPrefix}/:id/submissions`, [authJwt.verifyToken, authJwt.isGuru], controller.getStorySubmissions);
};