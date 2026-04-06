const mongoose = require("mongoose");
const dotenv = require("dotenv");
const AcademicRecord = require("../models/AcademicRecord");

dotenv.config();

const CLASS_LIST = ["Class 6", "Class 7", "Class 8", "Class 9", "Class 10", "Class 11", "Class 12"];
const STUDENTS_PER_CLASS = 10;

const NAMES = [
  "Aarav", "Aditi", "Akash", "Ananya", "Arjun", "Bhavya", "Divya", "Gokul", "Harini", "Ishaan",
  "Janani", "Karthik", "Keerthi", "Kiran", "Lakshmi", "Manoj", "Meera", "Mohan", "Nandini", "Naveen",
  "Neha", "Nila", "Pooja", "Pranav", "Priya", "Rahul", "Ravi", "Riya", "Sahana", "Sanjay",
  "Saravanan", "Shalini", "Shreya", "Siddharth", "Sowmya", "Srinivas", "Suresh", "Swathi", "Tejas", "Varun",
  "Vidhya", "Vikram", "Vishal", "Yamini", "Yash", "Abhishek", "Anjali", "Deepak", "Gowri", "Kavya",
  "Krishna", "Madhav", "Malathi", "Nikhil", "Pavithra", "Rekha", "Rohit", "Sathish", "Shankar", "Shruthi",
  "Siva", "Sreya", "Uma", "Vandana", "Vijay", "Vimal", "Vinod", "Yogesh", "Zoya", "Charan"
];

function shuffle(list) {
  const arr = [...list];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

async function run() {
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is missing in backend/.env");
  }

  await mongoose.connect(process.env.MONGO_URI);

  const requiredNames = CLASS_LIST.length * STUDENTS_PER_CLASS;
  if (NAMES.length < requiredNames) {
    throw new Error(`Need at least ${requiredNames} names, but only have ${NAMES.length}.`);
  }

  const shuffled = shuffle(NAMES).slice(0, requiredNames);
  const updates = [];
  let nameIndex = 0;

  for (const className of CLASS_LIST) {
    for (let i = 1; i <= STUDENTS_PER_CLASS; i += 1) {
      const oldName = `${className} Student ${String(i).padStart(2, "0")}`;
      const newName = shuffled[nameIndex];
      nameIndex += 1;
      updates.push({ oldName, newName });
    }
  }

  let totalUpdated = 0;
  for (const { oldName, newName } of updates) {
    const result = await AcademicRecord.updateMany(
      { studentName: oldName },
      { $set: { studentName: newName } }
    );
    totalUpdated += result.modifiedCount || 0;
  }

  await mongoose.disconnect();
  console.log(`Updated ${totalUpdated} records with new student names.`);
}

run().catch((error) => {
  console.error("Name update failed:", error.message);
  process.exit(1);
});
