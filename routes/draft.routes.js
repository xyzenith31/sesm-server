// contoh-sesm-server/routes/draft.routes.js
const { authJwt } = require("../middlewares");
const controller = require("../controllers/draft.controller.js");

module.exports = function(app) {
    const prefix = "/api/drafts";

    app.post(prefix, [authJwt.verifyToken, authJwt.isGuru], controller.saveDraft);
    app.get(prefix, [authJwt.verifyToken, authJwt.isGuru], controller.getAllDrafts);
    app.get(`${prefix}/:draftKey`, [authJwt.verifyToken, authJwt.isGuru], controller.getDraft);
    app.delete(`${prefix}/:draftKey`, [authJwt.verifyToken, authJwt.isGuru], controller.deleteDraft);
};