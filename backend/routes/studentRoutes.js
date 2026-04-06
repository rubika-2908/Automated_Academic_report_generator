const express = require("express");
const { getAllStudents, createStudent } = require("../controllers/studentController");
const { authenticate } = require("../middleware/authMiddleware");
const { authorizeRole } = require("../middleware/roleMiddleware");
const { validateStudentInput } = require("../middleware/validators");

const router = express.Router();

router.use(authenticate);
router.get("/", authorizeRole(["admin", "staff"]), getAllStudents);
router.post("/", authorizeRole(["admin"]), validateStudentInput, createStudent);

module.exports = router;
