const Student = require("../models/Student");

function escapeRegExp(value) {
  return String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildRegisterPrefix(className, section) {
  const classMatch = String(className || "").trim().match(/^Class\s+(\d+)([A-C])?$/i);
  const normalizedSection = String(section || "").trim().toUpperCase();
  if (!classMatch || !normalizedSection) return "";
  const classSection = String(classMatch[2] || "").toUpperCase();
  if (classSection && classSection !== normalizedSection) return "";
  return `${classMatch[1]}${normalizedSection}`;
}

function getTrailingSequence(registerNumber) {
  const match = String(registerNumber || "").trim().match(/-(\d+)$/);
  return match ? Number(match[1]) : 0;
}

async function generateRegisterNumber(className, section) {
  const prefix = buildRegisterPrefix(className, section);
  if (!prefix) {
    throw new Error("Invalid class or section for register number generation");
  }

  const pattern = new RegExp(`^${escapeRegExp(prefix)}-(\\d+)$`, "i");
  const latestStudent = await Student.findOne({
    className: className.trim(),
    section: section.trim().toUpperCase(),
    registerNumber: { $regex: pattern },
  })
    .sort({ registerNumber: -1 })
    .select("registerNumber")
    .lean();

  const nextSequence = getTrailingSequence(latestStudent?.registerNumber) + 1;
  return `${prefix}-${String(nextSequence).padStart(3, "0")}`;
}

const getAllStudents = async (req, res) => {
  try {
    const students = await Student.find({})
      .sort({ studentName: 1, registerNumber: 1 })
      .lean();
    return res.status(200).json({
      success: true,
      count: students.length,
      data: students,
    });
  } catch (error) {
    console.error("getAllStudents error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching students",
    });
  }
};

const createStudent = async (req, res) => {
  try {
    const {
      studentName,
      parentName,
      dateOfBirth,
      place,
      parentPhone,
      className,
      section,
      admissionYear,
    } = req.body;

    let student;
    let attempts = 0;

    while (attempts < 5) {
      const registerNumber = await generateRegisterNumber(className, section);

      try {
        student = await Student.create({
          registerNumber,
          studentName,
          parentName,
          dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
          place,
          parentPhone,
          className,
          section,
          admissionYear,
          createdBy: req.user?.userId,
        });
        break;
      } catch (error) {
        if (error?.code === 11000 && error?.keyPattern?.registerNumber) {
          attempts += 1;
          continue;
        }
        throw error;
      }
    }

    if (!student) {
      return res.status(409).json({
        success: false,
        message: "Could not assign a register number. Please try again.",
      });
    }

    return res.status(201).json({
      success: true,
      message: "Student created successfully",
      data: student,
    });
  } catch (error) {
    console.error("createStudent error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while creating student",
    });
  }
};

module.exports = {
  getAllStudents,
  createStudent,
};
