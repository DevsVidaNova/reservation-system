const express = require("express");
const router = express.Router();
const { showUser, listUsers } = require("../controllers/userController");
const authMiddleware = require("../middleware/authMiddleware");

router.get("/:id", authMiddleware, showUser);
router.get("/", authMiddleware, listUsers);
module.exports = router;
