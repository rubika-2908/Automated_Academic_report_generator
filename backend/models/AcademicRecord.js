const mongoose = require("mongoose");

const academicRecordSchema = new mongoose.Schema(
  {
    studentName: {
      type: String,
      required: true,
      trim: true,
    },
    registerNumber: {
      type: String,
      required: true,
      trim: true,
    },
    className: {
      type: String,
      trim: true,
      default: "Not Specified",
    },
    section: {
      type: String,
      required: true,
      trim: true,
    },
    classTeacherName: {
      type: String,
      required: true,
      trim: true,
    },
    classTeacherSubject: {
      type: String,
      required: true,
      trim: true,
    },
    subject: {
      type: String,
      required: true,
      trim: true,
    },
    marks: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    term: {
      type: String,
      required: true,
      trim: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("AcademicRecord", academicRecordSchema);
