// src/routes/challenge.routes.js
const { authJwt } = require("../middlewares");
const controller = require("../controllers/challenge.controller.js"); // Buat controller ini nanti

module.exports = function(app) {
    app.use(function(req, res, next) {
        res.header(
            "Access-Control-Allow-Headers",
            "x-access-token, Origin, Content-Type, Accept"
        );
        next();
    });

    const prefix = "/api/challenges";

    // Endpoint untuk mendapatkan tantangan hari ini (yang akan ditentukan oleh backend)
    app.get(
        `${prefix}/today`,
        [authJwt.verifyToken],
        controller.getTodaysChallenges
    );

    // Endpoint untuk menandai tantangan selesai dan mendapatkan poin
    app.post(
        `${prefix}/:challengeId/complete`,
        [authJwt.verifyToken],
        controller.completeChallenge
    );

    // (Opsional) Endpoint untuk klaim hadiah harian jika semua selesai
    // app.post(`${prefix}/claim-reward`, [authJwt.verifyToken], controller.claimDailyReward);
};