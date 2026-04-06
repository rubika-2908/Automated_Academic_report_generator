const dotenv = require("dotenv");
const path = require("path");
const mongoose = require("mongoose");
const connectDB = require("../config/db");
const AcademicRecord = require("../models/AcademicRecord");

dotenv.config({ path: path.join(__dirname, "..", ".env") });

const CLASS_NAME = "Class 6";
const TARGET_NAMES = [
  "Rahul",
  "Priya",
  "Arjun",
  "Anu",
  "Kiran",
  "Ravi",
  "Meena",
  "Suresh",
  "Divya",
  "Manoj",
  "Lakshmi",
  "Ajay",
  "Pooja",
  "Ramesh",
  "Kavya",
  "Sanjay",
  "Anitha",
  "Vijay",
  "Rekha",
  "Hari",
  "Neha",
  "Mohan",
  "Deepa",
  "Varun",
  "Latha",
  "Akash",
  "Nisha",
  "Raj",
  "Keerthi",
  "Tara",
];

async function run() {
  if (TARGET_NAMES.length !== 30) {
    throw new Error("TARGET_NAMES must have 30 names.");
  }

  await connectDB();

  const existingNames = await AcademicRecord.distinct("studentName", {
    className: CLASS_NAME,
  });

  const uniqueNames = existingNames
    .filter((name) => typeof name === "string" && name.trim())
    .sort((a, b) => a.localeCompare(b));

  if (uniqueNames.length !== 30) {
    throw new Error(`Expected 30 unique students in ${CLASS_NAME}, found ${uniqueNames.length}.`);
  }

  for (let i = 0; i < uniqueNames.length; i += 1) {
    const oldName = uniqueNames[i];
    const newName = TARGET_NAMES[i];
    await AcademicRecord.updateMany(
      { className: CLASS_NAME, studentName: oldName },
      { $set: { studentName: newName } }
    );
  }

  console.log(`Updated ${CLASS_NAME} student names.`);
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error("Update failed:", err);
  mongoose.disconnect().finally(() => process.exit(1));
});
