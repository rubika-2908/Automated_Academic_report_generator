const togglePassword = document.getElementById("togglePassword");
const toggleConfirmPassword = document.getElementById("toggleConfirmPassword");
const username = document.getElementById("username");
const password = document.getElementById("password");
const confirmPassword = document.getElementById("confirmPassword");
const email = document.getElementById("email");
const fullName = document.getElementById("fullName");
const registerForm = document.getElementById("registerForm");
const loginForm = document.getElementById("loginForm");
const USERS_KEY = "academic_users_v1";
let toastTimer;

function showToast(message) {
  clearTimeout(toastTimer);

  const existingToast = document.querySelector(".toast");
  if (existingToast) {
    existingToast.remove();
  }

  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = message;
  document.body.appendChild(toast);

  toastTimer = setTimeout(() => {
    toast.remove();
  }, 2200);
}

function bindPasswordToggle(button, input, showLabel, hideLabel) {
  if (!button || !input) return;

  button.addEventListener("click", () => {
    const hidden = input.type === "password";
    input.type = hidden ? "text" : "password";
    button.setAttribute("aria-label", hidden ? hideLabel : showLabel);
  });
}

function loadUsers() {
  try {
    const data = JSON.parse(localStorage.getItem(USERS_KEY) || "[]");
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

bindPasswordToggle(togglePassword, password, "Show password", "Hide password");
bindPasswordToggle(toggleConfirmPassword, confirmPassword, "Show confirm password", "Hide confirm password");

if (loginForm) {
  loginForm.addEventListener("submit", (event) => {
    if (!loginForm.checkValidity()) {
      event.preventDefault();
      loginForm.reportValidity();
      return;
    }

    event.preventDefault();
    const loginEmail = String(username?.value || "").trim().toLowerCase();
    const loginPassword = String(password?.value || "");
    const users = loadUsers();
    const matchedUser = users.find((user) => user.email === loginEmail && user.password === loginPassword);

    if (!matchedUser) {
      showToast("Invalid credentials");
      return;
    }

    showToast("Login successful");
    setTimeout(() => {
      window.location.href = "dashboard.html";
    }, 700);
  });
}

if (registerForm) {
  registerForm.addEventListener("submit", (event) => {
    if (!registerForm.checkValidity()) {
      event.preventDefault();
      registerForm.reportValidity();
      return;
    }

    if (password && confirmPassword && password.value !== confirmPassword.value) {
      event.preventDefault();
      confirmPassword.setCustomValidity("Passwords do not match.");
      registerForm.reportValidity();
      confirmPassword.setCustomValidity("");
      return;
    }

    event.preventDefault();
    const users = loadUsers();
    const newUser = {
      fullName: String(fullName?.value || "").trim(),
      email: String(email?.value || "").trim().toLowerCase(),
      password: String(password?.value || ""),
    };

    const existingIndex = users.findIndex((user) => user.email === newUser.email);
    if (existingIndex >= 0) {
      users[existingIndex] = newUser;
    } else {
      users.push(newUser);
    }

    saveUsers(users);
    showToast("Registration successful");
  });
}
