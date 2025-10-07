const controller = require("../controllers/auth.controller.js");
const verifyRegister = require("../middlewares/verify.register.js");

module.exports = function(app) {
  // Middleware untuk header
  app.use(function(req, res, next) {
    res.header(
      "Access-Control-Allow-Headers",
      "x-access-token, Origin, Content-Type, Accept"
    );
    next();
  });

  // Route untuk registrasi
  // Menggunakan middleware untuk cek duplikasi sebelum memanggil controller
  app.post("/api/auth/register", [verifyRegister.checkDuplicateUsernameOrEmail], controller.register);

  // Route untuk login
  app.post("/api/auth/login", controller.login);
};