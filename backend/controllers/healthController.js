const healthCheck = (req, res) => {
  res.status(200).json({
    success: true,
    message: "Backend is running",
    environment: process.env.NODE_ENV || "development",
  });
};

module.exports = { healthCheck };
