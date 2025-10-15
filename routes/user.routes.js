// contoh-sesm-server/routes/user.routes.js
const userController = require("../controllers/user.controller.js");
const { authJwt } = require("../middlewares"); // <-- UBAH INI
const upload = require("../middlewares/upload.middleware.js"); 

module.exports = function(app) {
  app.use(function(req, res, next) {
    res.header(
      "Access-Control-Allow-Headers",
      "x-access-token, Origin, Content-Type, Accept"
    );
    next();
  });

  // === RUTE UNTUK PENGGUNA BIASA (SISWA) ===
  app.put(
    "/api/user/profile/level",
    [authJwt.verifyToken],
    userController.updateLevelAndClass
  );

  app.put(
    "/api/user",
    [
      authJwt.verifyToken, 
      upload.single('avatar')
    ], 
    userController.updateUserProfile
  );
  
  app.get(
    "/api/leaderboard",
    [authJwt.verifyToken],
    userController.getLeaderboard
  );

  // === RUTE-RUTE BARU UNTUK ADMIN/GURU ===
  const adminPrefix = "/api/admin/users";

  app.get(
    adminPrefix,
    [authJwt.verifyToken, authJwt.isGuru],
    userController.getAllUsers
  );

  app.post(
    adminPrefix,
    [authJwt.verifyToken, authJwt.isGuru],
    userController.createUserByAdmin
  );

  app.put(
    `${adminPrefix}/:userId`,
    [authJwt.verifyToken, authJwt.isGuru],
    userController.updateUserByAdmin
  );

  app.delete(
    `${adminPrefix}/:userId`,
    [authJwt.verifyToken, authJwt.isGuru],
    userController.deleteUserByAdmin
  );
};