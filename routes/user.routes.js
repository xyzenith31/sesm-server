const userController = require("../controllers/user.controller.js");
const { verifyToken } = require("../middlewares/auth.jwt.js");

module.exports = function(app) {
  app.use(function(req, res, next) {
    res.header(
      "Access-Control-Allow-Headers",
      "x-access-token, Origin, Content-Type, Accept"
    );
    next();
  });

  // Endpoint lama untuk update level (tetap ada)
  app.put(
    "/api/user/profile/level",
    [verifyToken],
    userController.updateLevelAndClass
  );

  // --- (ENDPOINT BARU DITAMBAHKAN DI SINI) ---
  // Endpoint ini yang akan menerima data dari AccountSettingsPage
  app.put(
    "/api/user", // Menggunakan endpoint '/api/user' yang dituju frontend
    [verifyToken], // Memastikan hanya user yang login yang bisa update
    userController.updateUserProfile // Memanggil controller yang baru kita buat
  );
};