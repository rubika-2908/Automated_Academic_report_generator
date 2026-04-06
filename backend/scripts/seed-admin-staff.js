const dotenv = require("dotenv");
const path = require("path");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const connectDB = require("../config/db");
const User = require("../models/User");
const { SUBJECT_OPTIONS } = require("../utils/subjects");

dotenv.config({ path: path.join(__dirname, "..", ".env") });

const ADMIN_EMAIL = "admin@gmail.com";
const ADMIN_PASSWORD = "admin123";
const ADMIN_NAME = "Admin";

const staffSeed = [
  { name: "Kavitha S", email: "kavitha.tamil@school.com", subject: "Tamil", classTeacherFor: "Class 6A" },
  { name: "Rajesh K", email: "rajesh.english@school.com", subject: "English", classTeacherFor: "Class 6B" },
  { name: "Priya M", email: "priya.maths@school.com", subject: "Mathematics", classTeacherFor: "Class 6C" },
  { name: "Vikram R", email: "vikram.physics@school.com", subject: "Physics", classTeacherFor: "Class 7A" },
  { name: "Anitha P", email: "anitha.chem@school.com", subject: "Chemistry", classTeacherFor: "Class 7B" },
  { name: "Suresh V", email: "suresh.bio@school.com", subject: "Biology", classTeacherFor: "Class 7C" },
  { name: "Meena D", email: "meena.tamil2@school.com", subject: "Tamil", classTeacherFor: "Class 8A" },
  { name: "Arun S", email: "arun.english2@school.com", subject: "English", classTeacherFor: "Class 8B" },
  { name: "Latha G", email: "latha.maths2@school.com", subject: "Mathematics", classTeacherFor: "Class 8C" },
  { name: "Gopal N", email: "gopal.physics2@school.com", subject: "Physics", classTeacherFor: "Class 9A" },
  { name: "Divya K", email: "divya.chem2@school.com", subject: "Chemistry", classTeacherFor: "Class 9B" },
  { name: "Bala T", email: "bala.bio2@school.com", subject: "Biology", classTeacherFor: "Class 9C" },
  { name: "Shalini R", email: "shalini.tamil@school.com", subject: "Tamil", classTeacherFor: "Class 10A" },
  { name: "Naveen P", email: "naveen.english@school.com", subject: "English", classTeacherFor: "Class 10B" },
  { name: "Revathi L", email: "revathi.maths@school.com", subject: "Mathematics", classTeacherFor: "Class 10C" },
  { name: "Karthik V", email: "karthik.physics@school.com", subject: "Physics", classTeacherFor: "Class 11A" },
  { name: "Selvi M", email: "selvi.chem@school.com", subject: "Chemistry", classTeacherFor: "Class 11B" },
  { name: "Deepa N", email: "deepa.bio@school.com", subject: "Biology", classTeacherFor: "Class 11C" },
  { name: "Mohan S", email: "mohan.tamil@school.com", subject: "Tamil", classTeacherFor: "Class 12A" },
  { name: "Geetha R", email: "geetha.english@school.com", subject: "English", classTeacherFor: "Class 12B" },
  { name: "Arvind K", email: "arvind.maths@school.com", subject: "Mathematics", classTeacherFor: "Class 12C" },
];

const BCRYPT_ROUNDS = 10;

async function upsertAdmin() {
  const existing = await User.findOne({ email: ADMIN_EMAIL.toLowerCase() });
  const hashed = await bcrypt.hash(ADMIN_PASSWORD, BCRYPT_ROUNDS);
  if (existing) {
    existing.name = ADMIN_NAME;
    existing.password = hashed;
    existing.role = "admin";
    existing.subject = "";
    existing.classTeacherFor = "";
    await existing.save();
    console.log("Admin account updated:", ADMIN_EMAIL);
    return;
  }
  await User.create({
    name: ADMIN_NAME,
    email: ADMIN_EMAIL.toLowerCase(),
    password: hashed,
    role: "admin",
  });
  console.log("Admin account created:", ADMIN_EMAIL);
}

async function upsertStaff() {
  const seedEmails = staffSeed.map((staff) => staff.email.toLowerCase());
  for (const staff of staffSeed) {
    if (!SUBJECT_OPTIONS.includes(staff.subject)) {
      console.warn("Skipping staff with invalid subject:", staff);
      continue;
    }
    const existing = await User.findOne({ email: staff.email.toLowerCase() });
    const hashed = await bcrypt.hash("staff123", BCRYPT_ROUNDS);
    if (existing) {
      existing.name = staff.name;
      existing.subject = staff.subject;
      existing.classTeacherFor = staff.classTeacherFor;
      existing.role = "staff";
      await existing.save();
      console.log("Staff updated:", staff.email);
    } else {
      await User.create({
        name: staff.name,
        email: staff.email.toLowerCase(),
        password: hashed,
        role: "staff",
        subject: staff.subject,
        classTeacherFor: staff.classTeacherFor,
      });
      console.log("Staff created:", staff.email);
    }
  }
  await User.deleteMany({ role: "staff", email: { $nin: seedEmails } });
  console.log("Staff default password: staff123");
}

async function run() {
  await connectDB();
  await upsertAdmin();
  await upsertStaff();
  await mongoose.disconnect();
  console.log("Seed completed.");
}

run().catch((err) => {
  console.error("Seed failed:", err);
  mongoose.disconnect().finally(() => process.exit(1));
});
