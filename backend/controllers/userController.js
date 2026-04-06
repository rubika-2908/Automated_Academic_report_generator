const User = require("../models/User");
const bcrypt = require("bcrypt");

const BCRYPT_ROUNDS = 10;

const createStaff = async (req, res) => {
  try {
    const { name, email, password, subject, classTeacherFor } = req.body;
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already exists with this email",
      });
    }

    const staff = await User.create({
      name,
      email: email.toLowerCase(),
      password: await bcrypt.hash(password, BCRYPT_ROUNDS),
      role: "staff",
      subject,
      classTeacherFor: classTeacherFor ? classTeacherFor.trim() : "",
    });

    return res.status(201).json({
      success: true,
      message: "Staff account created",
      data: {
        id: staff._id,
        name: staff.name,
        email: staff.email,
        role: staff.role,
        subject: staff.subject,
        classTeacherFor: staff.classTeacherFor || "",
      },
    });
  } catch (error) {
    console.error("createStaff error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while creating staff",
    });
  }
};

const listStaff = async (req, res) => {
  try {
    const staff = await User.find({ role: "staff" }).select("name email role subject classTeacherFor createdAt");
    return res.status(200).json({
      success: true,
      count: staff.length,
      data: staff,
    });
  } catch (error) {
    console.error("listStaff error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching staff",
    });
  }
};

module.exports = {
  createStaff,
  listStaff,
};
