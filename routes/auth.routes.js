const controller = require("../controllers/auth.controller.js");
const verifyRegister = require("../middlewares/verify.register.js");

module.exports = function(app) {
  app.use(function(req, res, next) {
    res.header(
      "Access-Control-Allow-Headers",
      "x-access-token, Origin, Content-Type, Accept"
    );
    next();
  });

  // Rute Registrasi & Login
  app.post("/api/auth/register", [verifyRegister.checkDuplicateUsernameOrEmail], controller.register);
  app.post("/api/auth/login", controller.login);

  // Rute Lupa Password
  app.post("/api/auth/forgot-password", controller.forgotPassword);
  app.post("/api/auth/verify-code", controller.verifyCode);
  app.post("/api/auth/reset-password", controller.resetPassword);
  app.post("/api/auth/resend-code", controller.resendCode);
};