const jwt = require("jsonwebtoken");

const verifyToken = (req, res, next) => {
  let token = req.headers["x-access-token"];

  if (!token) {
    return res.status(403).send({ message: "No token provided!" });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).send({ message: "Unauthorized!" });
    }
    // Menyimpan id user dari token ke dalam request
    // agar bisa digunakan oleh controller selanjutnya
    req.userId = decoded.id; 
    next();
  });
};

module.exports = { verifyToken };