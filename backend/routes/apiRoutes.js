const express = require("express");
const { healthCheck } = require("../controllers/healthController");
const authRoutes = require("./authRoutes");
const recordRoutes = require("./recordRoutes");
const userRoutes = require("./userRoutes");
const studentRoutes = require("./studentRoutes");

const router = express.Router();

router.get("/health", healthCheck);
router.use("/auth", authRoutes);
router.use("/records", recordRoutes);
router.use("/users", userRoutes);
router.use("/students", studentRoutes);

module.exports = router;
