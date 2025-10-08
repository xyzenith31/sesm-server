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

  app.put(
    "/api/user/profile/level",
    [verifyToken],
    userController.updateLevelAndClass
  );
};