const express = require("express");
const { authenticate } = require("../middleware/authMiddleware");
const { authorizeRole } = require("../middleware/roleMiddleware");
const {
  validateRecordInput,
  validateMongoIdParam,
} = require("../middleware/validators");
const {
  getAllRecords,
  getRecordById,
  getClassRecords,
  createRecord,
  updateRecord,
  deleteRecord,
  seedBulkRecords,
} = require("../controllers/recordController");

const router = express.Router();
router.use(authenticate);

router.get("/", getAllRecords);
router.get("/class/:className", getClassRecords);
router.post("/seed/bulk", authorizeRole("admin"), seedBulkRecords);
router.get("/:id", validateMongoIdParam, getRecordById);
router.post("/", validateRecordInput, createRecord);
router.put("/:id", validateMongoIdParam, validateRecordInput, updateRecord);
router.delete("/:id", validateMongoIdParam, deleteRecord);

module.exports = router;
