// contoh-sesm-server/routes/drawing.routes.js
const { authJwt } = require("../middlewares");
const controller = require("../controllers/drawing.controller.js");

module.exports = function(app) {
    const prefix = "/api/drawing/projects";

    app.get(prefix, [authJwt.verifyToken], controller.getAllProjects);
    app.post(prefix, [authJwt.verifyToken], controller.createProject);
    app.put(`${prefix}/:uuid`, [authJwt.verifyToken], controller.updateProject);
    app.delete(`${prefix}/:uuid`, [authJwt.verifyToken], controller.deleteProject);
};