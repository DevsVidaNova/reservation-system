const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "VidaNova2025";

const generateToken = (userId, isAdmin, name, phone, email) => {
  return jwt.sign({ userId, isAdmin, name, phone, email }, JWT_SECRET);
};

const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
};

module.exports = { generateToken, verifyToken };
