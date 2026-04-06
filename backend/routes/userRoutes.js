const express = require("express");
const { authenticate } = require("../middleware/authMiddleware");
const { authorizeRole } = require("../middleware/roleMiddleware");
const { validateStaffInput } = require("../middleware/validators");
const { createStaff, listStaff } = require("../controllers/userController");

const router = express.Router();

router.use(authenticate);
router.use(authorizeRole("admin"));

router.get("/", listStaff);
router.post("/staff", validateStaffInput, createStaff);

module.exports = router;
