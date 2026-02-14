const STORAGE_KEY = "academic_records_v1";

const recordForm = document.getElementById("recordForm");
const createPanel = document.getElementById("createPanel");
const toggleCreateBtn = document.getElementById("toggleCreateBtn");
const viewMode = document.getElementById("viewMode");

const classFilter = document.getElementById("classFilter");
const subjectFilter = document.getElementById("subjectFilter");
const specificClassFilter = document.getElementById("specificClassFilter");
const specificSubjectFilter = document.getElementById("specificSubjectFilter");
const studentFilter = document.getElementById("studentFilter");
const studentTermFilter = document.getElementById("studentTermFilter");
const downloadStudentReportBtn = document.getElementById("downloadStudentReportBtn");
const downloadStudentReportPdfBtn = document.getElementById("downloadStudentReportPdfBtn");
const academicYearInput = document.getElementById("academicYearInput");
const chartClassFilter = document.getElementById("chartClassFilter");
const chartSubjectFilter = document.getElementById("chartSubjectFilter");

const classWiseView = document.getElementById("classWiseView");
const subjectWiseView = document.getElementById("subjectWiseView");
const classAverageView = document.getElementById("classAverageView");
const subjectPerClassAverageView = document.getElementById("subjectPerClassAverageView");
const specificAverageView = document.getElementById("specificAverageView");
const studentReportView = document.getElementById("studentReportView");
const termComparisonChart = document.getElementById("termComparisonChart");
const chartSummary = document.getElementById("chartSummary");
const SCHOOL_NAME = "Adharsh Vidhyalaya Matric Hr Sec School";

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
  if (t === "first term" || t === "first mid term") return "First Term";
  if (t === "second term" || t === "second mid term") return "Second Term";
  if (t === "third term") return "Third Term";
  return "First Term";
}

function loadRecords() {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    if (!Array.isArray(data)) return [];

    let changed = false;
    const mapped = data
      .map((r, index) => {
        const normalizedId = String(r.id || "").trim() || makeRecordId(index);
        if (!r.id) changed = true;
        return {
          id: normalizedId,
        studentName: String(r.studentName || "").trim(),
        className: String(r.className || "").trim(),
        subjectName: String(r.subjectName || "").trim(),
        termName: normalizeTerm(r.termName),
        marks: Number(r.marks),
        };
      })
      .filter((r) => r.id && r.studentName && r.className && r.subjectName && Number.isFinite(r.marks));

    if (changed) saveRecords(mapped);
    return mapped;
  } catch {
    return [];
  }
}

function saveRecords(records) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
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

function applyGlobalFilters(records) {
  return records.filter((r) => {
    const classOk = classFilter.value === "all" || r.className === classFilter.value;
    const subjectOk = subjectFilter.value === "all" || r.subjectName === subjectFilter.value;
    return classOk && subjectOk;
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
  const groups = groupBy(records, "className");
  const keys = Object.keys(groups).sort();
  if (!keys.length) {
    classWiseView.innerHTML = '<p class="empty">No class-wise records to show.</p>';
    return;
  }

  classWiseView.innerHTML = keys
    .map((key) => {
      const rows = groups[key];
      const rowsHtml = createTable(
        ["Student", "Subject", "Term", "Marks", "Action"],
        rows.map((r) => [
          r.studentName,
          r.subjectName,
          r.termName,
          r.marks,
          `<button class="btn btn--danger record-delete" data-id="${r.id}" type="button">Delete</button>`,
        ])
      );
      const average = avg(rows);
      return createGroup(`${key} (${rows.length}) | Avg: ${average === null ? "N/A" : `${average.toFixed(2)}%`}`, rowsHtml);
    })
    .join("");
}

function renderSubjectRecords(records) {
  const groups = groupBy(records, "subjectName");
  const keys = Object.keys(groups).sort();
  if (!keys.length) {
    subjectWiseView.innerHTML = '<p class="empty">No subject-wise records to show.</p>';
    return;
  }

  subjectWiseView.innerHTML = keys
    .map((key) => {
      const rows = groups[key];
      const rowsHtml = createTable(
        ["Student", "Class", "Term", "Marks", "Action"],
        rows.map((r) => [
          r.studentName,
          r.className,
          r.termName,
          r.marks,
          `<button class="btn btn--danger record-delete" data-id="${r.id}" type="button">Delete</button>`,
        ])
      );
      const average = avg(rows);
      return createGroup(`${key} (${rows.length}) | Avg: ${average === null ? "N/A" : `${average.toFixed(2)}%`}`, rowsHtml);
    })
    .join("");
}

function renderClassAverage(records) {
  const groups = groupBy(records, "className");
  const keys = Object.keys(groups).sort();
  const rows = keys.map((k) => [k, `${avg(groups[k]).toFixed(2)}%`, groups[k].length]);
  classAverageView.innerHTML = createGroup("Average Percentage by Class", createTable(["Class", "Average", "Records"], rows));
}

function renderSubjectPerClassAverage(records) {
  const bucket = {};
  records.forEach((r) => {
    const key = `${r.className}__${r.subjectName}`;
    if (!bucket[key]) bucket[key] = { className: r.className, subjectName: r.subjectName, marks: [] };
    bucket[key].marks.push(r.marks);
  });
  const rows = Object.values(bucket)
    .sort((a, b) => (a.className === b.className ? a.subjectName.localeCompare(b.subjectName) : a.className.localeCompare(b.className)))
    .map((b) => {
      const average = b.marks.reduce((s, m) => s + m, 0) / b.marks.length;
      return [b.className, b.subjectName, `${average.toFixed(2)}%`, b.marks.length];
    });

  subjectPerClassAverageView.innerHTML = createGroup(
    "Subject Average per Class",
    createTable(["Class", "Subject", "Average", "Records"], rows)
  );
}

function renderSpecificAverage(records) {
  const selectedClass = specificClassFilter.value;
  const selectedSubject = specificSubjectFilter.value;
  if (!selectedClass || !selectedSubject) {
    specificAverageView.innerHTML = '<p class="empty">Select a class and subject to view the particular average.</p>';
    return;
  }

  const subset = records.filter((r) => r.className === selectedClass && r.subjectName === selectedSubject);
  if (!subset.length) {
    specificAverageView.innerHTML = '<p class="empty">No records available for this class and subject.</p>';
    return;
  }

  const overall = avg(subset);
  const termGroups = groupBy(subset, "termName");
  const termRows = ["First Term", "Second Term", "Third Term"].map((term) => {
    const rows = termGroups[term] || [];
    const value = rows.length ? `${avg(rows).toFixed(2)}%` : "N/A";
    return [term, value, rows.length];
  });

  specificAverageView.innerHTML = `
    <section class="metric">
      <p class="metric__label">${selectedClass} - ${selectedSubject}</p>
      <p class="metric__value">${overall.toFixed(2)}%</p>
    </section>
    ${createGroup("Term-wise Breakdown", createTable(["Term", "Average", "Records"], termRows))}
  `;
}

function renderStudentReport(records) {
  const selectedStudent = studentFilter.value;
  const studentOnly = selectedStudent ? records.filter((r) => r.studentName === selectedStudent) : [];
  fillRequiredFilter(studentTermFilter, uniqueValues(studentOnly, "termName"), "Select term");
  const selectedTerm = studentTermFilter.value;

  if (!selectedStudent) {
    studentReportView.innerHTML = '<p class="empty">Select a student to view the full report.</p>';
    return;
  }

  const studentRecords = records.filter((r) => r.studentName === selectedStudent);
  if (!studentRecords.length) {
    studentReportView.innerHTML = '<p class="empty">No records available for this student.</p>';
    return;
  }

  if (!selectedTerm) {
    studentReportView.innerHTML = '<p class="empty">Select a term to view marksheet and download report.</p>';
    return;
  }

  const termRecords = getStudentTermRows(records, selectedStudent, selectedTerm);
  if (!termRecords.length) {
    studentReportView.innerHTML = '<p class="empty">No records for selected student and term.</p>';
    return;
  }

  const overall = avg(termRecords);
  const academicYear = String(academicYearInput?.value || "").trim() || "2026-2027";

  const marksheetRows = termRecords
    .slice()
    .sort((a, b) => a.subjectName.localeCompare(b.subjectName))
    .map((r) => [r.subjectName, r.marks, gradeFromMarks(r.marks)]);

  const tableHtml = createTable(["Subject", "Marks", "Grade"], marksheetRows);

  studentReportView.innerHTML = `
    <section class="marksheet">
      <div class="marksheet__head">
        <div>
          <p class="marksheet__title">${SCHOOL_NAME}</p>
          <p class="marksheet__meta">Academic Year: ${academicYear}</p>
          <p class="marksheet__meta">Term: ${selectedTerm}</p>
          <p class="marksheet__meta">Student: ${selectedStudent}</p>
          <p class="marksheet__meta">Class: ${termRecords[0].className}</p>
        </div>
      </div>
      ${tableHtml}
      <p class="marksheet__avg">Average: ${overall.toFixed(2)}%</p>
    </section>
  `;
}

function drawTermChart(records) {
  if (!termComparisonChart) return;
  const ctx = termComparisonChart.getContext("2d");
  if (!ctx) return;

  const chartRecords = records.filter((r) => {
    const classOk = chartClassFilter.value === "all" || r.className === chartClassFilter.value;
    const subjectOk = chartSubjectFilter.value === "all" || r.subjectName === chartSubjectFilter.value;
    return classOk && subjectOk;
  });

  const terms = ["First Term", "Second Term", "Third Term"];
  const values = terms.map((term) => {
    const rows = chartRecords.filter((r) => r.termName === term);
    return rows.length ? avg(rows) : null;
  });

  const dpr = window.devicePixelRatio || 1;
  const w = termComparisonChart.clientWidth || 900;
  const h = 320;
  termComparisonChart.width = Math.floor(w * dpr);
  termComparisonChart.height = Math.floor(h * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);

  const left = 56;
  const right = w - 24;
  const top = 20;
  const bottom = h - 44;
  const chartH = bottom - top;

  ctx.strokeStyle = "#dbe2ee";
  for (let i = 0; i <= 5; i += 1) {
    const y = top + (chartH / 5) * i;
    ctx.beginPath();
    ctx.moveTo(left, y);
    ctx.lineTo(right, y);
    ctx.stroke();
  }

  ctx.fillStyle = "#637389";
  ctx.font = "12px Kadwa";
  ctx.textAlign = "right";
  for (let i = 0; i <= 5; i += 1) {
    const y = top + (chartH / 5) * i + 4;
    ctx.fillText(String(100 - i * 20), left - 8, y);
  }

  const barW = 90;
  const gap = 45;
  const center = left + (right - left) / 2;
  const xs = [center - barW - gap - barW / 2, center - barW / 2, center + barW / 2 + gap];
  const colors = ["#2ea5c8", "#2563eb", "#1e40af"];

  ctx.textAlign = "center";
  terms.forEach((term, i) => {
    const value = values[i];
    const numeric = value ?? 0;
    const barH = (Math.max(0, Math.min(100, numeric)) / 100) * chartH;
    const y = bottom - barH;
    ctx.fillStyle = colors[i];
    ctx.fillRect(xs[i], y, barW, barH);
    ctx.fillStyle = "#1e2f45";
    ctx.fillText(term, xs[i] + barW / 2, bottom + 18);
    ctx.fillText(value === null ? "N/A" : `${numeric.toFixed(2)}%`, xs[i] + barW / 2, y - 6);
  });

  if (!chartSummary) return;
  const [f, s, t] = values;
  if (f === null && s === null && t === null) {
    chartSummary.textContent = "No term data available for this selection.";
    return;
  }
  chartSummary.textContent = `First: ${f === null ? "N/A" : `${f.toFixed(2)}%`}, Second: ${
    s === null ? "N/A" : `${s.toFixed(2)}%`
  }, Third: ${t === null ? "N/A" : `${t.toFixed(2)}%`}.`;
}

function setActiveView() {
  const selected = viewMode.value;
  document.querySelectorAll(".view-pane").forEach((pane) => {
    pane.classList.toggle("is-active", pane.getAttribute("data-view") === selected);
  });
}

function renderAll() {
  const allRecords = loadRecords();

  fillFilter(classFilter, uniqueValues(allRecords, "className"), "All Classes");
  fillFilter(subjectFilter, uniqueValues(allRecords, "subjectName"), "All Subjects");
  fillRequiredFilter(specificClassFilter, uniqueValues(allRecords, "className"), "Select class");
  fillRequiredFilter(specificSubjectFilter, uniqueValues(allRecords, "subjectName"), "Select subject");
  fillRequiredFilter(studentFilter, uniqueValues(allRecords, "studentName"), "Select student");
  fillFilter(chartClassFilter, uniqueValues(allRecords, "className"), "All Classes");
  fillFilter(chartSubjectFilter, uniqueValues(allRecords, "subjectName"), "All Subjects");

  const filtered = applyGlobalFilters(allRecords);
  renderClassRecords(filtered);
  renderSubjectRecords(filtered);
  renderClassAverage(filtered);
  renderSubjectPerClassAverage(filtered);
  renderSpecificAverage(allRecords);
  renderStudentReport(allRecords);
  drawTermChart(allRecords);
  setActiveView();
}

function deleteRecordById(recordId) {
  const current = loadRecords();
  const next = current.filter((r) => r.id !== recordId);
  saveRecords(next);
  renderAll();
}

if (toggleCreateBtn && createPanel) {
  toggleCreateBtn.addEventListener("click", () => {
    createPanel.classList.toggle("is-hidden");
  });
}

if (recordForm) {
  recordForm.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!recordForm.checkValidity()) {
      recordForm.reportValidity();
      return;
    }

    const formData = new FormData(recordForm);
    const record = {
      id: makeRecordId(),
      studentName: String(formData.get("studentName") || "").trim(),
      className: String(formData.get("className") || "").trim(),
      subjectName: String(formData.get("subjectName") || "").trim(),
      termName: normalizeTerm(formData.get("termName")),
      marks: Number(formData.get("marks")),
    };

    const records = loadRecords();
    records.push(record);
    saveRecords(records);
    recordForm.reset();
    renderAll();
  });
}

[viewMode, classFilter, subjectFilter, specificClassFilter, specificSubjectFilter, studentFilter, chartClassFilter, chartSubjectFilter].forEach(
  (el) => {
    if (el) el.addEventListener("change", renderAll);
  }
);

if (studentTermFilter) {
  studentTermFilter.addEventListener("change", renderAll);
}

if (downloadStudentReportBtn) {
  downloadStudentReportBtn.addEventListener("click", () => {
    const records = loadRecords();
    const studentName = studentFilter.value;
    const termName = studentTermFilter.value;

    if (!studentName || !termName) return;

    const rows = getStudentTermRows(records, studentName, termName)
      .slice()
      .sort((a, b) => a.subjectName.localeCompare(b.subjectName));

    if (!rows.length) return;
    const schoolName = SCHOOL_NAME;
    const academicYear = String(academicYearInput?.value || "").trim() || "2026-2027";
    const averageText = avg(rows).toFixed(2);
    const rowsHtml = rows
      .map((r) => `<tr><td>${escapeHtml(r.subjectName)}</td><td>${escapeHtml(r.marks)}</td><td>${escapeHtml(gradeFromMarks(r.marks))}</td></tr>`)
      .join("");
    const html = `<!doctype html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>${escapeHtml(studentName)} ${escapeHtml(termName)} Marksheet</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; color: #111; }
    .head { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; }
    h1 { margin: 0; font-size: 22px; }
    p { margin: 4px 0; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
    th, td { border: 1px solid #999; padding: 8px; text-align: left; }
    th { background: #f3f6fb; }
    .avg { margin-top: 10px; font-weight: 700; }
  </style>
</head>
<body>
  <div class="head">
    <div>
      <h1>${escapeHtml(schoolName)}</h1>
      <p>Academic Year: ${escapeHtml(academicYear)}</p>
      <p>Term: ${escapeHtml(termName)}</p>
      <p>Student: ${escapeHtml(studentName)}</p>
      <p>Class: ${escapeHtml(rows[0].className)}</p>
    </div>
  </div>
  <table>
    <thead>
      <tr><th>Subject</th><th>Marks</th><th>Grade</th></tr>
    </thead>
    <tbody>
      ${rowsHtml}
    </tbody>
  </table>
  <p class="avg">Average: ${escapeHtml(averageText)}%</p>
</body>
</html>`;

    const blob = new Blob([html], { type: "text/html;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const safeStudent = studentName.replace(/[^a-z0-9]+/gi, "_");
    const safeTerm = termName.replace(/[^a-z0-9]+/gi, "_");
    link.href = url;
    link.download = `${safeStudent}_${safeTerm}_marksheet.html`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  });
}

if (academicYearInput) {
  academicYearInput.addEventListener("input", renderAll);
}

if (downloadStudentReportPdfBtn) {
  downloadStudentReportPdfBtn.addEventListener("click", () => {
    const records = loadRecords();
    const studentName = studentFilter.value;
    const termName = studentTermFilter.value;

    if (!studentName || !termName) return;

    const rows = getStudentTermRows(records, studentName, termName)
      .slice()
      .sort((a, b) => a.subjectName.localeCompare(b.subjectName));
    if (!rows.length) return;

    const academicYear = String(academicYearInput?.value || "").trim() || "2026-2027";
    const averageText = avg(rows).toFixed(2);
    const rowsHtml = rows
      .map((r) => `<tr><td>${escapeHtml(r.subjectName)}</td><td>${escapeHtml(r.marks)}</td><td>${escapeHtml(gradeFromMarks(r.marks))}</td></tr>`)
      .join("");

    const printableHtml = `<!doctype html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>${escapeHtml(studentName)} ${escapeHtml(termName)} Marksheet</title>
  <style>
    body { font-family: "Times New Roman", serif; margin: 28px; color: #000; }
    .sheet { border: 2px solid #000; padding: 14px; }
    h1 { margin: 0; text-align: center; font-size: 24px; letter-spacing: 0.2px; }
    .subhead { text-align: center; margin: 6px 0 14px; font-size: 14px; }
    .meta { width: 100%; margin-bottom: 12px; border-collapse: collapse; }
    .meta td { border: 1px solid #000; padding: 6px 8px; font-size: 14px; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
    th, td { border: 1px solid #000; padding: 8px; font-size: 14px; text-align: left; }
    th { background: #efefef; }
    .avg { margin-top: 10px; font-weight: 700; font-size: 15px; }
  </style>
</head>
<body>
  <div class="sheet">
    <h1>${escapeHtml(SCHOOL_NAME)}</h1>
    <div class="subhead">Statement of Marks</div>
    <table class="meta">
      <tr><td><strong>Academic Year</strong>: ${escapeHtml(academicYear)}</td><td><strong>Term</strong>: ${escapeHtml(termName)}</td></tr>
      <tr><td><strong>Student Name</strong>: ${escapeHtml(studentName)}</td><td><strong>Class</strong>: ${escapeHtml(rows[0].className)}</td></tr>
    </table>
    <table>
      <thead>
        <tr><th>Subject</th><th>Marks</th><th>Grade</th></tr>
      </thead>
      <tbody>
        ${rowsHtml}
      </tbody>
    </table>
    <p class="avg">Average: ${escapeHtml(averageText)}%</p>
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
  const btn = target.closest(".record-delete");
  if (!btn) return;
  const recordId = btn.getAttribute("data-id");
  if (!recordId) return;
  deleteRecordById(recordId);
});

window.addEventListener("resize", renderAll);

if (academicYearInput && !academicYearInput.value) {
  const year = new Date().getFullYear();
  academicYearInput.value = `${year}-${year + 1}`;
}

renderAll();
