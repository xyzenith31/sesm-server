const { authJwt } = require("../middlewares");
const controller = require("../controllers/diary.controller.js");

module.exports = function(app) {
    app.use(function(req, res, next) {
        res.header(
            "Access-Control-Allow-Headers",
            "x-access-token, Origin, Content-Type, Accept"
        );
        next();
    });

    const prefix = "/api/diary";

    app.post(prefix, [authJwt.verifyToken], controller.createEntry);
    app.get(prefix, [authJwt.verifyToken], controller.getAllEntries);
    app.put(`${prefix}/:entryId`, [authJwt.verifyToken], controller.updateEntry);
    app.delete(`${prefix}/:entryId`, [authJwt.verifyToken], controller.deleteEntry);
};