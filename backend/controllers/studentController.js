const Student = require("../models/Student");

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
      registerNumber,
      studentName,
      parentName,
      dateOfBirth,
      place,
      parentPhone,
      className,
      section,
      admissionYear,
    } = req.body;

    const existing = await Student.findOne({ registerNumber: registerNumber.trim() });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: "Register number already exists",
      });
    }

    const student = await Student.create({
      registerNumber: registerNumber.trim(),
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
