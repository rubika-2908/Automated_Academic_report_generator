const { verifyToken } = require("../utils/token");
const User = require("../models/User");

const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization || "";
  const [scheme, token] = authHeader.split(" ");

  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized: token missing",
    });
  }

  try {
    const payload = verifyToken(token);
    const user = await User.findById(payload.userId);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: user not found",
      });
    }
    req.user = {
      userId: String(user._id),
      email: user.email,
      role: user.role,
      subject: user.subject,
      classTeacherFor: user.classTeacherFor,
    };
    return next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized: invalid or expired token",
    });
  }
};

module.exports = {
  authenticate,
};
