const jwt = require("jsonwebtoken");
const User = require("../models/user.model.js");

const verifyToken = (req, res, next) => {
  let token = req.headers["x-access-token"];

  if (!token) {
    return res.status(403).send({ message: "No token provided!" });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).send({ message: "Unauthorized!" });
    }
    
    req.userId = decoded.id; 
    next();
  });
};

const isGuru = async (req, res, next) => {
    try {
        const user = await User.findById(req.userId); // Asumsi ada fungsi findById di user.model
        if (user && user.role === 'guru') {
            next();
            return;
        }
        res.status(403).send({ message: "Require Guru Role!" });
    } catch (error) {
        res.status(500).send({ message: "Unable to validate user role!" });
    }
};


const authJwt = {
  verifyToken,
  isGuru
};

module.exports = authJwt;