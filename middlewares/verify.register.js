const User = require('../models/user.model.js');

const verifyRegister = {};

verifyRegister.checkDuplicateUsernameOrEmail = async (req, res, next) => {
  try {
    // Cek Username
    let user = await User.findByUsernameOrEmail(req.body.username);
    if (user) {
      return res.status(400).send({ message: "Gagal! Username sudah digunakan." });
    }

    // Cek Email
    user = await User.findByUsernameOrEmail(req.body.email);
    if (user) {
      return res.status(400).send({ message: "Gagal! Email sudah digunakan." });
    }
    
    next();

  } catch (error) {
    res.status(500).send({ message: error.message });
  }
};

module.exports = verifyRegister;