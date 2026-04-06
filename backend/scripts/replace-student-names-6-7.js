const dotenv = require("dotenv");
const path = require("path");
const mongoose = require("mongoose");
const connectDB = require("../config/db");
const AcademicRecord = require("../models/AcademicRecord");

dotenv.config({ path: path.join(__dirname, "..", ".env") });

const CLASS_NAMES = ["Class 6", "Class 7"];
const STUDENTS_PER_CLASS = 30;

const NAME_POOL = [
  "Aarav", "Aditi", "Akash", "Ananya", "Arjun", "Bhavana", "Charan", "Dhruv", "Diya", "Eshan",
  "Farah", "Gauri", "Harish", "Ishita", "Jeevan", "Kavya", "Kiran", "Lakshmi", "Manoj", "Meera",
  "Naveen", "Neha", "Nikhil", "Pooja", "Pranav", "Riya", "Rohan", "Sahana", "Sanjay", "Sneha",
  "Tejas", "Trisha", "Varun", "Vidya", "Vikram", "Yash", "Zara", "Arathi", "Balaji", "Chitra",
  "Deepak", "Gokul", "Hema", "Indira", "Jasmine", "Karthik", "Leela", "Mohan", "Nandini", "Omkar",
  "Pallavi", "Raghu", "Seema", "Tanya", "Usha", "Vani", "Wasim", "Zubin", "Srinidhi", "Keshav"
];

function buildUniqueNames(count) {
  const names = [];
  let index = 0;
  while (names.length < count) {
    const base = NAME_POOL[index % NAME_POOL.length];
    const suffix = Math.floor(index / NAME_POOL.length);
    const finalName = suffix > 0 ? `${base} ${suffix + 1}` : base;
    names.push(finalName);
    index += 1;
  }
  return names;
}

async function run() {
  await connectDB();
  const class6Names = buildUniqueNames(STUDENTS_PER_CLASS).map((name) => `${name}`);
  const class7Names = buildUniqueNames(STUDENTS_PER_CLASS).map((name) => `${name}`);

  for (const className of CLASS_NAMES) {
    const names = className === "Class 6" ? class6Names : class7Names;
    for (let i = 1; i <= STUDENTS_PER_CLASS; i += 1) {
      const oldName = `${className} Student ${String(i).padStart(2, "0")}`;
      const newName = names[i - 1];
      await AcademicRecord.updateMany(
        { className, studentName: oldName },
        { $set: { studentName: newName } }
      );
    }
  }

  console.log("Updated Class 6 and 7 student names to real names.");
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error("Update failed:", err);
  mongoose.disconnect().finally(() => process.exit(1));
});
