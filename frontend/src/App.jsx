
import { useEffect, useMemo, useRef, useState } from "react";
import "./index.css";
let chartPromise;
const loadChart = () => {
  if (!chartPromise) {
    chartPromise = import("chart.js/auto");
  }
  return chartPromise;
};

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";
const TOKEN_KEY = "academic_auth_token";
const USER_KEY = "academic_auth_user";
const SCHOOL_NAME = "Adharsh Vidhyalaya Matric Hr Sec School";
const SUBJECT_OPTIONS = ["Tamil", "English", "Mathematics", "Physics", "Chemistry", "Biology"];
const BIOLOGY_SUBJECT = "Biology";
const CLASS_OPTIONS = [
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

function parseClassSelection(value) {
  const input = String(value || "").trim();
  const match = input.match(/^Class\s+(\d+)([A-C])$/i);
  if (!match) {
    return { className: input, section: "" };
  }
  return {
    className: `Class ${match[1]}${match[2].toUpperCase()}`,
    section: match[2].toUpperCase(),
  };
}

function normalizeTerm(term) {
  const value = String(term || "").trim().toLowerCase();
  if (value === "term 1" || value === "term i") return "Term 1";
  if (value === "term 2" || value === "term ii") return "Term 2";
  if (value === "term 3" || value === "term iii") return "Term 3";
  if (value === "first term" || value === "first mid term") return "Term 1";
  if (value === "second term" || value === "second mid term") return "Term 2";
  if (value === "third term") return "Term 3";
  return term || "";
}

function normalizeSubject(subject) {
  return String(subject || "").trim().toLowerCase();
}

function buildRegisterDirectory(records) {
  const directory = new Map();
  records.forEach((record) => {
    const registerNumber = String(record?.registerNumber || "").trim();
    if (!registerNumber) return;
    if (!directory.has(registerNumber)) {
      directory.set(registerNumber, {
        name: String(record?.studentName || "").trim(),
        className: String(record?.className || "").trim(),
        section: String(record?.section || "").trim(),
      });
    }
  });
  return directory;
}

function mergeStudentRosterIntoDirectory(directory, students) {
  const nextDirectory = new Map(directory);
  students.forEach((student) => {
    const registerNumber = String(student?.registerNumber || "").trim();
    if (!registerNumber) return;

    const existing = nextDirectory.get(registerNumber) || {};
    nextDirectory.set(registerNumber, {
      name: existing.name || String(student?.studentName || "").trim(),
      className: existing.className || String(student?.className || "").trim(),
      section: existing.section || String(student?.section || "").trim(),
    });
  });
  return nextDirectory;
}

function formatRegisterOption(registerNumber, directory) {
  const entry = directory.get(registerNumber);
  if (entry?.name) {
    return `${registerNumber} - ${entry.name}`;
  }
  return registerNumber;
}

function nameWithoutInitials(name) {
  const cleaned = String(name || "").trim();
  if (!cleaned) return "";
  const parts = cleaned.split(/\s+/);
  if (!parts.length) return cleaned;
  const first = parts[0].replace(/\./g, "").toLowerCase();
  const rest = parts.slice(1).join(" ").trim();
  if (first.length === 1 && rest) {
    return rest;
  }
  return cleaned;
}

function normalizeClassToken(value) {
  return String(value || "").replace(/\s+/g, "").trim().toUpperCase();
}

function matchesClassAssignment(item, classTeacherFor) {
  const assignedClass = normalizeClassToken(classTeacherFor);
  if (!assignedClass) return false;

  const itemClass = normalizeClassToken(item?.className);
  const itemSection = normalizeClassToken(item?.section);
  if (!itemClass) return false;

  if (itemClass === assignedClass) return true;
  if (itemSection && `${itemClass}${itemSection}` === assignedClass) return true;
  return false;
}

function average(rows) {
  if (!rows.length) return null;
  return rows.reduce((sum, row) => sum + Number(row.marks || 0), 0) / rows.length;
}

function gradeFromMarks(marks) {
  if (marks >= 90) return "A+";
  if (marks >= 80) return "A";
  if (marks >= 70) return "B+";
  if (marks >= 60) return "B";
  if (marks >= 35) return "C";
  return "R (Arrear)";
}

function useChart(canvasRef, config, onError) {
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let chartInstance = null;
    let mounted = true;
    loadChart()
      .then((mod) => {
        if (!mounted) return;
        const Chart = mod.default;
        chartInstance = new Chart(canvas, config);
      })
      .catch(() => {
        if (onError) onError("Charts unavailable. Install dependencies and refresh.");
      });
    return () => {
      mounted = false;
      if (chartInstance) chartInstance.destroy();
    };
  }, [canvasRef, config]);
}

function App() {
  const [mode, setMode] = useState("staffLogin");
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY) || "");
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  });
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const storedToken = localStorage.getItem(TOKEN_KEY) || "";
    if (storedToken === "undefined" || storedToken === "null") {
      localStorage.removeItem(TOKEN_KEY);
    } else if (storedToken && storedToken !== token) {
      setToken(storedToken);
    }
    const raw = localStorage.getItem(USER_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (!user || String(user.id || "") !== String(parsed.id || "")) {
          setUser(parsed);
        }
      } catch {
        // ignore
      }
    }
  }, [token, user]);

  const onAuthSuccess = (nextToken, nextUser) => {
    const safeToken = String(nextToken || "").trim();
    if (!safeToken || safeToken === "undefined" || safeToken === "null") {
      setNotice("Login failed: missing token. Please try again.");
      return;
    }
    localStorage.setItem(TOKEN_KEY, safeToken);
    localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
    setToken(safeToken);
    setUser(nextUser);
    setNotice("");
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken("");
    setUser(null);
    setMode("staffLogin");
    setNotice("Logged out");
  };

  return (
    <div className="min-h-screen bg-brand-50">
      {!token ? (
        <AuthPanel
          mode={mode}
          setMode={setMode}
          setNotice={setNotice}
          onAuthSuccess={onAuthSuccess}
          notice={notice}
        />
      ) : (
        <Dashboard token={token} user={user} onLogout={logout} setNotice={setNotice} notice={notice} />
      )}
    </div>
  );
}

function AuthPanel({ mode, setMode, setNotice, onAuthSuccess, notice }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const isAdminLogin = mode === "adminLogin";
  const isStaffLogin = mode === "staffLogin";

  const handleSubmit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setNotice("");

    try {
      const response = await apiRequest("/auth/login", "POST", {
        email: email.trim().toLowerCase(),
        password,
      });
      if (!response.ok) {
        setNotice(response.data.message || "Authentication failed");
        return;
      }
      if (isAdminLogin && response.data.data.role !== "admin") {
        setNotice("This account is not an admin.");
        return;
      }
      if (isStaffLogin && response.data.data.role !== "staff") {
        setNotice("Use Admin Login for admin accounts.");
        return;
      }
      if (!response.data?.data?.token) {
        setNotice("Login failed: token missing in response.");
        return;
      }

      onAuthSuccess(response.data.data.token, {
        id: response.data.data.id,
        name: response.data.data.name,
        email: response.data.data.email,
        role: response.data.data.role,
        subject: response.data.data.subject || "",
        classTeacherFor: response.data.data.classTeacherFor || "",
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen grid place-items-center px-6">
      <div className="card w-full max-w-lg">
        <div className="card-header">
          <div>
            <h1 className="text-xl font-semibold text-brand-900">Academic Report Generator</h1>
            <p className="text-sm text-brand-700">Modern admin dashboard login</p>
          </div>
        </div>
        <div className="card-body space-y-4">
          <div className="flex gap-2">
            <button
              type="button"
              className={`btn-outline ${isStaffLogin ? "bg-brand-600 text-white" : ""}`}
              onClick={() => setMode("staffLogin")}
            >
              Staff Login
            </button>
            <button
              type="button"
              className={`btn-outline ${isAdminLogin ? "bg-brand-600 text-white" : ""}`}
              onClick={() => setMode("adminLogin")}
            >
              Admin Login
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block">
              <span className="text-sm font-medium text-brand-800">Email</span>
              <input
                className="input mt-2"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-brand-800">Password</span>
              <input
                className="input mt-2"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </label>
            <button type="submit" className="btn-primary w-full" disabled={busy}>
              {busy ? "Signing in..." : isAdminLogin ? "Admin Login" : "Staff Login"}
            </button>
          </form>

          {notice ? <div className="pill text-center text-brand-700">{notice}</div> : null}
        </div>
      </div>
    </div>
  );
}

function Dashboard({ token, user, onLogout, setNotice, notice }) {
  const isAdmin = user?.role === "admin";
  const isStaff = user?.role === "staff";
  const staffSubject = user?.subject || "";
  const classTeacherFor = user?.classTeacherFor || "";
  const isBiologyStaff =
    isStaff && normalizeSubject(staffSubject) === normalizeSubject(BIOLOGY_SUBJECT);
  const canReadStudents = isAdmin || isStaff;

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activePage, setActivePage] = useState("dashboard");
  const [records, setRecords] = useState([]);
  const [classTeacherRecords, setClassTeacherRecords] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [staffLoading, setStaffLoading] = useState(false);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [classLoading, setClassLoading] = useState(false);
  const [lastSaveStatus, setLastSaveStatus] = useState("");
  const [studentSaveStatus, setStudentSaveStatus] = useState("");
  const [chartError, setChartError] = useState("");

  const [filters, setFilters] = useState({
    className: "all",
    subject: "all",
    term: "",
    registerNumber: "all",
  });
  const [searchQuery, setSearchQuery] = useState("");

  const [recordForm, setRecordForm] = useState({
    studentName: "",
    registerNumber: "",
    className: "",
    section: "",
    subject: "",
    marks: "",
    term: "",
  });
  const [editingRecordId, setEditingRecordId] = useState("");
  const [selectedStudentName, setSelectedStudentName] = useState("");
  const [selectedStudent, setSelectedStudent] = useState("");
  const [selectedStudentTerm, setSelectedStudentTerm] = useState("");
  const [studentNameSearch, setStudentNameSearch] = useState("");
  const [reportStudent, setReportStudent] = useState("");
  const [reportStudentClass, setReportStudentClass] = useState("all");
  const [reportStudentTerm, setReportStudentTerm] = useState("");

  const [staffForm, setStaffForm] = useState({
    name: "",
    email: "",
    password: "",
    subject: "",
    classTeacherFor: "",
  });
  const [staffModalOpen, setStaffModalOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const [studentForm, setStudentForm] = useState({
    studentName: "",
    parentName: "",
    dateOfBirth: "",
    place: "",
    parentPhone: "",
    className: "",
  });
  const [studentFormOpen, setStudentFormOpen] = useState(false);

  const [staffSort, setStaffSort] = useState({ key: "name", direction: "asc" });
  const [staffPage, setStaffPage] = useState(1);
  const staffPageSize = 6;
  const isEditingRecord = Boolean(editingRecordId);
  const [adminRankClass, setAdminRankClass] = useState("all");
  const [subjectAvgClass, setSubjectAvgClass] = useState("all");
  const [analyticsSubjectClass, setAnalyticsSubjectClass] = useState("Class 12");

  const normalizedRecords = useMemo(
    () => records.map((record) => ({ ...record, term: normalizeTerm(record.term) })),
    [records]
  );

  const normalizedClassTeacherRecords = useMemo(
    () => classTeacherRecords.map((record) => ({ ...record, term: normalizeTerm(record.term) })),
    [classTeacherRecords]
  );

  const reportRecords = useMemo(() => {
    if (isBiologyStaff) {
      return normalizedRecords
        .filter((record) => normalizeSubject(record.subject) === normalizeSubject(BIOLOGY_SUBJECT))
        .map((record) => ({ ...record, term: normalizeTerm(record.term) }));
    }
    if (isStaff && classTeacherFor) {
      return normalizedClassTeacherRecords;
    }
    if (isStaff && staffSubject) {
      return normalizedRecords
        .filter((record) => record.subject === staffSubject)
        .map((record) => ({ ...record, term: normalizeTerm(record.term) }));
    }
    return normalizedRecords;
  }, [isBiologyStaff, isStaff, staffSubject, classTeacherFor, normalizedRecords, normalizedClassTeacherRecords]);

  const studentSectionRecords = useMemo(() => {
    if (isStaff && classTeacherFor) {
      return normalizedClassTeacherRecords;
    }
    return reportRecords;
  }, [isStaff, classTeacherFor, normalizedClassTeacherRecords, reportRecords]);

  const accessibleStudents = useMemo(() => {
    if (!students.length) return [];
    if (isStaff && classTeacherFor) {
      return students.filter((student) => matchesClassAssignment(student, classTeacherFor));
    }
    return students;
  }, [students, isStaff, classTeacherFor]);

  const studentDirectorySource = useMemo(
    () => (accessibleStudents.length ? accessibleStudents : studentSectionRecords),
    [accessibleStudents, studentSectionRecords]
  );
  const studentNameOptions = useMemo(
    () => [...new Set(studentDirectorySource.map((r) => r.studentName).filter(Boolean))].sort(),
    [studentDirectorySource]
  );
  const filteredStudentNameOptions = useMemo(() => {
    const query = studentNameSearch.trim().toLowerCase();
    if (!query) return studentNameOptions;
    return studentNameOptions.filter((name) => {
      const raw = String(name || "").toLowerCase();
      const withoutInitial = nameWithoutInitials(name).toLowerCase();
      return raw.includes(query) || withoutInitial.includes(query);
    });
  }, [studentNameOptions, studentNameSearch]);
  const registerOptionsByStudentName = useMemo(() => {
    if (!selectedStudentName) return [];
    const filtered = studentDirectorySource.filter((r) => r.studentName === selectedStudentName);
    return [...new Set(filtered.map((r) => r.registerNumber).filter(Boolean))].sort();
  }, [studentDirectorySource, selectedStudentName]);

  const reportRegisterDirectory = useMemo(
    () => buildRegisterDirectory(reportRecords),
    [reportRecords]
  );
  const reportRegisterOptions = useMemo(
    () => Array.from(reportRegisterDirectory.keys()).sort(),
    [reportRegisterDirectory]
  );
  const studentOptions = reportRegisterOptions;


  const selectedStudentRecords = useMemo(
    () =>
      studentSectionRecords
        .filter((r) => (selectedStudent ? r.registerNumber === selectedStudent : false))
        .sort((a, b) => a.subject.localeCompare(b.subject) || a.term.localeCompare(b.term)),
    [studentSectionRecords, selectedStudent]
  );

  const selectedStudentTerms = useMemo(
    () =>
      [...new Set(selectedStudentRecords.map((r) => r.term).filter(Boolean))].sort((a, b) =>
        a.localeCompare(b)
      ),
    [selectedStudentRecords]
  );

  const { registerOptionsByClass, registerDirectoryByClass } = useMemo(() => {
    const className = recordForm.className || (filters.className !== "all" ? filters.className : "");
    const base = normalizedRecords;
    const filtered = className ? base.filter((r) => r.className === className) : base;
    const rosterBase = students.length ? students : normalizedRecords;
    const roster = className
      ? rosterBase.filter((student) => String(student?.className || "").trim() === className)
      : rosterBase;
    const directory = mergeStudentRosterIntoDirectory(buildRegisterDirectory(filtered), roster);
    return {
      registerOptionsByClass: Array.from(directory.keys()).sort(),
      registerDirectoryByClass: directory,
    };
  }, [normalizedRecords, students, recordForm.className, filters.className]);

  const { registerOptionsForFilter, registerDirectoryForFilter } = useMemo(() => {
    const className = filters.className !== "all" ? filters.className : "";
    const filtered = className ? reportRecords.filter((r) => r.className === className) : reportRecords;
    const directory = buildRegisterDirectory(filtered);
    return {
      registerOptionsForFilter: Array.from(directory.keys()).sort(),
      registerDirectoryForFilter: directory,
    };
  }, [reportRecords, filters.className]);

  const totalStudents = useMemo(() => {
    if (students.length) {
      return students.length;
    }

    const fallbackRecords = normalizedRecords;
    return new Set(fallbackRecords.map((r) => r.registerNumber).filter(Boolean)).size;
  }, [students, normalizedRecords]);

  const totalStaff = staffList.length;
  const totalSubjects = SUBJECT_OPTIONS.length;
  const totalClasses = new Set(reportRecords.map((r) => r.className)).size;

  const filteredRecords = useMemo(() => {
    return normalizedRecords
      .filter((r) => {
      const classOk = filters.className === "all" || r.className === filters.className;
      const subjectOk = filters.subject === "all" || r.subject === filters.subject;
      const termOk = !filters.term || r.term === filters.term;
      const registerOk =
        filters.registerNumber === "all" ||
        !filters.registerNumber ||
        r.registerNumber === filters.registerNumber;
      return classOk && subjectOk && termOk && registerOk;
      })
      .sort((a, b) => {
        const aTime = new Date(a.createdAt || 0).getTime();
        const bTime = new Date(b.createdAt || 0).getTime();
        return bTime - aTime;
      });
  }, [normalizedRecords, filters]);

  const classPerformance = useMemo(() => {
    const groups = {};
    const groupKey = isStaff && classTeacherFor ? "subject" : "className";
    reportRecords.forEach((r) => {
      const key = String(r[groupKey] || "").trim();
      if (!key) return;
      if (!groups[key]) groups[key] = [];
      groups[key].push(r);
    });
    const labels = isStaff && classTeacherFor
      ? [
          ...SUBJECT_OPTIONS.filter((label) => groups[label]?.length),
          ...Object.keys(groups).filter((label) => !SUBJECT_OPTIONS.includes(label)).sort(),
        ]
      : CLASS_OPTIONS.filter((label) => groups[label]?.length);
    const values = labels.map((label) => average(groups[label] || []) || 0);
    return { labels, values };
  }, [reportRecords, isStaff, classTeacherFor]);

  const subjectAverage = useMemo(() => {
    const base =
      subjectAvgClass !== "all"
        ? reportRecords.filter((r) => r.className === subjectAvgClass)
        : reportRecords;
    const groups = {};
    base.forEach((r) => {
      if (!groups[r.subject]) groups[r.subject] = [];
      groups[r.subject].push(r);
    });
    const labels = Object.keys(groups).sort();
    const values = labels.map((label) => average(groups[label]) || 0);
    return { labels, values };
  }, [reportRecords, subjectAvgClass]);

  const subjectAvgClassOptions = useMemo(() => {
    const found = Array.from(
      new Set(reportRecords.map((r) => String(r.className || "").trim()).filter(Boolean))
    );
    const ordered = CLASS_OPTIONS.filter((label) => found.includes(label));
    const extras = found.filter((label) => !ordered.includes(label)).sort();
    return ["all", ...ordered, ...extras];
  }, [reportRecords]);


  const passFail = useMemo(() => {
    const base =
      isStaff && classTeacherFor
        ? classTeacherRecords.map((record) => ({ ...record, term: normalizeTerm(record.term) }))
        : reportRecords;

    const byStudent = base.reduce((acc, row) => {
      if (!acc[row.studentName]) acc[row.studentName] = [];
      acc[row.studentName].push(Number(row.marks || 0));
      return acc;
    }, {});

    const summaries = Object.values(byStudent).map((marks) =>
      marks.length ? marks.every((m) => Number(m) >= 35) : false
    );

    const pass = summaries.filter(Boolean).length;
    const fail = summaries.length - pass;
    return { labels: ["Pass", "Fail"], values: [pass, fail] };
  }, [reportRecords, isStaff, classTeacherFor, classTeacherRecords]);

  const classReportRecords = useMemo(() => {
    return reportRecords;
  }, [reportRecords]);

  const biologyClassAverages = useMemo(() => {
    const groups = {};
    reportRecords
      .filter((r) => normalizeSubject(r.subject) === normalizeSubject(BIOLOGY_SUBJECT))
      .forEach((r) => {
        if (!groups[r.className]) groups[r.className] = [];
        groups[r.className].push(r);
      });
    const dynamicClasses = Object.keys(groups).filter(Boolean);
    const labels = Array.from(new Set([...CLASS_OPTIONS, ...dynamicClasses]));
    const values = labels.map((label) => average(groups[label] || []) || 0);
    const counts = labels.map((label) => (groups[label] || []).length);
    return { labels, values, counts };
  }, [reportRecords]);

  const classReportData = useMemo(() => {
    if (isBiologyStaff) {
      return biologyClassAverages;
    }
    return { labels: [], values: [] };
  }, [isBiologyStaff, biologyClassAverages]);

  const analyticsSubjectOptions = useMemo(() => {
    const found = Array.from(
      new Set(normalizedRecords.map((r) => String(r.className || "").trim()).filter(Boolean))
    );
    const ordered = CLASS_OPTIONS.filter((label) => found.includes(label));
    const extras = found.filter((label) => !ordered.includes(label)).sort();
    return [...ordered, ...extras];
  }, [normalizedRecords]);

  const class12SubjectReport = useMemo(() => {
    const targetClass = isAdmin
      ? analyticsSubjectClass
      : classTeacherFor || "Class 12";
    const base =
      isStaff && classTeacherFor === targetClass
        ? classTeacherRecords
        : normalizedRecords;
    const rows = base.filter((r) => r.className === targetClass);
    const teacherMap = staffList.reduce((acc, staff) => {
      if (!staff?.subject) return acc;
      if (!acc[staff.subject]) acc[staff.subject] = [];
      acc[staff.subject].push(staff.name || "Teacher");
      return acc;
    }, {});
    const labels = SUBJECT_OPTIONS.slice();
    const values = labels.map((subject) => {
      const subjectRows = rows.filter((r) => r.subject === subject);
      return subjectRows.length ? average(subjectRows) || 0 : 0;
    });
    const teachers = labels.map((subject) => {
      const names = teacherMap[subject] || [];
      return names.length ? names.join(", ") : "";
    });
    return { targetClass, labels, values, teachers, hasData: rows.length > 0 };
  }, [
    analyticsSubjectClass,
    normalizedRecords,
    staffList,
    isStaff,
    isAdmin,
    classTeacherFor,
    classTeacherRecords,
  ]);

  const reportStudentRecords = useMemo(() => {
    const base =
      reportStudentClass !== "all"
        ? reportRecords.filter((r) => r.className === reportStudentClass)
        : reportRecords;
    if (!reportStudent) return [];
    return base.filter((r) => r.registerNumber === reportStudent);
  }, [reportRecords, reportStudent, reportStudentClass]);

  const { reportStudentOptions, reportStudentDirectory } = useMemo(() => {
    const base =
      reportStudentClass !== "all"
        ? reportRecords.filter((r) => r.className === reportStudentClass)
        : reportRecords;
    const directory = buildRegisterDirectory(base);
    return {
      reportStudentOptions: Array.from(directory.keys()).sort(),
      reportStudentDirectory: directory,
    };
  }, [reportRecords, reportStudentClass]);

  const reportStudentTermOptions = useMemo(() => {
    return [...new Set(reportStudentRecords.map((r) => r.term).filter(Boolean))].sort();
  }, [reportStudentRecords]);

  const reportStudentSubjectMarks = useMemo(() => {
    if (!reportStudent || !reportStudentTerm) {
      return { labels: SUBJECT_OPTIONS, values: SUBJECT_OPTIONS.map(() => 0) };
    }
    const rows = reportStudentRecords.filter((r) => r.term === reportStudentTerm);
    const values = SUBJECT_OPTIONS.map((subject) => {
      const subjectRows = rows.filter((r) => r.subject === subject);
      return subjectRows.length ? average(subjectRows) || 0 : 0;
    });
    return { labels: SUBJECT_OPTIONS, values };
  }, [reportStudent, reportStudentTerm, reportStudentRecords]);

  const staffRows = useMemo(() => {
    const filtered = staffList.filter((staff) =>
      [staff.name, staff.email, staff.subject, staff.classTeacherFor]
        .join(" ")
        .toLowerCase()
        .includes(searchQuery.toLowerCase())
    );
    const sorted = filtered.sort((a, b) => {
      const aVal = String(a[staffSort.key] || "").toLowerCase();
      const bVal = String(b[staffSort.key] || "").toLowerCase();
      if (aVal === bVal) return 0;
      const direction = staffSort.direction === "asc" ? 1 : -1;
      return aVal > bVal ? direction : -direction;
    });
    return sorted;
  }, [staffList, searchQuery, staffSort]);

  const staffPageCount = Math.max(1, Math.ceil(staffRows.length / staffPageSize));
  const staffPageRows = staffRows.slice((staffPage - 1) * staffPageSize, staffPage * staffPageSize);

  const classTeacherSummary = useMemo(() => {
    if (!classTeacherRecords.length) {
      return { termRows: [], subjectRows: [], topRanks: [], specialCare: [] };
    }

    const terms = ["Term 1", "Term 2", "Term 3"];
    const termRows = terms.map((term) => {
      const rows = classTeacherRecords.filter((record) => record.term === term);
      return { term, avg: average(rows), count: rows.length };
    });

    const subjectGroups = classTeacherRecords.reduce((acc, row) => {
      const key = row.subject || "Unknown";
      if (!acc[key]) acc[key] = [];
      acc[key].push(row);
      return acc;
    }, {});

    const subjectRows = Object.entries(subjectGroups)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([subject, rows]) => ({ subject, avg: average(rows), count: rows.length }));

    const byStudent = classTeacherRecords.reduce((acc, row) => {
      if (!acc[row.studentName]) acc[row.studentName] = [];
      acc[row.studentName].push(Number(row.marks || 0));
      return acc;
    }, {});

    const studentAverages = Object.entries(byStudent).map(([name, marks]) => ({
      name,
      avg: marks.length ? marks.reduce((sum, m) => sum + m, 0) / marks.length : 0,
    }));

    const sortedAsc = studentAverages
      .slice()
      .sort((a, b) => a.avg - b.avg || a.name.localeCompare(b.name));
    const sortedDesc = studentAverages
      .slice()
      .sort((a, b) => b.avg - a.avg || a.name.localeCompare(b.name));

    const topRanks = sortedDesc.slice(0, 3);
    const specialCare = sortedAsc.slice(0, 3);

    return { termRows, subjectRows, topRanks, specialCare };
  }, [classTeacherRecords]);

  const adminSummaryByClass = useMemo(() => {
    if (!normalizedRecords.length) {
      return {};
    }

    const classes = Array.from(
      new Set(normalizedRecords.map((row) => String(row.className || "").trim()).filter(Boolean))
    ).sort();

    return classes.reduce((acc, className) => {
      const classRows = normalizedRecords.filter((row) => row.className === className);
      const byStudent = classRows.reduce((map, row) => {
        const name = String(row.studentName || "").trim();
        if (!name) return map;
        if (!map[name]) map[name] = [];
        map[name].push(Number(row.marks || 0));
        return map;
      }, {});

      const studentAverages = Object.entries(byStudent).map(([name, marks]) => ({
        name,
        avg: marks.length ? marks.reduce((sum, m) => sum + m, 0) / marks.length : 0,
      }));

      const sortedAsc = studentAverages
        .slice()
        .sort((a, b) => a.avg - b.avg || a.name.localeCompare(b.name));
      const sortedDesc = studentAverages
        .slice()
        .sort((a, b) => b.avg - a.avg || a.name.localeCompare(b.name));

      acc[className] = {
        topRanks: sortedDesc.slice(0, 3),
        specialCare: sortedAsc.slice(0, 3),
      };
      return acc;
    }, {});
  }, [normalizedRecords]);

  const adminClassList = useMemo(() => {
    const found = Object.keys(adminSummaryByClass);
    const ordered = CLASS_OPTIONS.filter((label) => found.includes(label));
    const extras = found.filter((label) => !ordered.includes(label)).sort();
    return [...ordered, ...extras];
  }, [adminSummaryByClass]);

  const adminRankClassOptions = useMemo(() => {
    return adminClassList.length ? ["all", ...adminClassList] : ["all"];
  }, [adminClassList]);

  const loadRecords = async () => {
    setLoading(true);
    const response = await apiRequest("/records", "GET", null, token);
    if (response.status === 401) {
      setNotice("Session expired. Please login again.");
      onLogout();
      return;
    }
    if (!response.ok) {
      setNotice(response.data.message || "Failed to load records");
      setLoading(false);
      return;
    }
    setRecords(Array.isArray(response.data.data) ? response.data.data : []);
    setLoading(false);
  };

  const loadClassTeacherRecords = async () => {
    if (!classTeacherFor) return;
    setClassLoading(true);
    const response = await apiRequest(`/records/class/${encodeURIComponent(classTeacherFor)}`, "GET", null, token);
    if (response.ok) {
      setClassTeacherRecords(Array.isArray(response.data.data) ? response.data.data : []);
    }
    setClassLoading(false);
  };

  const loadStaffList = async () => {
    if (!isAdmin) return;
    setStaffLoading(true);
    const response = await apiRequest("/users", "GET", null, token);
    if (response.ok) {
      setStaffList(Array.isArray(response.data.data) ? response.data.data : []);
    }
    setStaffLoading(false);
  };

  const loadStudents = async () => {
    if (!canReadStudents) return;
    setStudentsLoading(true);
    const response = await apiRequest("/students", "GET", null, token);
    if (response.ok) {
      setStudents(Array.isArray(response.data.data) ? response.data.data : []);
    }
    setStudentsLoading(false);
  };

  useEffect(() => {
    loadRecords();
    loadClassTeacherRecords();
    loadStaffList();
    loadStudents();
  }, []);

  useEffect(() => {
    if (isStaff && classTeacherFor) {
      setReportStudentClass(classTeacherFor);
    }
  }, [isStaff, classTeacherFor]);

  useEffect(() => {
    if (isEditingRecord) return;
    if (isStaff && staffSubject && !recordForm.subject) {
      setRecordForm((prev) => ({ ...prev, subject: staffSubject }));
    }
    if (filters.className !== "all" && !recordForm.className) {
      setRecordForm((prev) => ({ ...prev, className: filters.className }));
    }
    if (filters.term && !recordForm.term) {
      setRecordForm((prev) => ({ ...prev, term: filters.term }));
    }
    if (filters.subject !== "all" && !recordForm.subject && !isStaff) {
      setRecordForm((prev) => ({ ...prev, subject: filters.subject }));
    }
  }, [filters, isStaff, staffSubject, recordForm.subject, recordForm.className, recordForm.term, isEditingRecord]);

  const handleRecordChange = (key, value) => {
    if (key === "className") {
      const { section } = parseClassSelection(value);
      setRecordForm((prev) => ({
        ...prev,
        className: value,
        section: section || prev.section,
        registerNumber: "",
        studentName: "",
      }));
      return;
    }
    setRecordForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleRegisterSelect = (registerNumber) => {
    const info =
      registerDirectoryByClass.get(registerNumber) ||
      reportRegisterDirectory.get(registerNumber);
    setRecordForm((prev) => ({
      ...prev,
      registerNumber,
      studentName: info?.name || prev.studentName,
      className: info?.className || prev.className,
      section: info?.section || parseClassSelection(info?.className || prev.className).section || prev.section,
    }));
  };

  const beginEditRecord = (record) => {
    if (!record) return;
    setEditingRecordId(record._id || "");
    setRecordForm({
      studentName: record.studentName || "",
      registerNumber: record.registerNumber || "",
      className: record.className || "",
      section: record.section || "",
      subject: record.subject || "",
      marks: String(record.marks ?? ""),
      term: normalizeTerm(record.term || ""),
    });
    setLastSaveStatus("Editing record");
  };

  const cancelEditRecord = () => {
    setEditingRecordId("");
    setRecordForm({
      studentName: "",
      registerNumber: "",
      className: filters.className !== "all" ? filters.className : "",
      section: "",
      subject: staffSubject || (filters.subject !== "all" ? filters.subject : ""),
      marks: "",
      term: filters.term || "",
    });
    setLastSaveStatus("");
  };

  const createRecord = async () => {
    const payload = {
      studentName: recordForm.studentName.trim(),
      registerNumber: recordForm.registerNumber.trim(),
      className: recordForm.className.trim(),
      section: recordForm.section.trim(),
      subject: isStaff && staffSubject ? staffSubject : recordForm.subject.trim(),
      marks: Number(recordForm.marks),
      term: recordForm.term.trim(),
    };
    if (
      !payload.studentName ||
      !payload.registerNumber ||
      !payload.className ||
      !payload.section ||
      !payload.subject ||
      !payload.term
    ) {
      setNotice("Please fill register number, student name, class, section, subject, and term.");
      setLastSaveStatus("Missing required fields.");
      return;
    }
    if (!Number.isFinite(payload.marks) || payload.marks < 0 || payload.marks > 100) {
      setNotice("Marks must be a number between 0 and 100.");
      setLastSaveStatus("Invalid marks.");
      return;
    }
    const response = await apiRequest("/records", "POST", payload, token);
    if (!response.ok) {
      setNotice(response.data.message || "Failed to save record");
      setLastSaveStatus(response.data.message || "Failed to save record");
      return;
    }
    setNotice("Record created");
    setLastSaveStatus("Record created successfully.");
    setRecordForm({
      studentName: "",
      registerNumber: "",
      className: recordForm.className,
      section: recordForm.section,
      subject: staffSubject || recordForm.subject,
      marks: "",
      term: recordForm.term,
    });
    await loadRecords();
    await loadClassTeacherRecords();
  };

  const updateRecord = async () => {
    if (!editingRecordId) return;
    const payload = {
      studentName: recordForm.studentName.trim(),
      registerNumber: recordForm.registerNumber.trim(),
      className: recordForm.className.trim(),
      section: recordForm.section.trim(),
      subject: isStaff && staffSubject ? staffSubject : recordForm.subject.trim(),
      marks: Number(recordForm.marks),
      term: recordForm.term.trim(),
    };
    if (
      !payload.studentName ||
      !payload.registerNumber ||
      !payload.className ||
      !payload.section ||
      !payload.subject ||
      !payload.term
    ) {
      setNotice("Please fill register number, student name, class, section, subject, and term.");
      setLastSaveStatus("Missing required fields.");
      return;
    }
    if (!Number.isFinite(payload.marks) || payload.marks < 0 || payload.marks > 100) {
      setNotice("Marks must be a number between 0 and 100.");
      setLastSaveStatus("Invalid marks.");
      return;
    }
    const response = await apiRequest(`/records/${editingRecordId}`, "PUT", payload, token);
    if (!response.ok) {
      setNotice(response.data.message || "Failed to update record");
      setLastSaveStatus(response.data.message || "Failed to update record");
      return;
    }
    setNotice("Record updated");
    setLastSaveStatus("Record updated successfully.");
    setEditingRecordId("");
    setRecordForm({
      studentName: "",
      registerNumber: "",
      className: recordForm.className,
      section: recordForm.section,
      subject: staffSubject || recordForm.subject,
      marks: "",
      term: recordForm.term,
    });
    await loadRecords();
    await loadClassTeacherRecords();
  };

  const deleteRecord = async (recordId) => {
    if (!recordId) return;
    const confirmed = window.confirm("Delete this record? This cannot be undone.");
    if (!confirmed) return;
    const response = await apiRequest(`/records/${recordId}`, "DELETE", null, token);
    if (!response.ok) {
      setNotice(response.data.message || "Failed to delete record");
      return;
    }
    setNotice("Record deleted");
    if (editingRecordId === recordId) {
      cancelEditRecord();
    }
    await loadRecords();
    await loadClassTeacherRecords();
  };

  const createStaff = async () => {
    if (!staffForm.name || !staffForm.email || !staffForm.password || !staffForm.subject) {
      setNotice("Fill staff name, email, password, and subject.");
      return;
    }
    const response = await apiRequest("/users/staff", "POST", staffForm, token);
    if (!response.ok) {
      setNotice(response.data.message || "Failed to create staff");
      return;
    }
    setNotice("Staff account created");
    setStaffForm({ name: "", email: "", password: "", subject: "", classTeacherFor: "" });
    setStaffModalOpen(false);
    await loadStaffList();
  };

  const createStudent = async () => {
    const parsedClass = parseClassSelection(studentForm.className);
    if (!studentForm.studentName || !parsedClass.className || !parsedClass.section) {
      setNotice("Fill student name and choose a class.");
      setStudentSaveStatus("Missing required fields.");
      return;
    }

    const payload = {
      studentName: studentForm.studentName.trim(),
      parentName: studentForm.parentName.trim(),
      dateOfBirth: studentForm.dateOfBirth || undefined,
      place: studentForm.place.trim(),
      parentPhone: studentForm.parentPhone.trim(),
      className: parsedClass.className,
      section: parsedClass.section,
      admissionYear: new Date().getFullYear(),
    };

    const response = await apiRequest("/students", "POST", payload, token);
    if (!response.ok) {
      setNotice(response.data.message || "Failed to create student");
      setStudentSaveStatus(response.data.message || "Failed to create student");
      return;
    }
    const assignedRegisterNumber = response.data?.data?.registerNumber || "Assigned automatically";
    setNotice(`Student created with register number ${assignedRegisterNumber}`);
    setStudentSaveStatus(`Student created. Register number: ${assignedRegisterNumber}`);
    setStudentForm({
      studentName: "",
      parentName: "",
      dateOfBirth: "",
      place: "",
      parentPhone: "",
      className: "",
    });
    await loadStudents();
  };

  const downloadStudentMarksheet = () => {
    if (!selectedStudent || !selectedStudentTerm) {
      setNotice("Select a register number and term to download the marksheet.");
      return;
    }
    const rows = selectedStudentRecords.filter((r) => r.term === selectedStudentTerm);
    if (!rows.length) {
      setNotice("No records available for selected register number and term.");
      return;
    }
    const studentName = rows[0]?.studentName || "Student";
    const registerNumber = rows[0]?.registerNumber || selectedStudent;
    const section = rows[0]?.section || "-";
    const totalMarks = rows.reduce((sum, r) => sum + Number(r.marks || 0), 0);
    const percentage = average(rows) || 0;
    const overallResult = rows.every((r) => Number(r.marks || 0) >= 50) ? "PASS" : "FAIL";
    const rowsHtml = rows
      .slice()
      .sort((a, b) => a.subject.localeCompare(b.subject))
      .map(
        (r) =>
          `<tr><td>${r.subject}</td><td>${r.marks}</td><td>${gradeFromMarks(r.marks)}</td><td>${Number(r.marks || 0) >= 50 ? "PASS" : "FAIL"}</td></tr>`
      )
      .join("");
    const html = `<!doctype html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>${studentName} ${registerNumber} ${selectedStudentTerm} Marksheet</title>
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
    <p class="school">${SCHOOL_NAME}</p>
    <p class="sub">Statement of Marks</p>
    <table class="meta">
      <tr><td><strong>Term</strong>: ${selectedStudentTerm}</td><td><strong>Student Name</strong>: ${studentName}</td></tr>
      <tr><td><strong>Register No</strong>: ${registerNumber}</td><td><strong>Section</strong>: ${section}</td></tr>
      <tr><td><strong>Class</strong>: ${rows[0]?.className || "-"}</td><td><strong>Subject Count</strong>: ${rows.length}</td></tr>
    </table>
    <table>
      <thead>
        <tr><th>Subject</th><th>Marks Obtained</th><th>Grade</th><th>Result</th></tr>
      </thead>
      <tbody>
        ${rowsHtml}
        <tr><td><strong>Total</strong></td><td><strong>${totalMarks}</strong></td><td>-</td><td>-</td></tr>
        <tr><td><strong>Percentage</strong></td><td><strong>${percentage.toFixed(2)}%</strong></td><td>-</td><td>-</td></tr>
        <tr><td><strong>Result</strong></td><td><strong>${overallResult}</strong></td><td>-</td><td>-</td></tr>
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
    link.href = url;
    link.download = `${registerNumber.replace(/[^a-z0-9]+/gi, "_")}_${selectedStudentTerm.replace(
      /[^a-z0-9]+/gi,
      "_"
    )}_marksheet.html`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const chartClassRef = useRef(null);
  const chartSubjectRef = useRef(null);
  const chartAnalyticsPassFailRef = useRef(null);
  const chartReportClassRef = useRef(null);
  const chartReportStudentRef = useRef(null);
  const chartClass12SubjectRef = useRef(null);

  useChart(chartClassRef, {
    type: "bar",
    data: {
      labels: classPerformance.labels,
      datasets: [
        {
          label: "Average %",
          data: classPerformance.values,
          backgroundColor: "rgba(59, 125, 255, 0.6)",
          borderRadius: 8,
          categoryPercentage: 0.95,
          barPercentage: 0.9,
          maxBarThickness: 28,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
    },
  }, setChartError);

  useChart(chartSubjectRef, {
    type: "bar",
    data: {
      labels: subjectAverage.labels,
      datasets: [
        {
          label: "Average %",
          data: subjectAverage.values,
          backgroundColor: "rgba(47, 99, 219, 0.6)",
          borderRadius: 8,
        },
      ],
    },
    options: { responsive: true, plugins: { legend: { display: false } } },
  }, setChartError);


  useChart(chartAnalyticsPassFailRef, {
    type: "doughnut",
    data: {
      labels: passFail.labels,
      datasets: [
        {
          data: passFail.values,
          backgroundColor: ["rgba(34, 197, 94, 0.8)", "rgba(239, 68, 68, 0.8)"],
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      layout: {
        padding: {
          top: 12,
          right: 12,
          bottom: 12,
          left: 12,
        },
      },
      plugins: {
        legend: {
          position: "bottom",
          align: "center",
          labels: {
            boxWidth: 12,
            boxHeight: 12,
            padding: 16,
          },
        },
      },
    },
  }, setChartError);

  useChart(chartReportClassRef, {
    type: "bar",
    data: {
      labels: classReportData.labels,
      datasets: [
        {
          label: "Average %",
          data: classReportData.values,
          backgroundColor: "rgba(59, 125, 255, 0.6)",
          borderRadius: 8,
          maxBarThickness: 34,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: { y: { min: 0, max: 100 } },
    },
  }, setChartError);

  useChart(chartReportStudentRef, {
    type: "bar",
    data: {
      labels: reportStudentSubjectMarks.labels,
      datasets: [
        {
          label: "Marks",
          data: reportStudentSubjectMarks.values,
          backgroundColor: "rgba(34, 197, 94, 0.6)",
          borderRadius: 8,
          maxBarThickness: 42,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: { y: { min: 0, max: 100 } },
    },
  }, setChartError);

  useChart(chartClass12SubjectRef, {
    type: "bar",
    data: {
      labels: class12SubjectReport.labels,
      datasets: [
        {
          label: "Average %",
          data: class12SubjectReport.values,
          backgroundColor: "rgba(14, 116, 144, 0.6)",
          borderRadius: 8,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: { y: { min: 0, max: 100 } },
    },
  }, setChartError);

  const navItems = [
    { id: "dashboard", label: "Dashboard" },
    { id: "students", label: "Students" },
    { id: "marks", label: "Marks Entry" },
    { id: "reports", label: "Reports" },
    ...(isAdmin ? [{ id: "staff", label: "Staff Management" }] : []),
    { id: "analytics", label: "Analytics" },
    { id: "settings", label: "Settings" },
  ];

  return (
    <div className="dashboard-shell">
      <aside
        className={`sidebar ${sidebarCollapsed ? "sidebar--collapsed" : ""}`}
      >
        <div className="sidebar__brand">
          <div className="brand-badge">
            <span>AR</span>
          </div>
          {!sidebarCollapsed ? <span className="brand-title">Academic</span> : null}
          <button
            type="button"
            onClick={() => setSidebarCollapsed((prev) => !prev)}
            className="sidebar__toggle"
            aria-label="Toggle sidebar"
          >
            {sidebarCollapsed ? "»" : "«"}
          </button>
        </div>

        <nav className="sidebar__nav">
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setActivePage(item.id)}
              className={`sidebar__link ${activePage === item.id ? "is-active" : ""}`}
            >
              <span className="sidebar__icon">
                <SidebarIcon id={item.id} />
              </span>
              {!sidebarCollapsed ? item.label : null}
            </button>
          ))}
        </nav>
      </aside>

      <div className="shell-body">
        <header className="topbar">
          <div>
            <h1 className="topbar__title">Automated Academic Report Generator</h1>
            <p className="topbar__subtitle">Manage records, staff, and analytics in one place.</p>
          </div>
          <div className="topbar__actions">
            <div className="profile">
              <button
                className="profile__btn"
                onClick={() => setProfileOpen((prev) => !prev)}
                aria-label="Profile"
              >
                {user?.name?.[0] || "U"}
              </button>
              {profileOpen ? (
                <div className="profile__menu">
                  <div className="profile__meta">
                    <p className="profile__name">{user?.name || "User"}</p>
                    <p className="profile__email">{user?.email || ""}</p>
                  </div>
                  <button className="profile__item" onClick={onLogout}>
                    Logout
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </header>

        <main className="shell-content">
          {notice ? (
            <div className="card">
              <div className="card-body">
                <p className="text-sm text-brand-700">{notice}</p>
              </div>
            </div>
          ) : null}
          {activePage === "dashboard" ? (
            <>
              <div className="welcome">
                <h2>Welcome{user?.name ? `, ${user.name}` : ""}!</h2>
                <p>Here’s a quick snapshot of academic performance and records.</p>
              </div>

              <div className={`stat-grid ${isAdmin ? "" : "stat-grid--three"}`}>
                <StatCard
                  title="Total Students"
                  value={totalStudents}
                  tone="stat-card--blue"
                  icon={<UserGroupIcon />}
                />
                {isAdmin ? (
                  <StatCard
                    title="Total Staff"
                    value={totalStaff}
                    tone="stat-card--orange"
                    icon={<StaffIcon />}
                  />
                ) : null}
                <StatCard
                  title="Classes Available"
                  value="6 - 12"
                  tone="stat-card--green"
                  icon={<ClassIcon />}
                />
                <StatCard
                  title="Reports Generated"
                  value={normalizedRecords.length}
                  tone="stat-card--red"
                  icon={<ReportIcon />}
                />
              </div>

              {chartError ? (
                <div className="panel">
                  <div className="panel__body">
                    <p className="text-sm text-brand-700">{chartError}</p>
                  </div>
                </div>
              ) : null}

              <ChartCard
                title={isStaff && classTeacherFor ? `${classTeacherFor} Subject Performance` : "Class Performance"}
                canvasRef={chartClassRef}
                bodyClassName="chart-compact"
              />
            </>
          ) : null}

          {activePage === "students" ? (
            <div className="space-y-4">
              {isAdmin ? (
                <div className="card">
                  <div className="card-header">
                    <div>
                      <h2 className="text-lg font-semibold text-brand-900">Add Student</h2>
                      <p className="text-sm text-brand-600">Create a student profile with full details.</p>
                    </div>
                    {studentsLoading ? <span className="pill">Loading...</span> : null}
                  </div>
                  <div className="card-body space-y-3">
                    <button
                      className="btn-primary"
                      onClick={() => setStudentFormOpen((prev) => !prev)}
                    >
                      {studentFormOpen ? "Close" : "Add Student"}
                    </button>
                    {studentFormOpen ? (
                      <>
                        {studentSaveStatus ? (
                          <div className="pill text-brand-700">{studentSaveStatus}</div>
                        ) : null}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <input
                            className="input"
                            placeholder="Student Name"
                            value={studentForm.studentName}
                            onChange={(e) =>
                              setStudentForm((prev) => ({ ...prev, studentName: e.target.value }))
                            }
                          />
                          <input
                            className="input"
                            placeholder="Parent Name"
                            value={studentForm.parentName}
                            onChange={(e) =>
                              setStudentForm((prev) => ({ ...prev, parentName: e.target.value }))
                            }
                          />
                          <input
                            className="input"
                            type="date"
                            value={studentForm.dateOfBirth}
                            onChange={(e) =>
                              setStudentForm((prev) => ({ ...prev, dateOfBirth: e.target.value }))
                            }
                          />
                          <input
                            className="input"
                            placeholder="Place"
                            value={studentForm.place}
                            onChange={(e) => setStudentForm((prev) => ({ ...prev, place: e.target.value }))}
                          />
                          <input
                            className="input"
                            placeholder="Parent Phone"
                            value={studentForm.parentPhone}
                            onChange={(e) =>
                              setStudentForm((prev) => ({ ...prev, parentPhone: e.target.value }))
                            }
                          />
                          <select
                            className="input"
                            value={studentForm.className}
                            onChange={(e) => setStudentForm((prev) => ({ ...prev, className: e.target.value }))}
                          >
                            <option value="">Select Class</option>
                            {CLASS_OPTIONS.map((item) => (
                              <option key={item} value={item}>
                                {item}
                              </option>
                            ))}
                          </select>
                        </div>
                        <button className="btn-primary" onClick={createStudent}>
                          Save Student
                        </button>
                      </>
                    ) : null}
                  </div>
                </div>
              ) : null}

              <div className="card">
                <div className="card-header">
                  <h2 className="text-lg font-semibold text-brand-900">Students</h2>
                  <span className="pill">{filteredStudentNameOptions.length} total</span>
                </div>
                <div className="card-body grid grid-cols-1 md:grid-cols-3 gap-4">
                  <label className="block">
                    <span className="text-sm font-medium text-brand-800">Select Student Name</span>
                    <input
                      className="input mt-2"
                      type="text"
                      placeholder="Type name (e.g., Suresh)"
                      value={studentNameSearch}
                      onChange={(e) => setStudentNameSearch(e.target.value)}
                    />
                    <select
                      className="input mt-2"
                      value={selectedStudentName}
                      onChange={(e) => {
                        setSelectedStudentName(e.target.value);
                        setSelectedStudent("");
                        setSelectedStudentTerm("");
                      }}
                    >
                      <option value="">Choose student</option>
                      {filteredStudentNameOptions.map((studentName) => (
                        <option key={studentName} value={studentName}>
                          {studentName}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block">
                    <span className="text-sm font-medium text-brand-800">Select Register Number</span>
                    <select
                      className="input mt-2"
                      value={selectedStudent}
                      onChange={(e) => {
                        setSelectedStudent(e.target.value);
                        setSelectedStudentTerm("");
                      }}
                      disabled={!selectedStudentName}
                    >
                      <option value="">Choose register number</option>
                      {registerOptionsByStudentName.map((registerNumber) => (
                        <option key={registerNumber} value={registerNumber}>
                          {registerNumber}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block">
                    <span className="text-sm font-medium text-brand-800">Select Term</span>
                    <select
                      className="input mt-2"
                      value={selectedStudentTerm}
                      onChange={(e) => setSelectedStudentTerm(e.target.value)}
                    >
                      <option value="">Choose term</option>
                      {selectedStudentTerms.map((term) => (
                        <option key={term} value={term}>
                          {term}
                        </option>
                      ))}
                    </select>
                  </label>
                  <div className="flex items-end">
                    <button className="btn-primary w-full" onClick={downloadStudentMarksheet}>
                      Download Marksheet
                    </button>
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="card-header">
                  <h2 className="text-lg font-semibold text-brand-900">Student Records</h2>
                  <span className="pill">{selectedStudentRecords.length} records</span>
                </div>
                <div className="card-body">
                  {!selectedStudent ? (
                    <p className="text-sm text-brand-600">
                      Select a student name and register number to view records.
                    </p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-left">
                        <thead>
                          <tr>
                            <th className="table-th px-3 py-2">Subject</th>
                            <th className="table-th px-3 py-2">Term</th>
                            <th className="table-th px-3 py-2">Marks</th>
                            <th className="table-th px-3 py-2">Grade</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedStudentRecords.map((record) => (
                            <tr key={record._id} className="border-b border-brand-100">
                              <td className="table-td px-3 py-2">{record.subject}</td>
                              <td className="table-td px-3 py-2">{record.term}</td>
                              <td className="table-td px-3 py-2">{record.marks}</td>
                              <td className="table-td px-3 py-2">{gradeFromMarks(record.marks)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : null}

          {activePage === "marks" ? (
            <div className="space-y-4">
              <div className="card">
                <div className="card-header">
                  <h2 className="text-lg font-semibold text-brand-900">Marks Entry</h2>
                </div>
                <div className="card-body grid grid-cols-1 md:grid-cols-4 gap-4">
                  <label className="block">
                    <span className="text-sm font-medium text-brand-800">Class</span>
                    <select
                      className="input mt-2"
                      value={filters.className}
                      onChange={(e) => setFilters((prev) => ({ ...prev, className: e.target.value }))}
                    >
                      <option value="all">All Classes</option>
                      {CLASS_OPTIONS.map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block">
                    <span className="text-sm font-medium text-brand-800">Register Number</span>
                    <select
                      className="input mt-2"
                      value={filters.registerNumber}
                      onChange={(e) =>
                        setFilters((prev) => ({ ...prev, registerNumber: e.target.value }))
                      }
                    >
                      <option value="all">All Students</option>
                      {registerOptionsForFilter.map((registerNumber) => (
                        <option key={registerNumber} value={registerNumber}>
                          {formatRegisterOption(registerNumber, registerDirectoryForFilter)}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block">
                    <span className="text-sm font-medium text-brand-800">Term</span>
                    <select
                      className="input mt-2"
                      value={filters.term}
                      onChange={(e) => setFilters((prev) => ({ ...prev, term: e.target.value }))}
                    >
                      <option value="">All Terms</option>
                      <option>Term 1</option>
                      <option>Term 2</option>
                      <option>Term 3</option>
                    </select>
                  </label>
                  <label className="block">
                    <span className="text-sm font-medium text-brand-800">Subject</span>
                    <select
                      className="input mt-2"
                      value={filters.subject}
                      onChange={(e) => setFilters((prev) => ({ ...prev, subject: e.target.value }))}
                      disabled={isStaff && staffSubject}
                    >
                      <option value="all">All Subjects</option>
                      {(isStaff && staffSubject ? [staffSubject] : SUBJECT_OPTIONS).map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              </div>

              <div className="card">
                <div className="card-header">
                  <h2 className="text-lg font-semibold text-brand-900">Marks Table</h2>
                  <div className="flex flex-wrap gap-2">
                    <button className="btn-primary" onClick={isEditingRecord ? updateRecord : createRecord}>
                      {isEditingRecord ? "Update Record" : "Save New Record"}
                    </button>
                    {isEditingRecord ? (
                      <button className="btn-outline" onClick={cancelEditRecord}>
                        Cancel Edit
                      </button>
                    ) : null}
                  </div>
                </div>
                <div className="card-body">
                  {lastSaveStatus ? (
                    <div className="pill mb-3 text-brand-700">{lastSaveStatus}</div>
                  ) : null}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                    <select
                      className="input"
                      value={recordForm.className}
                      onChange={(e) => handleRecordChange("className", e.target.value)}
                    >
                      <option value="">Select Class</option>
                      {CLASS_OPTIONS.map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </select>
                    <select
                      className="input"
                      value={recordForm.registerNumber}
                      onChange={(e) => handleRegisterSelect(e.target.value)}
                      disabled={!recordForm.className}
                    >
                      <option value="">Select Register Number</option>
                      {registerOptionsByClass.map((registerNumber) => (
                        <option key={registerNumber} value={registerNumber}>
                          {formatRegisterOption(registerNumber, registerDirectoryByClass)}
                        </option>
                      ))}
                    </select>
                    <input
                      className="input"
                      placeholder="Student Name"
                      value={recordForm.studentName}
                      readOnly
                    />
                    <select
                      className="input"
                      value={isStaff && staffSubject ? staffSubject : recordForm.subject}
                      onChange={(e) => handleRecordChange("subject", e.target.value)}
                      disabled={isStaff && staffSubject}
                    >
                      <option value="">Select Subject</option>
                      {(isStaff && staffSubject ? [staffSubject] : SUBJECT_OPTIONS).map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </select>
                    <select
                      className="input"
                      value={recordForm.term}
                      onChange={(e) => handleRecordChange("term", e.target.value)}
                    >
                      <option value="">Select Term</option>
                      <option>Term 1</option>
                      <option>Term 2</option>
                      <option>Term 3</option>
                    </select>
                    <input
                      className="input"
                      placeholder="Marks"
                      type="number"
                      min="0"
                      max="100"
                      value={recordForm.marks}
                      onChange={(e) => handleRecordChange("marks", e.target.value)}
                    />
                    <input
                      className="input"
                      placeholder="Section"
                      value={recordForm.section}
                      readOnly
                    />
                  </div>

                  <div className="overflow-x-auto">
                    <table className="min-w-full text-left">
                        <thead>
                          <tr>
                            <th className="table-th px-3 py-2">Register No</th>
                            <th className="table-th px-3 py-2">Student</th>
                            <th className="table-th px-3 py-2">Class</th>
                            <th className="table-th px-3 py-2">Section</th>
                            <th className="table-th px-3 py-2">Subject</th>
                            <th className="table-th px-3 py-2">Term</th>
                            <th className="table-th px-3 py-2">Marks</th>
                            <th className="table-th px-3 py-2">Grade</th>
                            <th className="table-th px-3 py-2">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredRecords.slice(0, 10).map((record) => (
                            <tr key={record._id} className="border-b border-brand-100">
                              <td className="table-td px-3 py-2">{record.registerNumber || "-"}</td>
                              <td className="table-td px-3 py-2">{record.studentName}</td>
                              <td className="table-td px-3 py-2">{record.className}</td>
                              <td className="table-td px-3 py-2">{record.section || "-"}</td>
                              <td className="table-td px-3 py-2">{record.subject}</td>
                            <td className="table-td px-3 py-2">{record.term}</td>
                            <td className="table-td px-3 py-2">{record.marks}</td>
                            <td className="table-td px-3 py-2">{gradeFromMarks(record.marks)}</td>
                            <td className="table-td px-3 py-2 space-x-2">
                              <button className="btn-ghost" onClick={() => beginEditRecord(record)}>
                                Edit
                              </button>
                              <button className="btn-ghost text-red-500" onClick={() => deleteRecord(record._id)}>
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          {activePage === "reports" ? (
            isBiologyStaff ? (
              <div className="grid grid-cols-1 gap-4 reports-page">
                <div className="card reports-card">
                  <div className="card-header">
                    <div>
                      <h2 className="text-lg font-semibold text-brand-900">Biology Class Averages</h2>
                      <p className="text-sm text-brand-600">Class-wise Biology average only.</p>
                    </div>
                  </div>
                  <div className="card-body space-y-4 reports-card__body">
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                      {biologyClassAverages.labels.map((label, idx) => {
                        const count = biologyClassAverages.counts?.[idx] || 0;
                        const value = biologyClassAverages.values?.[idx] || 0;
                        return (
                          <div key={label} className="card">
                            <div className="card-body">
                              <p className="text-sm text-brand-600">{label}</p>
                              <p className="text-2xl font-semibold text-brand-900">
                                {count ? `${Number(value).toFixed(2)}%` : "N/A"}
                              </p>
                              <p className="text-xs text-brand-500">{count} records</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    {!biologyClassAverages.counts?.some((count) => count > 0) ? (
                      <p className="text-sm text-brand-600">No Biology records available yet.</p>
                    ) : null}
                    <div className="reports-chart-wrap">
                      <canvas ref={chartReportClassRef} />
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 reports-page">
                <div className="card reports-card">
                  <div className="card-header">
                    <div>
                      <h2 className="text-lg font-semibold text-brand-900">Student Report</h2>
                      <p className="text-sm text-brand-600">
                        Select class, register number, and term to view subject-wise marks.
                      </p>
                    </div>
                  </div>
                  <div className="card-body space-y-4 reports-card__body">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <select
                        className="input"
                        value={reportStudentClass}
                        onChange={(e) => {
                          setReportStudentClass(e.target.value);
                          setReportStudent("");
                          setReportStudentTerm("");
                        }}
                      >
                        <option value="all">Select class</option>
                        {CLASS_OPTIONS.map((className) => (
                          <option key={className} value={className}>
                            {className}
                          </option>
                        ))}
                      </select>
                      <select
                        className="input"
                        value={reportStudent}
                        onChange={(e) => {
                          setReportStudent(e.target.value);
                          setReportStudentTerm("");
                        }}
                        disabled={reportStudentClass === "all"}
                      >
                        <option value="">Select register number</option>
                        {reportStudentOptions.map((registerNumber) => (
                          <option key={registerNumber} value={registerNumber}>
                            {formatRegisterOption(registerNumber, reportStudentDirectory)}
                          </option>
                        ))}
                      </select>
                      <select
                        className="input"
                        value={reportStudentTerm}
                        onChange={(e) => setReportStudentTerm(e.target.value)}
                        disabled={!reportStudent}
                      >
                        <option value="">Select term</option>
                        {reportStudentTermOptions.map((term) => (
                          <option key={term} value={term}>
                            {term}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="reports-chart-wrap">
                      <canvas ref={chartReportStudentRef} />
                    </div>
                  </div>
                </div>
              </div>
            )
          ) : null}

          {activePage === "staff" && isAdmin ? (
            <div className="card">
              <div className="card-header">
                <div>
                  <h2 className="text-lg font-semibold text-brand-900">Staff Management</h2>
                  <p className="text-sm text-brand-600">Manage staff accounts and class assignments.</p>
                </div>
                <button className="btn-primary" onClick={() => setStaffModalOpen(true)}>
                  Add Staff
                </button>
              </div>
              <div className="card-body space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                  <input
                    className="input max-w-xs"
                    placeholder="Search staff"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <span className="pill">{staffRows.length} staff</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full text-left">
                    <thead>
                      <tr>
                        {[
                          { key: "name", label: "Name" },
                          { key: "email", label: "Email" },
                          { key: "subject", label: "Subject" },
                          { key: "classTeacherFor", label: "Class Teacher" },
                        ].map((col) => (
                          <th
                            key={col.key}
                            className="table-th px-3 py-2 cursor-pointer"
                            onClick={() =>
                              setStaffSort((prev) => ({
                                key: col.key,
                                direction: prev.direction === "asc" ? "desc" : "asc",
                              }))
                            }
                          >
                            {col.label}
                          </th>
                        ))}
                        <th className="table-th px-3 py-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {staffPageRows.map((staff) => (
                        <tr key={staff._id} className="border-b border-brand-100">
                          <td className="table-td px-3 py-2">{staff.name}</td>
                          <td className="table-td px-3 py-2">{staff.email}</td>
                          <td className="table-td px-3 py-2">{staff.subject}</td>
                          <td className="table-td px-3 py-2">{staff.classTeacherFor || "-"}</td>
                          <td className="table-td px-3 py-2 space-x-2">
                            <button className="btn-ghost">Edit</button>
                            <button className="btn-ghost text-red-500">Delete</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex items-center justify-between">
                  <p className="text-sm text-brand-600">
                    Page {staffPage} of {staffPageCount}
                  </p>
                  <div className="flex gap-2">
                    <button
                      className="btn-outline"
                      onClick={() => setStaffPage((p) => Math.max(1, p - 1))}
                      disabled={staffPage === 1}
                    >
                      Prev
                    </button>
                    <button
                      className="btn-outline"
                      onClick={() => setStaffPage((p) => Math.min(staffPageCount, p + 1))}
                      disabled={staffPage === staffPageCount}
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          {activePage === "analytics" ? (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              <div className="card xl:col-span-2">
                <div className="card-header">
                  <h2 className="text-lg font-semibold text-brand-900">Analytics Overview</h2>
                  <span className="pill">Records loaded: {normalizedRecords.length}</span>
                </div>
                <div className="card-body">
                  <p className="text-sm text-brand-600">
                    Staff subject: {staffSubject || "N/A"} | Class Teacher: {classTeacherFor || "N/A"}
                  </p>
                  {chartError ? (
                    <p className="text-sm text-brand-700 mt-2">{chartError}</p>
                  ) : null}
                  {!normalizedRecords.length ? (
                    <p className="text-sm text-brand-600 mt-2">
                      No data available yet. Add marks to see analytics.
                    </p>
                  ) : null}
                </div>
              </div>
              {normalizedRecords.length ? (
                <>
                  <ChartCard
                    title="Pass / Fail Distribution"
                    canvasRef={chartAnalyticsPassFailRef}
                    chartKey={`pf-${passFail.values.join("-")}`}
                    panelClassName="analytics-pie-panel"
                    bodyClassName="analytics-pie-card"
                  />
                  <div className="panel">
                    <div className="panel__header">
                      <div>
                        <h2>Subject Average</h2>
                        <p className="text-sm text-brand-600">
                          {subjectAvgClass === "all"
                            ? "All classes"
                            : `Class wise subject averages (${subjectAvgClass})`}
                        </p>
                      </div>
                      <select
                        className="input max-w-[180px]"
                        value={subjectAvgClass}
                        onChange={(e) => setSubjectAvgClass(e.target.value)}
                      >
                        {subjectAvgClassOptions.map((className) => (
                          <option key={className} value={className}>
                            {className === "all" ? "All Classes" : className}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="panel__body">
                      <canvas ref={chartSubjectRef} height="220" />
                    </div>
                  </div>
                  <div className="card">
                    <div className="card-header">
                      <div>
                        <h2 className="text-lg font-semibold text-brand-900">Top 3 Scorers</h2>
                        {isAdmin ? (
                          <p className="text-sm text-brand-600">Select class to view toppers.</p>
                        ) : null}
                      </div>
                      {isAdmin ? (
                        <select
                          className="input max-w-[180px]"
                          value={adminRankClass}
                          onChange={(e) => setAdminRankClass(e.target.value)}
                        >
                          {adminRankClassOptions.map((className) => (
                            <option key={className} value={className}>
                              {className === "all" ? "Select class" : className}
                            </option>
                          ))}
                        </select>
                      ) : null}
                    </div>
                    <div className="card-body">
                      {isAdmin ? (
                        adminRankClass !== "all" ? (
                          adminSummaryByClass[adminRankClass]?.topRanks?.length ? (
                            <table className="w-full text-sm text-left">
                              <thead>
                                <tr className="text-brand-600">
                                  <th className="pb-2">Rank</th>
                                  <th className="pb-2">Student</th>
                                  <th className="pb-2">Average</th>
                                </tr>
                              </thead>
                              <tbody>
                                {adminSummaryByClass[adminRankClass].topRanks.map((row, idx) => (
                                  <tr key={`${adminRankClass}-${row.name}`}>
                                    <td className="py-1">{idx + 1}</td>
                                    <td className="py-1">{row.name}</td>
                                    <td className="py-1">{row.avg.toFixed(2)}%</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          ) : (
                            <p className="text-sm text-brand-600">No topper data available.</p>
                          )
                        ) : (
                          <p className="text-sm text-brand-600">Select a class to view toppers.</p>
                        )
                      ) : !isStaff || !classTeacherFor ? (
                        <p className="text-sm text-brand-600">Available for class teachers.</p>
                      ) : classTeacherSummary.topRanks.length ? (
                        <table className="w-full text-sm text-left">
                          <thead>
                            <tr className="text-brand-600">
                              <th className="pb-2">Rank</th>
                              <th className="pb-2">Student</th>
                              <th className="pb-2">Average</th>
                            </tr>
                          </thead>
                          <tbody>
                            {classTeacherSummary.topRanks.map((row, idx) => (
                              <tr key={row.name}>
                                <td className="py-1">{idx + 1}</td>
                                <td className="py-1">{row.name}</td>
                                <td className="py-1">{row.avg.toFixed(2)}%</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      ) : (
                        <p className="text-sm text-brand-600">No topper data available.</p>
                      )}
                    </div>
                  </div>
                  <div className="card">
                    <div className="card-header">
                      <div>
                        <h2 className="text-lg font-semibold text-brand-900">Special Care Students</h2>
                        {isAdmin ? (
                          <p className="text-sm text-brand-600">Select class to view special care list.</p>
                        ) : null}
                      </div>
                    </div>
                    <div className="card-body space-y-3">
                      {isAdmin ? (
                        adminRankClass !== "all" ? (
                          adminSummaryByClass[adminRankClass]?.specialCare?.length ? (
                            <>
                              <table className="w-full text-sm text-left">
                                <thead>
                                  <tr className="text-brand-600">
                                    <th className="pb-2">Rank</th>
                                    <th className="pb-2">Student</th>
                                    <th className="pb-2">Average</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {adminSummaryByClass[adminRankClass].specialCare.map((row, idx) => (
                                    <tr key={`${adminRankClass}-${row.name}`}>
                                      <td className="py-1">{idx + 1}</td>
                                      <td className="py-1">{row.name}</td>
                                      <td className="py-1">{row.avg.toFixed(2)}%</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                              <p className="text-sm text-brand-600">
                                Idea: set a weekly support plan, call parents, pair with a peer mentor, and track 2-3
                                focus subjects with short practice goals.
                              </p>
                            </>
                          ) : (
                            <p className="text-sm text-brand-600">No special care data available.</p>
                          )
                        ) : (
                          <p className="text-sm text-brand-600">Select a class to view special care list.</p>
                        )
                      ) : !isStaff || !classTeacherFor ? (
                        <p className="text-sm text-brand-600">Available for class teachers.</p>
                      ) : classTeacherSummary.specialCare.length ? (
                        <>
                          <table className="w-full text-sm text-left">
                            <thead>
                              <tr className="text-brand-600">
                                <th className="pb-2">Rank</th>
                                <th className="pb-2">Student</th>
                                <th className="pb-2">Average</th>
                              </tr>
                            </thead>
                            <tbody>
                              {classTeacherSummary.specialCare.map((row, idx) => (
                                <tr key={row.name}>
                                  <td className="py-1">{idx + 1}</td>
                                  <td className="py-1">{row.name}</td>
                                  <td className="py-1">{row.avg.toFixed(2)}%</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                          <p className="text-sm text-brand-600">
                            Idea: set a weekly support plan, call parents, pair with a peer mentor, and track 2-3
                            focus subjects with short practice goals.
                          </p>
                        </>
                      ) : (
                        <p className="text-sm text-brand-600">No special care data available.</p>
                      )}
                    </div>
                  </div>
                </>
              ) : null}
            </div>
          ) : null}

          {activePage === "analytics" ? (
            <div className="card mt-4">
              <div className="card-header">
                <div>
                  <h2 className="text-lg font-semibold text-brand-900">
                    {class12SubjectReport.targetClass} Subject Averages
                  </h2>
                  <p className="text-sm text-brand-600">Bar chart by subject.</p>
                </div>
                {isAdmin ? (
                  <select
                    className="input max-w-[180px]"
                    value={analyticsSubjectClass}
                    onChange={(e) => setAnalyticsSubjectClass(e.target.value)}
                  >
                    {analyticsSubjectOptions.map((className) => (
                      <option key={className} value={className}>
                        {className}
                      </option>
                    ))}
                  </select>
                ) : null}
              </div>
              <div className="card-body space-y-4">
                {class12SubjectReport.hasData && class12SubjectReport.labels.length ? (
                  <div className="class12-chart">
                    <canvas ref={chartClass12SubjectRef} />
                  </div>
                ) : (
                  <p className="text-sm text-brand-600">No Class 12 records available yet.</p>
                )}
              </div>
            </div>
          ) : null}

          {activePage === "settings" ? (
            <div className="card">
              <div className="card-header">
                <h2 className="text-lg font-semibold text-brand-900">Settings</h2>
              </div>
              <div className="card-body">
                <p className="text-sm text-brand-600">Settings panel placeholder.</p>
              </div>
            </div>
          ) : null}
        </main>
      </div>

      {staffModalOpen ? (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="card w-full max-w-lg">
            <div className="card-header">
              <h2 className="text-lg font-semibold text-brand-900">Add Staff</h2>
              <button className="btn-ghost" onClick={() => setStaffModalOpen(false)}>
                Close
              </button>
            </div>
            <div className="card-body space-y-4">
              <label className="block">
                <span className="text-sm font-medium text-brand-800">Name</span>
                <input
                  className="input mt-2"
                  value={staffForm.name}
                  onChange={(e) => setStaffForm((prev) => ({ ...prev, name: e.target.value }))}
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-brand-800">Email</span>
                <input
                  className="input mt-2"
                  type="email"
                  value={staffForm.email}
                  onChange={(e) => setStaffForm((prev) => ({ ...prev, email: e.target.value }))}
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-brand-800">Password</span>
                <input
                  className="input mt-2"
                  type="password"
                  value={staffForm.password}
                  onChange={(e) => setStaffForm((prev) => ({ ...prev, password: e.target.value }))}
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-brand-800">Subject</span>
                <select
                  className="input mt-2"
                  value={staffForm.subject}
                  onChange={(e) => setStaffForm((prev) => ({ ...prev, subject: e.target.value }))}
                >
                  <option value="">Select subject</option>
                  {SUBJECT_OPTIONS.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="text-sm font-medium text-brand-800">Class Teacher</span>
                <select
                  className="input mt-2"
                  value={staffForm.classTeacherFor}
                  onChange={(e) =>
                    setStaffForm((prev) => ({ ...prev, classTeacherFor: e.target.value }))
                  }
                >
                  <option value="">Not a class teacher</option>
                  {CLASS_OPTIONS.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>
              <button className="btn-primary w-full" onClick={createStaff}>
                Save Staff
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function StatCard({ title, value, tone, icon }) {
  return (
    <div className={`stat-card ${tone || ""}`}>
      <div className="stat-card__icon">{icon}</div>
      <div>
        <p className="stat-card__label">{title}</p>
        <p className="stat-card__value">{value}</p>
      </div>
      <div className="stat-card__bars" aria-hidden="true" />
    </div>
  );
}

function SidebarIcon({ id }) {
  const common = "h-4 w-4";
  switch (id) {
    case "dashboard":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 12h8V3H3v9Zm10 9h8v-7h-8v7Zm0-9h8V3h-8v9ZM3 21h8v-7H3v7Z" />
        </svg>
      );
    case "students":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M16 11a4 4 0 1 0-8 0m8 0a4 4 0 0 1-8 0m8 0v2a4 4 0 0 1-8 0v-2" />
          <path d="M4 21a8 8 0 0 1 16 0" />
        </svg>
      );
    case "marks":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M4 19h16M4 5h10l4 4v10H4z" />
          <path d="M8 13h6M8 9h3" />
        </svg>
      );
    case "reports":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M4 4h16v16H4z" />
          <path d="M8 16V8m4 8V6m4 10v-5" />
        </svg>
      );
    case "staff":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M16 11a4 4 0 1 0-8 0m8 0a4 4 0 0 1-8 0m8 0v2a4 4 0 0 1-8 0v-2" />
          <path d="M20 21a8 8 0 0 0-16 0" />
        </svg>
      );
    case "analytics":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 3v18h18" />
          <path d="M7 15l4-4 3 3 5-6" />
        </svg>
      );
    case "settings":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 15.5a3.5 3.5 0 1 0-3.5-3.5 3.5 3.5 0 0 0 3.5 3.5Z" />
          <path d="M19.4 15a1.9 1.9 0 0 0 .4 2.1l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.9 1.9 0 0 0-2.1-.4 1.9 1.9 0 0 0-1.1 1.7V22a2 2 0 1 1-4 0v-.1a1.9 1.9 0 0 0-1.1-1.7 1.9 1.9 0 0 0-2.1.4l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.9 1.9 0 0 0 .4-2.1 1.9 1.9 0 0 0-1.7-1.1H2a2 2 0 1 1 0-4h.1a1.9 1.9 0 0 0 1.7-1.1 1.9 1.9 0 0 0-.4-2.1l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.9 1.9 0 0 0 2.1.4 1.9 1.9 0 0 0 1.1-1.7V2a2 2 0 1 1 4 0v.1a1.9 1.9 0 0 0 1.1 1.7 1.9 1.9 0 0 0 2.1-.4l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.9 1.9 0 0 0-.4 2.1 1.9 1.9 0 0 0 1.7 1.1H22a2 2 0 1 1 0 4h-.1a1.9 1.9 0 0 0-1.7 1.1Z" />
        </svg>
      );
    default:
      return <span className="text-xs">•</span>;
  }
}

function UserGroupIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M7 11a4 4 0 1 1 4-4 4 4 0 0 1-4 4Zm10-1a3 3 0 1 1 3-3 3 3 0 0 1-3 3ZM2 20a5 5 0 0 1 10 0Zm11 0a4 4 0 0 1 8 0Z" />
    </svg>
  );
}

function StaffIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 12a4 4 0 1 1 4-4 4 4 0 0 1-4 4Zm-7 9a7 7 0 0 1 14 0Z" />
      <path d="M18.5 11.5a3 3 0 1 1 3-3 3 3 0 0 1-3 3Z" />
    </svg>
  );
}

function ClassIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 5h16v12H4z" />
      <path d="M8 19h8" />
      <path d="M8 9h8M8 13h5" />
    </svg>
  );
}

function ReportIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6 3h9l5 5v13H6z" />
      <path d="M15 3v5h5" />
      <path d="M9 13h6M9 17h6M9 9h3" />
    </svg>
  );
}

function ChartCard({ title, canvasRef, chartKey, bodyClassName, canvasClassName, panelClassName }) {
  return (
    <div className={`panel ${panelClassName || ""}`.trim()} key={chartKey || title}>
      <div className="panel__header">
        <h2>{title}</h2>
      </div>
      <div className={`panel__body ${bodyClassName || ""}`.trim()}>
        <canvas ref={canvasRef} className={canvasClassName || ""} height="220" />
      </div>
    </div>
  );
}

function ReportCard({ title, description, onOpen }) {
  return (
    <div className="card">
      <div className="card-body space-y-3">
        <h3 className="text-lg font-semibold text-brand-900">{title}</h3>
        <p className="text-sm text-brand-600">{description}</p>
        <button className="btn-outline" onClick={onOpen}>Open analytics</button>
      </div>
    </div>
  );
}

async function apiRequest(path, method, payload, token) {
  const headers = { "Content-Type": "application/json" };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: payload ? JSON.stringify(payload) : undefined,
    });

    let data = {};
    try {
      data = await response.json();
    } catch {
      data = {};
    }

    return { ok: response.ok, status: response.status, data };
  } catch {
    return {
      ok: false,
      status: 0,
      data: { message: "Cannot reach server. Please start backend API." },
    };
  }
}

export default App;
