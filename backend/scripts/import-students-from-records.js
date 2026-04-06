require("dotenv").config();
const mongoose = require("mongoose");
const AcademicRecord = require("../models/AcademicRecord");
const Student = require("../models/Student");

function normalizeSection(section, registerNumber) {
  const explicit = String(section || "").trim().toUpperCase();
  if (["A", "B", "C"].includes(explicit)) return explicit;

  const match = String(registerNumber || "").trim().toUpperCase().match(/^\d+([A-Z])-/);
  if (match && ["A", "B", "C"].includes(match[1])) return match[1];
  return "A";
}

function inferAdmissionYear(record) {
  const createdAt = record?.createdAt ? new Date(record.createdAt) : null;
  const year = createdAt instanceof Date && !Number.isNaN(createdAt.getTime()) ? createdAt.getFullYear() : new Date().getFullYear();
  return Math.min(Math.max(year, 2000), 2100);
}

async function run() {
  await mongoose.connect(process.env.MONGO_URI);

  const records = await AcademicRecord.find({})
    .sort({ createdAt: 1, _id: 1 })
    .lean();

  const byRegister = new Map();
  records.forEach((record) => {
    const registerNumber = String(record?.registerNumber || "").trim();
    if (!registerNumber || byRegister.has(registerNumber)) return;
    byRegister.set(registerNumber, record);
  });

  const registerNumbers = [...byRegister.keys()];
  const existingStudents = await Student.find({ registerNumber: { $in: registerNumbers } })
    .select("registerNumber")
    .lean();
  const existingSet = new Set(existingStudents.map((student) => String(student.registerNumber || "").trim()));

  const docs = [];
  byRegister.forEach((record, registerNumber) => {
    if (existingSet.has(registerNumber)) return;

    docs.push({
      registerNumber,
      studentName: String(record.studentName || "").trim(),
      parentName: "",
      place: "",
      parentPhone: "",
      className: String(record.className || "").trim() || "Not Specified",
      section: normalizeSection(record.section, registerNumber),
      admissionYear: inferAdmissionYear(record),
      createdBy: record.createdBy,
    });
  });

  if (docs.length) {
    await Student.insertMany(docs, { ordered: false });
  }

  console.log(
    JSON.stringify(
      {
        recordsScanned: records.length,
        uniqueRegisterNumbers: registerNumbers.length,
        existingStudents: existingSet.size,
        importedStudents: docs.length,
        finalStudentCount: await Student.countDocuments(),
      },
      null,
      2
    )
  );

  await mongoose.disconnect();
}

run().catch(async (error) => {
  console.error("import-students-from-records failed:", error);
  try {
    await mongoose.disconnect();
  } catch {}
  process.exit(1);
});
