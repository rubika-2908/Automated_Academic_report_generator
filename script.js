const togglePassword = document.getElementById("togglePassword");
const toggleConfirmPassword = document.getElementById("toggleConfirmPassword");
const username = document.getElementById("username");
const password = document.getElementById("password");
const confirmPassword = document.getElementById("confirmPassword");
const email = document.getElementById("email");
const fullName = document.getElementById("fullName");
const registerForm = document.getElementById("registerForm");
const loginForm = document.getElementById("loginForm");
let toastTimer;
const API_BASE_URL = "http://localhost:5000/api";

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

async function postJson(url, payload) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  let data;
  try {
    data = await response.json();
  } catch {
    data = { success: false, message: "Unexpected server response." };
  }

  if (!response.ok || data?.success === false) {
    const message = data?.message || "Request failed.";
    throw new Error(message);
  }

  return data;
}

bindPasswordToggle(togglePassword, password, "Show password", "Hide password");
bindPasswordToggle(toggleConfirmPassword, confirmPassword, "Show confirm password", "Hide confirm password");

if (loginForm) {
  loginForm.addEventListener("submit", async (event) => {
    if (!loginForm.checkValidity()) {
      event.preventDefault();
      loginForm.reportValidity();
      return;
    }

    event.preventDefault();
    const loginEmail = String(username?.value || "").trim().toLowerCase();
    const loginPassword = String(password?.value || "");

    try {
      const result = await postJson(`${API_BASE_URL}/auth/login`, {
        email: loginEmail,
        password: loginPassword,
      });

      if (result?.data?.token) {
        localStorage.setItem("academic_auth_token", result.data.token);
      }

      showToast("Login successful");
      setTimeout(() => {
        window.location.href = "dashboard.html";
      }, 700);
    } catch (error) {
      showToast(error?.message || "Invalid credentials");
    }
  });
}

if (registerForm) {
  registerForm.addEventListener("submit", async (event) => {
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
    const newUser = {
      name: String(fullName?.value || "").trim(),
      email: String(email?.value || "").trim().toLowerCase(),
      password: String(password?.value || ""),
    };

    try {
      const result = await postJson(`${API_BASE_URL}/auth/register`, newUser);
      if (result?.data?.token) {
        localStorage.setItem("academic_auth_token", result.data.token);
      }
      showToast("Registration successful");
    } catch (error) {
      showToast(error?.message || "Registration failed");
    }
  });
}
