// contoh-sesm-server/routes/agenda.routes.js
const { authJwt } = require("../middlewares");
const controller = require("../controllers/agenda.controller.js");

module.exports = function(app) {
    const prefix = "/api/agendas";

    app.post(prefix, [authJwt.verifyToken], controller.createAgenda);
    app.get(prefix, [authJwt.verifyToken], controller.getAgendas);
    app.delete(`${prefix}/:id`, [authJwt.verifyToken], controller.deleteAgenda);
};