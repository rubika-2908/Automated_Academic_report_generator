const bcrypt = require("bcrypt");
const crypto = require("crypto");
const User = require("../models/User");
const { generateToken } = require("../utils/token");

const BCRYPT_ROUNDS = 10;

const hashLegacySha256 = (password) =>
  crypto.createHash("sha256").update(password).digest("hex");

const hashPassword = async (password) => bcrypt.hash(password, BCRYPT_ROUNDS);

const verifyPassword = async (user, plainPassword) => {
  const storedPassword = String(user.password || "");

  if (storedPassword.startsWith("$2")) {
    return bcrypt.compare(plainPassword, storedPassword);
  }

  const isLegacyMatch = storedPassword === hashLegacySha256(plainPassword);
  if (!isLegacyMatch) {
    return false;
  }

  // Upgrade legacy sha256 hash to bcrypt on successful login.
  user.password = await hashPassword(plainPassword);
  await user.save();
  return true;
};

const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already exists with this email",
      });
    }

    const totalUsers = await User.countDocuments();
    if (totalUsers > 0) {
      return res.status(403).json({
        success: false,
        message: "Registration is disabled. Contact admin to create staff accounts.",
      });
    }

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password: await hashPassword(password),
      role: "admin",
    });
    const token = generateToken({
      userId: String(user._id),
      email: user.email,
      role: user.role,
      subject: user.subject,
      classTeacherFor: user.classTeacherFor,
    });

    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        subject: user.subject,
        classTeacherFor: user.classTeacherFor,
        token,
      },
    });
  } catch (error) {
    console.error("register error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while registering user",
    });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const passwordMatches = await verifyPassword(user, password);
    if (!passwordMatches) {
      return res.status(400).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const token = generateToken({
      userId: String(user._id),
      email: user.email,
      role: user.role,
      subject: user.subject,
      classTeacherFor: user.classTeacherFor,
    });

    return res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        subject: user.subject,
        classTeacherFor: user.classTeacherFor,
        token,
      },
    });
  } catch (error) {
    console.error("login error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while logging in",
    });
  }
};

const me = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const user = await User.findById(userId).select(
      "name email role subject classTeacherFor"
    );
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        subject: user.subject,
        classTeacherFor: user.classTeacherFor,
      },
    });
  } catch (error) {
    console.error("me error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching profile",
    });
  }
};

module.exports = {
  register,
  login,
  me,
};
