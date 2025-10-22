// contoh-sesm-server/routes/feedback.routes.js
const controller = require("../controllers/feedbackController");
const adminController = require("../controllers/adminFeedbackController");
const { authJwt } = require("../middlewares"); 
const upload = require("../middlewares/upload.middleware"); 

module.exports = function(app) {
  app.use(function(req, res, next) {
    res.header(
      "Access-Control-Allow-Headers",
      "x-access-token, Origin, Content-Type, Accept"
    );
    next();
   });

  // === INI ROUTE UNTUK USER BIASA (SISWA/GURU) ===
  
  // (POST /api/feedback)
  app.post(
    "/api/feedback",
    [authJwt.verifyToken, upload.single('attachment')], 
    controller.submitFeedback 
  );

  // ✅ BARU: Rute untuk siswa melihat riwayat feedback mereka
  app.get(
    "/api/feedback/my-feedback",
    [authJwt.verifyToken],
    controller.getMyFeedback // <-- Buat fungsi baru ini
  );


  // === INI ROUTE UNTUK ADMIN/GURU ===
  
  // (GET /api/admin/feedback)
  app.get(
    "/api/admin/feedback", 
    [authJwt.verifyToken, authJwt.isGuru], 
    adminController.getAllFeedback 
  );

  // (PUT /api/admin/feedback/:id/status)
  app.put(
    "/api/admin/feedback/:id/status",
    [authJwt.verifyToken, authJwt.isGuru],
    adminController.updateStatus
  );

  // (PUT /api/admin/feedback/:id/notes)
   app.put(
    "/api/admin/feedback/:id/notes",
    [authJwt.verifyToken, authJwt.isGuru],
    adminController.updateAdminNotes
  );

  // (DELETE /api/admin/feedback/:id)
  app.delete(
    "/api/admin/feedback/:id",
    [authJwt.verifyToken, authJwt.isGuru],
    adminController.deleteFeedback
  );

};