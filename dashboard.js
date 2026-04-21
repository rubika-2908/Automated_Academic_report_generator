const API_BASE_URL = window.APP_CONFIG?.apiBaseUrl || "http://localhost:5000/api";
const AUTH_TOKEN_KEY = "academic_auth_token";

const recordForm = document.getElementById("recordForm");
const createPanel = document.getElementById("createPanel");
const toggleCreateBtn = document.getElementById("toggleCreateBtn");
const viewMode = document.getElementById("viewMode");
const studentRoster = document.getElementById("studentRoster");

const classFilter = document.getElementById("classFilter");
const sectionFilter = document.getElementById("sectionFilter");
const studentFilter = document.getElementById("studentFilter");
const studentTermFilter = document.getElementById("studentTermFilter");
const downloadStudentReportBtn = document.getElementById("downloadStudentReportBtn");
const downloadStudentReportPdfBtn = document.getElementById("downloadStudentReportPdfBtn");
const academicYearInput = document.getElementById("academicYearInput");
const autoFillAll = document.getElementById("autoFillAll");

const classWiseView = document.getElementById("classWiseView");
const studentReportView = document.getElementById("studentReportView");
const SCHOOL_NAME = "Adharsh Vidhyalaya Matric Hr Sec School";
const DEFAULT_SUBJECTS = ["Tamil", "English", "Mathematics", "Physics", "Chemistry", "Biology"];
const DEFAULT_TERMS = ["Term 1", "Term 2", "Term 3"];
const BIOLOGY_SUBJECT = "Biology";
let editingRecordId = "";
let recordsCache = [];
let studentsCache = [];
let lastFetchFailed = false;
let currentUser = null;

function makeRecordId(index = 0) {
  return `rec_${Date.now()}_${index}_${Math.random().toString(36).slice(2, 8)}`;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function normalizeTerm(termName) {
  const t = String(termName || "").trim().toLowerCase();
  if (t === "term 1" || t === "term i") return "Term 1";
  if (t === "term 2" || t === "term ii") return "Term 2";
  if (t === "term 3" || t === "term iii") return "Term 3";
  if (t === "first term" || t === "first mid term") return "First Term";
  if (t === "second term" || t === "second mid term") return "Second Term";
  if (t === "third term") return "Third Term";
  return String(termName || "").trim() || "Term 1";
}

function getAuthToken() {
  return localStorage.getItem(AUTH_TOKEN_KEY) || "";
}

async function apiRequest(path, options = {}) {
  const token = getAuthToken();
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload?.success === false) {
    const message = payload?.message || "Request failed.";
    throw new Error(message);
  }
  return payload;
}

async function fetchCurrentUser() {
  try {
    const payload = await apiRequest("/auth/me", { method: "GET" });
    currentUser = payload?.data || null;
    return currentUser;
  } catch {
    currentUser = null;
    return null;
  }
}

async function fetchRecords() {
  const token = getAuthToken();
  if (!token) {
    lastFetchFailed = true;
    return [];
  }

  try {
    const user = currentUser || (await fetchCurrentUser());
    const isAdmin = user?.role === "admin";
    const hasSubject = Boolean(user?.subject);
    const classTeacherFor = user?.classTeacherFor;
    const endpoint =
      isAdmin || hasSubject
        ? "/records"
        : classTeacherFor
          ? `/records/class/${encodeURIComponent(classTeacherFor)}`
          : "/records";
    const payload = await apiRequest(endpoint, { method: "GET" });
    const records = Array.isArray(payload?.data) ? payload.data : [];
    lastFetchFailed = false;
    return records
      .map((r) => ({
        id: String(r._id || r.id || "").trim(),
        studentName: String(r.studentName || "").trim(),
        registerNumber: String(r.registerNumber || "").trim(),
        className: String(r.className || "").trim(),
        section: String(r.section || "").trim(),
        subjectName: String(r.subject || r.subjectName || "").trim(),
        termName: normalizeTerm(r.term || r.termName),
        marks: Number(r.marks),
      }))
      .filter(
        (r) =>
          r.id &&
          r.studentName &&
          r.registerNumber &&
          r.className &&
          r.section &&
          r.subjectName &&
          Number.isFinite(r.marks)
      );
  } catch {
    lastFetchFailed = true;
    return [];
  }
}

async function fetchStudents() {
  const token = getAuthToken();
  if (!token) return [];

  try {
    const payload = await apiRequest("/students", { method: "GET" });
    const students = Array.isArray(payload?.data) ? payload.data : [];
    return students
      .map((student) => ({
        id: String(student._id || student.id || "").trim(),
        studentName: String(student.studentName || "").trim(),
        registerNumber: String(student.registerNumber || "").trim(),
        className: String(student.className || "").trim(),
        section: String(student.section || "").trim(),
      }))
      .filter((student) => student.studentName && student.registerNumber && student.className && student.section);
  } catch {
    return [];
  }
}

function uniqueValues(records, key) {
  return [...new Set(records.map((r) => r[key]).filter(Boolean))].sort();
}

function fillFilter(select, values, allLabel = "All") {
  if (!select) return;
  const current = select.value || "all";
  select.innerHTML = `<option value="all">${allLabel}</option>`;
  values.forEach((value) => {
    const opt = document.createElement("option");
    opt.value = value;
    opt.textContent = value;
    select.appendChild(opt);
  });
  select.value = values.includes(current) ? current : "all";
}

function fillRequiredFilter(select, values, placeholder) {
  if (!select) return;
  const current = select.value || "";
  select.innerHTML = `<option value="">${placeholder}</option>`;
  values.forEach((value) => {
    const opt = document.createElement("option");
    opt.value = value;
    opt.textContent = value;
    select.appendChild(opt);
  });
  select.value = values.includes(current) ? current : "";
}

function fillStudentRoster(select, students) {
  if (!select) return;
  const current = select.value || "";
  select.innerHTML = '<option value="">Choose a student</option>';
  students.forEach((student) => {
    const opt = document.createElement("option");
    opt.value = student.registerNumber;
    opt.textContent = `${student.studentName} (${student.registerNumber})`;
    select.appendChild(opt);
  });
  select.value = students.some((student) => student.registerNumber === current) ? current : "";
}

function getVisibleStudents(allRecords) {
  const map = new Map();

  studentsCache.forEach((student) => {
    map.set(student.registerNumber, student);
  });

  allRecords.forEach((record) => {
    if (!record?.registerNumber) return;
    if (!map.has(record.registerNumber)) {
      map.set(record.registerNumber, {
        registerNumber: record.registerNumber,
        studentName: record.studentName,
        className: record.className,
        section: record.section,
      });
    }
  });

  const classValue = classFilter?.value || "all";
  const sectionValue = sectionFilter?.value || "all";

  return [...map.values()]
    .filter((student) => {
      const classOk = classValue === "all" || student.className === classValue;
      const sectionOk = sectionValue === "all" || student.section === sectionValue;
      return classOk && sectionOk;
    })
    .sort((a, b) => a.studentName.localeCompare(b.studentName) || a.registerNumber.localeCompare(b.registerNumber));
}

function getStudentFieldValues(key) {
  return [...new Set(studentsCache.map((student) => student[key]).filter(Boolean))].sort();
}

function syncRecordFormStudent(registerNumber) {
  if (!recordForm) return;
  const student = studentsCache.find((item) => item.registerNumber === registerNumber);
  if (!student) return;

  const studentInput = recordForm.querySelector("#studentName");
  const registerInput = recordForm.querySelector("#registerNumber");
  const classInput = recordForm.querySelector("#className");
  const sectionInput = recordForm.querySelector("#sectionName");

  if (studentInput) studentInput.value = student.studentName;
  if (registerInput) registerInput.value = student.registerNumber;
  if (classInput) classInput.value = student.className;
  if (sectionInput) sectionInput.value = student.section;
}

function applyGlobalFilters(records) {
  return records.filter((r) => {
    const classOk = classFilter.value === "all" || r.className === classFilter.value;
    const sectionOk = !sectionFilter || sectionFilter.value === "all" || r.section === sectionFilter.value;
    return classOk && sectionOk;
  });
}

function groupBy(records, key) {
  return records.reduce((acc, r) => {
    if (!acc[r[key]]) acc[r[key]] = [];
    acc[r[key]].push(r);
    return acc;
  }, {});
}

function avg(rows) {
  if (!rows.length) return null;
  return rows.reduce((sum, r) => sum + r.marks, 0) / rows.length;
}

function createTable(headers, rows) {
  if (!rows.length) return '<p class="empty">No records found.</p>';
  const th = headers.map((h) => `<th>${h}</th>`).join("");
  const tr = rows.map((row) => `<tr>${row.map((c) => `<td>${c}</td>`).join("")}</tr>`).join("");
  return `<table><thead><tr>${th}</tr></thead><tbody>${tr}</tbody></table>`;
}

function createGroup(title, contentHtml) {
  return `<section class="group"><h4 class="group__title">${title}</h4>${contentHtml}</section>`;
}

function randomMarks(min = 45, max = 100) {
  const low = Math.max(0, Math.min(100, Math.floor(min)));
  const high = Math.max(low, Math.min(100, Math.floor(max)));
  return Math.floor(Math.random() * (high - low + 1)) + low;
}

function createActionMenu(recordId) {
  return `<div class="table-actions">
    <details class="action-menu">
      <summary class="action-dots" aria-label="Row actions">...</summary>
      <div class="action-popover">
        <button class="action-item record-edit" data-id="${recordId}" type="button">Edit</button>
        <button class="action-item action-item--danger record-delete" data-id="${recordId}" type="button">Delete</button>
      </div>
    </details>
  </div>`;
}

function gradeFromMarks(marks) {
  if (marks >= 90) return "A+";
  if (marks >= 80) return "A";
  if (marks >= 70) return "B";
  if (marks >= 60) return "B+";
  if (marks >= 50) return "C";
  return "R (Arrear)";
}

function getStudentTermRows(records, studentName, termName) {
  return records.filter((r) => r.studentName === studentName && r.termName === termName);
}

function renderClassRecords(records) {
  if (currentUser?.subject === BIOLOGY_SUBJECT) {
    const biologyRows = records.filter((r) => r.subjectName === BIOLOGY_SUBJECT);
    const groups = biologyRows.reduce((acc, r) => {
      const key = `${r.className} - ${r.section}`;
      if (!acc[key]) acc[key] = [];
      acc[key].push(r);
      return acc;
    }, {});
    const keys = Object.keys(groups).sort();
    if (!keys.length) {
      classWiseView.innerHTML = '<p class="empty">No biology records to show.</p>';
      return;
    }

    classWiseView.innerHTML = keys
      .map((key) => {
        const rows = groups[key];
        const average = avg(rows);
        const averageText = average === null ? "N/A" : `${average.toFixed(2)}%`;
        return `
          <section class="metric">
            <p class="metric__label">${key} Biology Average</p>
            <p class="metric__value">${averageText}</p>
          </section>
        `;
      })
      .join("");
    return;
  }

  const groups = records.reduce((acc, r) => {
    const key = `${r.className} - ${r.section}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(r);
    return acc;
  }, {});
  const keys = Object.keys(groups).sort();
  if (!keys.length) {
    classWiseView.innerHTML = '<p class="empty">No class-wise records to show.</p>';
    return;
  }

  classWiseView.innerHTML = keys
    .map((key) => {
      const rows = groups[key];
      const rowsHtml = createTable(
        ["Reg No", "Student", "Subject", "Term", "Marks", "Action"],
        rows.map((r) => [
          r.registerNumber,
          r.studentName,
          r.subjectName,
          r.termName,
          r.marks,
          createActionMenu(r.id),
        ])
      );
      const average = avg(rows);
      return createGroup(`${key} (${rows.length}) | Avg: ${average === null ? "N/A" : `${average.toFixed(2)}%`}`, rowsHtml);
    })
    .join("");
}

function renderStudentReport(records) {
  const selectedRegister = studentFilter.value;
  const studentOnly = selectedRegister ? records.filter((r) => r.registerNumber === selectedRegister) : [];
  fillRequiredFilter(studentTermFilter, uniqueValues(studentOnly, "termName"), studentOnly.length ? "Select term" : "No terms yet");
  const selectedTerm = studentTermFilter.value;

  if (!selectedRegister) {
    studentReportView.innerHTML = '<p class="empty">Select a register number to view the full report.</p>';
    return;
  }

  const studentRecords = records.filter((r) => r.registerNumber === selectedRegister);
  if (!studentRecords.length) {
    studentReportView.innerHTML = '<p class="empty">No records available for this student.</p>';
    return;
  }

  if (!selectedTerm) {
    studentReportView.innerHTML = '<p class="empty">Select a term to view marksheet and download report.</p>';
    return;
  }

  const termRecords = studentRecords.filter((r) => r.termName === selectedTerm);
  if (!termRecords.length) {
    studentReportView.innerHTML = '<p class="empty">No records for selected student and term.</p>';
    return;
  }

  const studentName = termRecords[0].studentName;
  const academicYear = String(academicYearInput?.value || "").trim() || "2026-2027";
  const totalMarks = termRecords.reduce((sum, r) => sum + Number(r.marks || 0), 0);
  const percentage = avg(termRecords) || 0;

  const marksheetRows = termRecords
    .slice()
    .sort((a, b) => a.subjectName.localeCompare(b.subjectName))
    .map((r) => [r.subjectName, r.marks, gradeFromMarks(r.marks)]);

  const marksheetRowsHtml = marksheetRows
    .map((row) => `<tr><td>${row[0]}</td><td>${row[1]}</td><td>${row[2]}</td></tr>`)
    .join("");
  const tableHtml = `
    <table>
      <thead>
        <tr><th>Subject</th><th>Marks Obtained</th><th>Grade</th></tr>
      </thead>
      <tbody>
        ${marksheetRowsHtml}
        <tr><td><strong>Total</strong></td><td><strong>${totalMarks}</strong></td><td>-</td></tr>
        <tr><td><strong>Percentage</strong></td><td><strong>${percentage.toFixed(2)}%</strong></td><td>-</td></tr>
      </tbody>
    </table>
  `;

  studentReportView.innerHTML = `
    <section class="marksheet">
      <div class="marksheet__head">
        <p class="marksheet__board">CENTRAL BOARD OF SECONDARY EDUCATION</p>
        <p class="marksheet__title">${SCHOOL_NAME}</p>
        <p class="marksheet__meta">Statement of Marks</p>
      </div>
      <div class="marksheet__meta-grid">
        <p><strong>Academic Year:</strong> ${academicYear}</p>
        <p><strong>Term:</strong> ${selectedTerm}</p>
        <p><strong>Student Name:</strong> ${studentName}</p>
        <p><strong>Class:</strong> ${termRecords[0].className}</p>
        <p><strong>Section:</strong> ${termRecords[0].section}</p>
        <p><strong>Register No:</strong> ${termRecords[0].registerNumber}</p>
      </div>
      ${tableHtml}
      <div class="marksheet__spacer"></div>
      <div class="marksheet__signature-row">
        <p>Student Signature</p>
        <p>Mentor Signature</p>
      </div>
    </section>
  `;
}

function setActiveView() {
  const selected = viewMode.value;
  document.querySelectorAll(".view-pane").forEach((pane) => {
    pane.classList.toggle("is-active", pane.getAttribute("data-view") === selected);
  });
}

function renderAll(allRecords) {
  if (!Array.isArray(allRecords)) allRecords = [];

  const classValues = [...new Set([...uniqueValues(allRecords, "className"), ...getStudentFieldValues("className")])].sort();
  const sectionValues = [...new Set([...uniqueValues(allRecords, "section"), ...getStudentFieldValues("section")])].sort();

  fillFilter(classFilter, classValues, "All Classes");
  if (sectionFilter) fillFilter(sectionFilter, sectionValues, "All Sections");
  const visibleStudents = getVisibleStudents(allRecords);
  fillStudentRoster(studentRoster, visibleStudents);
  fillRequiredFilter(
    studentFilter,
    visibleStudents.map((student) => student.registerNumber),
    "Select register number"
  );

  if (currentUser?.classTeacherFor && !currentUser?.subject && classFilter) {
    classFilter.value = currentUser.classTeacherFor;
    classFilter.disabled = true;
  }

  if (currentUser?.subject === BIOLOGY_SUBJECT) {
    if (classFilter) {
      classFilter.value = "all";
      classFilter.disabled = true;
    }
    if (viewMode) viewMode.value = "classRecords";
    const viewLabel = viewMode?.closest("label");
    if (viewLabel) viewLabel.style.display = "none";
    const studentView = document.querySelector('[data-view="studentReport"]');
    if (studentView) studentView.style.display = "none";
    if (toggleCreateBtn) toggleCreateBtn.style.display = "none";
    if (createPanel) createPanel.style.display = "none";
  }

  const filtered = applyGlobalFilters(allRecords);
  renderClassRecords(filtered);
  renderStudentReport(allRecords);
  setActiveView();

  if (lastFetchFailed) {
    classWiseView.innerHTML = '<p class="empty">Unable to load records. Please log in again.</p>';
  }
}

async function deleteRecordById(recordId) {
  try {
    await apiRequest(`/records/${recordId}`, { method: "DELETE" });
  } catch {
    return;
  }
  if (editingRecordId === recordId) {
    editingRecordId = "";
  }
  await refreshAndRender();
}

function startEditRecordById(recordId) {
  if (!recordForm) return;
  const record = recordsCache.find((r) => r.id === recordId);
  if (!record) return;

  const studentInput = recordForm.querySelector("#studentName");
  const registerInput = recordForm.querySelector("#registerNumber");
  const classInput = recordForm.querySelector("#className");
  const sectionInput = recordForm.querySelector("#sectionName");
  const subjectInput = recordForm.querySelector("#subjectName");
  const termInput = recordForm.querySelector("#termName");
  const marksInput = recordForm.querySelector("#marks");
  const submitBtn = recordForm.querySelector('button[type="submit"]');

  if (studentInput) studentInput.value = record.studentName;
  if (registerInput) registerInput.value = record.registerNumber;
  if (classInput) classInput.value = record.className;
  if (sectionInput) sectionInput.value = record.section;
  if (subjectInput) subjectInput.value = record.subjectName;
  if (termInput) termInput.value = record.termName;
  if (marksInput) marksInput.value = String(record.marks);
  if (studentRoster) studentRoster.value = record.registerNumber;
  if (submitBtn) submitBtn.textContent = "Update Record";

  editingRecordId = recordId;
  if (createPanel) createPanel.classList.remove("is-hidden");
}

if (toggleCreateBtn && createPanel) {
  toggleCreateBtn.addEventListener("click", () => {
    createPanel.classList.toggle("is-hidden");
  });
}

if (recordForm) {
  recordForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!recordForm.checkValidity()) {
      recordForm.reportValidity();
      return;
    }

    const formData = new FormData(recordForm);
    const studentName = String(formData.get("studentName") || "").trim();
    const registerNumber = String(formData.get("registerNumber") || "").trim();
    const className = String(formData.get("className") || "").trim();
    const section = String(formData.get("sectionName") || "").trim();
    const subjectName = String(formData.get("subjectName") || "").trim();
    const termName = normalizeTerm(formData.get("termName"));
    const marksValue = Number(formData.get("marks"));
    const useAutoFill = Boolean(autoFillAll?.checked);

    try {
      if (editingRecordId) {
        await apiRequest(`/records/${editingRecordId}`, {
          method: "PUT",
          body: JSON.stringify({
            studentName,
            registerNumber,
            className,
            section,
            subject: subjectName,
            term: termName,
            marks: marksValue,
          }),
        });
      } else if (useAutoFill) {
        const subjects = DEFAULT_SUBJECTS;
        const terms = DEFAULT_TERMS;
        const tasks = [];
        subjects.forEach((subject) => {
          terms.forEach((term) => {
            tasks.push(
              apiRequest("/records", {
                method: "POST",
                body: JSON.stringify({
                  studentName,
                  registerNumber,
                  className,
                  section,
                  subject,
                  term,
                  marks: randomMarks(),
                }),
              })
            );
          });
        });
        await Promise.all(tasks);
      } else {
        await apiRequest("/records", {
          method: "POST",
          body: JSON.stringify({
            studentName,
            registerNumber,
            className,
            section,
            subject: subjectName,
            term: termName,
            marks: marksValue,
          }),
        });
      }
    } catch {
      return;
    }

    const classValue = className;
    const subjectValue = subjectName;
    const sectionValue = section;
    const termValue = termName;
    const submitBtn = recordForm.querySelector('button[type="submit"]');
    const wasEditing = Boolean(editingRecordId);
    editingRecordId = "";
    if (submitBtn) submitBtn.textContent = "Add Record";
    recordForm.reset();
    const classInput = recordForm.querySelector("#className");
    const sectionInput = recordForm.querySelector("#sectionName");
    const subjectInput = recordForm.querySelector("#subjectName");
    const termInput = recordForm.querySelector("#termName");
    if (autoFillAll) autoFillAll.checked = false;
    if (studentRoster) studentRoster.value = "";
    if (!wasEditing) {
      if (classInput) classInput.value = classValue;
      if (sectionInput) sectionInput.value = sectionValue;
      if (subjectInput) subjectInput.value = subjectValue;
      if (termInput) termInput.value = termValue;
    }
    await refreshAndRender();
  });
}

if (studentRoster) {
  studentRoster.addEventListener("change", () => {
    syncRecordFormStudent(studentRoster.value);
  });
}

[viewMode, classFilter, sectionFilter, studentFilter].forEach(
  (el) => {
    if (el) el.addEventListener("change", () => renderAll(recordsCache));
  }
);

if (studentTermFilter) {
  studentTermFilter.addEventListener("change", () => renderAll(recordsCache));
}

if (downloadStudentReportBtn) {
  downloadStudentReportBtn.addEventListener("click", () => {
    const records = recordsCache;
    const selectedRegister = studentFilter.value;
    const termName = studentTermFilter.value;

    if (!selectedRegister || !termName) return;

    const rows = records
      .filter((r) => r.registerNumber === selectedRegister && r.termName === termName)
      .slice()
      .sort((a, b) => a.subjectName.localeCompare(b.subjectName));

    if (!rows.length) return;
    const studentName = rows[0].studentName;
    const schoolName = SCHOOL_NAME;
    const academicYear = String(academicYearInput?.value || "").trim() || "2026-2027";
    const totalMarks = rows.reduce((sum, r) => sum + Number(r.marks || 0), 0);
    const percentage = avg(rows) || 0;
    const rowsHtml = rows
      .map((r) => `<tr><td>${escapeHtml(r.subjectName)}</td><td>${escapeHtml(r.marks)}</td><td>${escapeHtml(gradeFromMarks(r.marks))}</td></tr>`)
      .join("");
    const html = `<!doctype html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>${escapeHtml(studentName)} ${escapeHtml(termName)} Marksheet</title>
  <style>
    body { font-family: "Times New Roman", serif; margin: 16px; background: #eef5f2; }
    .sheet { max-width: 820px; margin: 0 auto; background: #fff; border: 3px double #2e5e52; padding: 16px; }
    .board { margin: 0; text-align: center; font-size: 16px; letter-spacing: 0.4px; color: #1f3f36; }
    .school { margin: 4px 0 2px; text-align: center; font-size: 22px; font-weight: 700; color: #16352e; }
    .sub { margin: 0 0 12px; text-align: center; font-size: 13px; }
    .meta { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
    .meta td { border: 1px solid #506f67; padding: 6px 8px; font-size: 13px; }
    table { width: 100%; border-collapse: collapse; }
    th, td { border: 1px solid #506f67; padding: 7px 8px; text-align: left; font-size: 13px; }
    th { background: #e8f2ee; }
    .spacer { height: 180px; }
    .signature-row { display: flex; justify-content: space-between; margin-top: 10px; font-size: 13px; font-weight: 700; }
  </style>
</head>
<body>
  <div class="sheet">
    <p class="board">CENTRAL BOARD OF SECONDARY EDUCATION</p>
    <p class="school">${escapeHtml(schoolName)}</p>
    <p class="sub">Statement of Marks</p>
    <table class="meta">
      <tr><td><strong>Academic Year</strong>: ${escapeHtml(academicYear)}</td><td><strong>Term</strong>: ${escapeHtml(termName)}</td></tr>
      <tr><td><strong>Student Name</strong>: ${escapeHtml(studentName)}</td><td><strong>Class</strong>: ${escapeHtml(rows[0].className)}</td></tr>
      <tr><td><strong>Section</strong>: ${escapeHtml(rows[0].section)}</td><td><strong>Register No</strong>: ${escapeHtml(rows[0].registerNumber)}</td></tr>
    </table>
    <table>
      <thead>
        <tr><th>Subject</th><th>Marks Obtained</th><th>Grade</th></tr>
      </thead>
      <tbody>
        ${rowsHtml}
        <tr><td><strong>Total</strong></td><td><strong>${escapeHtml(totalMarks)}</strong></td><td>-</td></tr>
        <tr><td><strong>Percentage</strong></td><td><strong>${escapeHtml(percentage.toFixed(2))}%</strong></td><td>-</td></tr>
      </tbody>
    </table>
    <div class="spacer"></div>
    <div class="signature-row">
      <p>Student Signature</p>
      <p>Mentor Signature</p>
    </div>
  </div>
</body>
</html>`;

    const blob = new Blob([html], { type: "text/html;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const safeStudent = studentName.replace(/[^a-z0-9]+/gi, "_");
    const safeTerm = termName.replace(/[^a-z0-9]+/gi, "_");
    link.href = url;
    link.download = `${safeStudent}_${selectedRegister}_${safeTerm}_marksheet.html`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  });
}

if (academicYearInput) {
  academicYearInput.addEventListener("input", () => renderAll(recordsCache));
}

if (downloadStudentReportPdfBtn) {
  downloadStudentReportPdfBtn.addEventListener("click", () => {
    const records = recordsCache;
    const selectedRegister = studentFilter.value;
    const termName = studentTermFilter.value;

    if (!selectedRegister || !termName) return;

    const rows = records
      .filter((r) => r.registerNumber === selectedRegister && r.termName === termName)
      .slice()
      .sort((a, b) => a.subjectName.localeCompare(b.subjectName));
    if (!rows.length) return;

    const studentName = rows[0].studentName;
    const academicYear = String(academicYearInput?.value || "").trim() || "2026-2027";
    const rowsHtml = rows
      .map((r) => `<tr><td>${escapeHtml(r.subjectName)}</td><td>${escapeHtml(r.marks)}</td><td>${escapeHtml(gradeFromMarks(r.marks))}</td></tr>`)
      .join("");

    const printableHtml = `<!doctype html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>${escapeHtml(studentName)} ${escapeHtml(termName)} Marksheet</title>
  <style>
    body { font-family: "Times New Roman", serif; margin: 20px; color: #000; background: #eef5f2; }
    .sheet { border: 3px double #1d3f36; padding: 14px; background: #fff; }
    .board { margin: 0; text-align: center; font-size: 16px; letter-spacing: 0.4px; }
    h1 { margin: 3px 0 0; text-align: center; font-size: 24px; letter-spacing: 0.2px; }
    .subhead { text-align: center; margin: 6px 0 14px; font-size: 14px; }
    .meta { width: 100%; margin-bottom: 12px; border-collapse: collapse; }
    .meta td { border: 1px solid #1d3f36; padding: 6px 8px; font-size: 14px; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
    th, td { border: 1px solid #1d3f36; padding: 8px; font-size: 14px; text-align: left; }
    th { background: #e8f2ee; }
    .spacer { height: 200px; }
    .signature-row { display: flex; justify-content: space-between; margin-top: 12px; font-size: 14px; font-weight: 700; }
  </style>
</head>
<body>
  <div class="sheet">
    <p class="board">CENTRAL BOARD OF SECONDARY EDUCATION</p>
    <h1>${escapeHtml(SCHOOL_NAME)}</h1>
    <div class="subhead">Statement of Marks</div>
    <table class="meta">
      <tr><td><strong>Academic Year</strong>: ${escapeHtml(academicYear)}</td><td><strong>Term</strong>: ${escapeHtml(termName)}</td></tr>
      <tr><td><strong>Student Name</strong>: ${escapeHtml(studentName)}</td><td><strong>Class</strong>: ${escapeHtml(rows[0].className)}</td></tr>
      <tr><td><strong>Section</strong>: ${escapeHtml(rows[0].section)}</td><td><strong>Register No</strong>: ${escapeHtml(rows[0].registerNumber)}</td></tr>
    </table>
    <table>
      <thead>
        <tr><th>Subject</th><th>Marks Obtained</th><th>Grade</th></tr>
      </thead>
      <tbody>
        ${rowsHtml}
        <tr><td><strong>Total</strong></td><td><strong>${escapeHtml(totalMarks)}</strong></td><td>-</td></tr>
        <tr><td><strong>Percentage</strong></td><td><strong>${escapeHtml(percentage.toFixed(2))}%</strong></td><td>-</td></tr>
      </tbody>
    </table>
    <div class="spacer"></div>
    <div class="signature-row">
      <p>Student Signature</p>
      <p>Mentor Signature</p>
    </div>
  </div>
  <script>
    window.onload = function () {
      window.print();
    };
  </script>
</body>
</html>`;

    const printWindow = window.open("", "_blank", "width=900,height=700");
    if (!printWindow) return;
    printWindow.document.open();
    printWindow.document.write(printableHtml);
    printWindow.document.close();
  });
}

document.addEventListener("click", (event) => {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;
  const editBtn = target.closest(".record-edit");
  if (editBtn) {
    const recordId = editBtn.getAttribute("data-id");
    if (recordId) startEditRecordById(recordId);
    return;
  }
  const btn = target.closest(".record-delete");
  if (!btn) return;
  const recordId = btn.getAttribute("data-id");
  if (!recordId) return;
  deleteRecordById(recordId);
});

window.addEventListener("resize", () => renderAll(recordsCache));

if (academicYearInput && !academicYearInput.value) {
  const year = new Date().getFullYear();
  academicYearInput.value = `${year}-${year + 1}`;
}

async function refreshAndRender() {
  await fetchCurrentUser();
  studentsCache = await fetchStudents();
  recordsCache = await fetchRecords();
  renderAll(recordsCache);
}

refreshAndRender();
