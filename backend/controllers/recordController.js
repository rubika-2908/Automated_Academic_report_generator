const mongoose = require("mongoose");
const AcademicRecord = require("../models/AcademicRecord");
const User = require("../models/User");

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const getAllRecords = async (req, res) => {
  try {
    const role = req.user?.role || "staff";
    const subject = req.user?.subject;

    const query = {};
    if (role !== "admin") {
      if (!subject) {
        return res.status(200).json({
          success: true,
          count: 0,
          data: [],
        });
      }
      query.subject = subject;
    }

    const records = await AcademicRecord.find(query).populate("createdBy", "name email");
    return res.status(200).json({
      success: true,
      count: records.length,
      data: records,
    });
  } catch (error) {
    console.error("getAllRecords error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching records",
    });
  }
};

const getRecordById = async (req, res) => {
  try {
    const { id } = req.params;
    const role = req.user?.role || "staff";

    const record = await AcademicRecord.findById(id).populate("createdBy", "name email");
    if (!record) {
      return res.status(404).json({
        success: false,
        message: "Record not found",
      });
    }

    if (role !== "admin") {
      const subjectOk = req.user?.subject && record.subject === req.user.subject;
      const classOk =
        req.user?.classTeacherFor && record.className === req.user.classTeacherFor;
      if (!subjectOk && !classOk) {
        return res.status(403).json({
          success: false,
          message: "Forbidden: you can only access permitted records",
        });
      }
    }

    return res.status(200).json({
      success: true,
      data: record,
    });
  } catch (error) {
    console.error("getRecordById error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching record",
    });
  }
};

const getClassRecords = async (req, res) => {
  try {
    const role = req.user?.role || "staff";
    const className = String(req.params.className || "").trim();

    if (!className) {
      return res.status(403).json({
        success: false,
        message: "className is required",
      });
    }

    if (role !== "admin" && req.user?.classTeacherFor !== className) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: you can only access your class records",
      });
    }

    const records = await AcademicRecord.find({ className }).populate("createdBy", "name email");
    return res.status(200).json({
      success: true,
      count: records.length,
      data: records,
    });
  } catch (error) {
    console.error("getClassRecords error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching class records",
    });
  }
};

const createRecord = async (req, res) => {
  try {
    const {
      studentName,
      registerNumber,
      className,
      section,
      classTeacherName,
      classTeacherSubject,
      subject,
      marks,
      term,
    } = req.body;
    const createdBy = req.user?.userId;
    const role = req.user?.role || "staff";
    const staffSubject = req.user?.subject;

    if (!isValidObjectId(createdBy)) {
      return res.status(400).json({
        success: false,
        message: "Invalid authenticated user id",
      });
    }

    const user = await User.findById(createdBy);
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Authenticated user does not exist",
      });
    }

    if (role !== "admin" && staffSubject && subject !== staffSubject) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: staff can only create records for their subject",
      });
    }

    const record = await AcademicRecord.create({
      studentName,
      registerNumber,
      className: className || "Not Specified",
      section,
      classTeacherName: classTeacherName || "",
      classTeacherSubject: classTeacherSubject || "",
      subject,
      marks,
      term,
      createdBy,
    });

    return res.status(201).json({
      success: true,
      message: "Academic record created successfully",
      data: record,
    });
  } catch (error) {
    console.error("createRecord error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while creating record",
    });
  }
};

const updateRecord = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      studentName,
      registerNumber,
      className,
      section,
      classTeacherName,
      classTeacherSubject,
      subject,
      marks,
      term,
    } = req.body;
    const createdBy = req.user?.userId;
    const role = req.user?.role || "staff";
    const staffSubject = req.user?.subject;

    const existing = await AcademicRecord.findById(id);
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Record not found",
      });
    }

    if (role !== "admin") {
      if (!staffSubject || existing.subject !== staffSubject || subject !== staffSubject) {
        return res.status(403).json({
          success: false,
          message: "Forbidden: staff can only update records for their subject",
        });
      }
    }

    const updatedRecord = await AcademicRecord.findByIdAndUpdate(
      id,
      {
        studentName,
        registerNumber,
        className,
        section,
        classTeacherName: classTeacherName || "",
        classTeacherSubject: classTeacherSubject || "",
        subject,
        marks,
        term,
      },
      { new: true, runValidators: true }
    );

    return res.status(200).json({
      success: true,
      message: "Academic record updated successfully",
      data: updatedRecord,
    });
  } catch (error) {
    console.error("updateRecord error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while updating record",
    });
  }
};

const deleteRecord = async (req, res) => {
  try {
    const { id } = req.params;
    const createdBy = req.user?.userId;
    const role = req.user?.role || "staff";
    const staffSubject = req.user?.subject;

    const existing = await AcademicRecord.findById(id);
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Record not found",
      });
    }

    if (role !== "admin") {
      if (!staffSubject || existing.subject !== staffSubject) {
        return res.status(403).json({
          success: false,
          message: "Forbidden: staff can only delete records for their subject",
        });
      }
    }

    await AcademicRecord.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Academic record deleted successfully",
    });
  } catch (error) {
    console.error("deleteRecord error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while deleting record",
    });
  }
};

const seedBulkRecords = async (req, res) => {
  try {
    const createdBy = req.user?.userId;
    const {
      classNames = [
        "Class 6",
        "Class 7",
        "Class 8",
        "Class 9",
        "Class 10",
        "Class 11",
        "Class 12",
      ],
      subjects = [
        "Mathematics",
        "Science",
        "English",
        "Social Studies",
        "Computer Science",
      ],
      terms = ["First Term"],
      studentsPerClass = 10,
      clearExisting = false,
    } = req.body || {};

    if (!isValidObjectId(createdBy)) {
      return res.status(400).json({
        success: false,
        message: "Invalid authenticated user id",
      });
    }

    const user = await User.findById(createdBy);
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Authenticated user does not exist",
      });
    }

    const safeStudentsPerClass = Number(studentsPerClass);
    if (!Number.isInteger(safeStudentsPerClass) || safeStudentsPerClass <= 0) {
      return res.status(400).json({
        success: false,
        message: "studentsPerClass must be a positive integer",
      });
    }

    const safeClassNames = classNames.filter((item) => typeof item === "string" && item.trim());
    const safeSubjects = subjects.filter((item) => typeof item === "string" && item.trim());
    const safeTerms = terms.filter((item) => typeof item === "string" && item.trim());

    if (!safeClassNames.length || !safeSubjects.length || !safeTerms.length) {
      return res.status(400).json({
        success: false,
        message: "classNames, subjects, and terms must have at least one value each",
      });
    }

    if (clearExisting) {
      await AcademicRecord.deleteMany({ createdBy });
    }

    const docs = [];
    safeClassNames.forEach((className) => {
      for (let index = 1; index <= safeStudentsPerClass; index += 1) {
        const studentName = `${className} Student ${String(index).padStart(2, "0")}`;
        const registerNumber = `${className.replace(/\s+/g, "")}-A-${String(index).padStart(3, "0")}`;
        safeTerms.forEach((term) => {
          safeSubjects.forEach((subject) => {
            docs.push({
              studentName,
              registerNumber,
              className,
              section: "A",
              classTeacherName: `${className} Class Teacher`,
              classTeacherSubject: safeSubjects[0],
              subject,
              term,
              marks: Math.floor(Math.random() * 41) + 60,
              createdBy,
            });
          });
        });
      }
    });

    await AcademicRecord.insertMany(docs);

    return res.status(201).json({
      success: true,
      message: "Bulk records seeded successfully",
      summary: {
        createdCount: docs.length,
        classes: safeClassNames.length,
        subjects: safeSubjects.length,
        terms: safeTerms.length,
        studentsPerClass: safeStudentsPerClass,
        clearExisting: Boolean(clearExisting),
      },
    });
  } catch (error) {
    console.error("seedBulkRecords error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while seeding records",
    });
  }
};

module.exports = {
  getAllRecords,
  getRecordById,
  getClassRecords,
  createRecord,
  updateRecord,
  deleteRecord,
  seedBulkRecords,
};
