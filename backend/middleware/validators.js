const mongoose = require("mongoose");
const { SUBJECT_OPTIONS } = require("../utils/subjects");

const isNonEmptyString = (value) => typeof value === "string" && value.trim().length > 0;
const isEmail = (value) =>
  typeof value === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

const sendValidationError = (res, message) =>
  res.status(400).json({
    success: false,
    message,
  });

const validateRegisterInput = (req, res, next) => {
  const { name, email, password } = req.body;
  if (!isNonEmptyString(name)) {
    return sendValidationError(res, "name is required");
  }
  if (!isEmail(email)) {
    return sendValidationError(res, "valid email is required");
  }
  if (!isNonEmptyString(password) || password.length < 6) {
    return sendValidationError(res, "password must be at least 6 characters");
  }
  return next();
};

const validateLoginInput = (req, res, next) => {
  const { email, password } = req.body;
  if (!isEmail(email)) {
    return sendValidationError(res, "valid email is required");
  }
  if (!isNonEmptyString(password)) {
    return sendValidationError(res, "password is required");
  }
  return next();
};

const validateRecordInput = (req, res, next) => {
  const {
    studentName,
    registerNumber,
    subject,
    marks,
    term,
    className,
    section,
  } = req.body;

  if (!isNonEmptyString(studentName)) {
    return sendValidationError(res, "studentName is required");
  }
  if (!isNonEmptyString(registerNumber)) {
    return sendValidationError(res, "registerNumber is required");
  }
  if (!isNonEmptyString(subject)) {
    return sendValidationError(res, "subject is required");
  }
  if (!isNonEmptyString(term)) {
    return sendValidationError(res, "term is required");
  }
  if (className !== undefined && className !== null && !isNonEmptyString(className)) {
    return sendValidationError(res, "className must be a non-empty string when provided");
  }
  if (!isNonEmptyString(section)) {
    return sendValidationError(res, "section is required");
  }

  const numericMarks = Number(marks);
  if (!Number.isFinite(numericMarks) || numericMarks < 0 || numericMarks > 100) {
    return sendValidationError(res, "marks must be a number between 0 and 100");
  }

  req.body.marks = numericMarks;
  return next();
};

const validateMongoIdParam = (req, res, next) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return sendValidationError(res, "Invalid record id");
  }
  return next();
};

const validateStaffInput = (req, res, next) => {
  const { name, email, password, subject, classTeacherFor } = req.body;
  if (!isNonEmptyString(name)) {
    return sendValidationError(res, "name is required");
  }
  if (!isEmail(email)) {
    return sendValidationError(res, "valid email is required");
  }
  if (!isNonEmptyString(password) || password.length < 6) {
    return sendValidationError(res, "password must be at least 6 characters");
  }
  if (!isNonEmptyString(subject) || !SUBJECT_OPTIONS.includes(subject.trim())) {
    return sendValidationError(res, "subject must be one of the allowed options");
  }
  if (classTeacherFor !== undefined && classTeacherFor !== null && !isNonEmptyString(classTeacherFor)) {
    return sendValidationError(res, "classTeacherFor must be a non-empty string when provided");
  }
  if (isNonEmptyString(classTeacherFor)) {
    const normalized = String(classTeacherFor).replace(/\s+/g, "").toLowerCase();
    const match = normalized.match(/^class(6|7|8|9|10|11|12)(a|b|c)$/);
    if (!match) {
      return sendValidationError(res, "classTeacherFor must be like 'Class 6A' - 'Class 12C'");
    }
  }
  return next();
};

const validateStudentInput = (req, res, next) => {
  const {
    studentName,
    className,
    section,
    admissionYear,
    parentPhone,
  } = req.body;
  if (!isNonEmptyString(studentName)) {
    return sendValidationError(res, "studentName is required");
  }
  if (!isNonEmptyString(className)) {
    return sendValidationError(res, "className is required");
  }
  if (!isNonEmptyString(section)) {
    return sendValidationError(res, "section is required");
  }
  const sectionValue = String(section || "").trim().toUpperCase();
  if (!["A", "B", "C"].includes(sectionValue)) {
    return sendValidationError(res, "section must be A, B, or C");
  }
  const yearValue = Number(admissionYear);
  if (!Number.isInteger(yearValue) || yearValue < 2000 || yearValue > 2100) {
    return sendValidationError(res, "admissionYear must be a valid year");
  }
  if (parentPhone && !isNonEmptyString(parentPhone)) {
    return sendValidationError(res, "parentPhone must be a non-empty string when provided");
  }
  req.body.section = sectionValue;
  req.body.admissionYear = yearValue;
  return next();
};

module.exports = {
  validateRegisterInput,
  validateLoginInput,
  validateRecordInput,
  validateMongoIdParam,
  validateStaffInput,
  validateStudentInput,
};
