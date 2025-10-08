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

  app.post("/api/auth/register", [verifyRegister.checkDuplicateUsernameOrEmail], controller.register);

  // Route untuk login
  app.post("/api/auth/login", controller.login);
};