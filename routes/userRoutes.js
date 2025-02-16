const express = require("express");
const router = express.Router();
const { showUser, listUsers } = require("../controllers/userController");
const authMiddleware = require("../middleware/authMiddleware");

router.get("/:id", showUser);
router.get("/", listUsers);
module.exports = router;
