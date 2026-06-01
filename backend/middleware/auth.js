const jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {
  console.log("Cookies:", req.cookies);

  const token = req.cookies.pixora_token;

  console.log("Token:", token);

  if (!token) {
    return res.status(401).json({ msg: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    console.log("Decoded:", decoded);

    req.user = { id: decoded.id };

    next();
  } catch (err) {
    console.log("JWT ERROR:", err.message);
    return res.status(401).json({ msg: 'Token is invalid' });
  }
};