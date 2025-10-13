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

  // Ganti middleware di sini ke checkRegistrationInput
  app.post("/api/auth/register", [verifyRegister.checkRegistrationInput], controller.register);
  
  // Rute lain tetap sama
  app.post("/api/auth/login", controller.login);
  app.post("/api/auth/verify-and-login", controller.verifyAndLogin);
  app.post("/api/auth/forgot-password", controller.forgotPassword);
  app.post("/api/auth/verify-code", controller.verifyCode);
  app.post("/api/auth/reset-password", controller.resetPassword);
  app.post("/api/auth/resend-code", controller.resendCode);
  app.post("/api/auth/login-with-code", controller.loginWithCode);
};