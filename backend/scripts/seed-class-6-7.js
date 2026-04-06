const dotenv = require("dotenv");
const path = require("path");
const mongoose = require("mongoose");
const connectDB = require("../config/db");
const AcademicRecord = require("../models/AcademicRecord");
const User = require("../models/User");
const { SUBJECT_OPTIONS } = require("../utils/subjects");

dotenv.config({ path: path.join(__dirname, "..", ".env") });

const TERMS = ["First Term", "Second Term", "Third Term"];
const CLASS_NAMES = ["Class 6", "Class 7"];
const STUDENTS_PER_CLASS = 30;

async function run() {
  await connectDB();

  const admin = await User.findOne({ email: "admin@gmail.com" });
  if (!admin) {
    throw new Error("Admin user not found. Seed admin first.");
  }

  const docs = [];
  CLASS_NAMES.forEach((className) => {
    for (let index = 1; index <= STUDENTS_PER_CLASS; index += 1) {
      const studentName = `${className} Student ${String(index).padStart(2, "0")}`;
      TERMS.forEach((term) => {
        SUBJECT_OPTIONS.forEach((subject) => {
          docs.push({
            studentName,
            className,
            subject,
            term,
            marks: Math.floor(Math.random() * 41) + 60,
            createdBy: admin._id,
          });
        });
      });
    }
  });

  await AcademicRecord.insertMany(docs);
  console.log(`Inserted ${docs.length} records for Class 6 and 7.`);
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error("Seed failed:", err);
  mongoose.disconnect().finally(() => process.exit(1));
});
