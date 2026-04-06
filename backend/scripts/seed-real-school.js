const dotenv = require("dotenv");
const path = require("path");
const mongoose = require("mongoose");
const connectDB = require("../config/db");
const AcademicRecord = require("../models/AcademicRecord");
const User = require("../models/User");
const { SUBJECT_OPTIONS } = require("../utils/subjects");

dotenv.config({ path: path.join(__dirname, "..", ".env") });

const TERMS = ["Term 1", "Term 2", "Term 3"];
const CLASS_NAMES = [
  "Class 6A",
  "Class 6B",
  "Class 6C",
  "Class 7A",
  "Class 7B",
  "Class 7C",
  "Class 8A",
  "Class 8B",
  "Class 8C",
  "Class 9A",
  "Class 9B",
  "Class 9C",
  "Class 10A",
  "Class 10B",
  "Class 10C",
  "Class 11A",
  "Class 11B",
  "Class 11C",
  "Class 12A",
  "Class 12B",
  "Class 12C",
];
const STUDENTS_PER_SECTION = 10;

const INITIALS = ["A", "B", "C", "D", "E", "F", "G", "H", "J", "K", "L", "M", "N", "P", "R", "S", "T", "V", "Y"];
const GIVEN_NAMES = [
  "Arjun",
  "Priya",
  "Karthik",
  "Divya",
  "Meena",
  "Suresh",
  "Vikram",
  "Anitha",
  "Rahul",
  "Sneha",
  "Ganesh",
  "Nandhini",
  "Hari",
  "Lavanya",
  "Ravi",
  "Kavya",
  "Kiran",
  "Deepa",
  "Lokesh",
  "Swathi",
];

const CLASS_TEACHERS = [
  { name: "Kavitha S", subject: "Tamil" },
  { name: "Rajesh K", subject: "English" },
  { name: "Priya M", subject: "Mathematics" },
  { name: "Vikram R", subject: "Physics" },
  { name: "Anitha P", subject: "Chemistry" },
  { name: "Suresh V", subject: "Biology" },
  { name: "Meena D", subject: "Tamil" },
  { name: "Arun S", subject: "English" },
  { name: "Latha G", subject: "Mathematics" },
  { name: "Gopal N", subject: "Physics" },
  { name: "Divya K", subject: "Chemistry" },
  { name: "Bala T", subject: "Biology" },
  { name: "Shalini R", subject: "English" },
  { name: "Naveen P", subject: "Mathematics" },
  { name: "Revathi L", subject: "Tamil" },
];

function pickStudentName(index) {
  const initial = INITIALS[index % INITIALS.length];
  const given = GIVEN_NAMES[index % GIVEN_NAMES.length];
  return `${initial}. ${given}`;
}

function classNumberFromName(className) {
  const match = String(className).match(/\d+/);
  return match ? match[0] : className.replace(/\s+/g, "");
}

async function run() {
  await connectDB();

  const admin = await User.findOne({ email: "admin@gmail.com" });
  if (!admin) {
    throw new Error("Admin user not found. Run scripts/seed-admin-staff.js first.");
  }

  await AcademicRecord.deleteMany({});

  const docs = [];
  let nameIndex = 0;
  let teacherIndex = 0;

  CLASS_NAMES.forEach((className) => {
    const classNumber = classNumberFromName(className);
    const section = String(className).slice(-1);
    const classTeacher = CLASS_TEACHERS[teacherIndex % CLASS_TEACHERS.length];
    teacherIndex += 1;
    for (let roll = 1; roll <= STUDENTS_PER_SECTION; roll += 1) {
      const studentName = pickStudentName(nameIndex);
      nameIndex += 1;
      const registerNumber = `${classNumber}${section}-${String(roll).padStart(3, "0")}`;
      TERMS.forEach((term) => {
        SUBJECT_OPTIONS.forEach((subject) => {
          docs.push({
            studentName,
            registerNumber,
            className,
            section,
            classTeacherName: classTeacher.name,
            classTeacherSubject: classTeacher.subject,
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
  console.log(`Deleted all existing records and inserted ${docs.length} new records.`);
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error("Seed failed:", err);
  mongoose.disconnect().finally(() => process.exit(1));
});
