// contoh-sesm-server/routes/user.routes.js
const userController = require("../controllers/user.controller.js");
const { verifyToken } = require("../middlewares/auth.jwt.js");
const upload = require("../middlewares/upload.middleware.js"); // <-- 1. Impor middleware upload

module.exports = function(app) {
  app.use(function(req, res, next) {
    res.header(
      "Access-Control-Allow-Headers",
      "x-access-token, Origin, Content-Type, Accept"
    );
    next();
  });

  app.put(
    "/api/user/profile/level",
    [verifyToken],
    userController.updateLevelAndClass
  );

  // --- (ROUTE DIPERBARUI DI SINI) ---
  app.put(
    "/api/user",
    [
      verifyToken, 
      upload.single('avatar') // <-- 2. Tambahkan middleware ini
    ], 
    userController.updateUserProfile
  );
  
  app.get(
    "/api/leaderboard",
    [verifyToken],
    userController.getLeaderboard
  );
};