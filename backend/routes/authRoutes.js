const express = require("express");
const { register, login, me } = require("../controllers/authController");
const { authenticate } = require("../middleware/authMiddleware");
const {
  validateRegisterInput,
  validateLoginInput,
} = require("../middleware/validators");

const router = express.Router();

router.post("/register", validateRegisterInput, register);
router.post("/login", validateLoginInput, login);
router.get("/me", authenticate, me);

module.exports = router;
