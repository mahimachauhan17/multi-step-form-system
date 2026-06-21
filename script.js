/* ============================================================
   Multi-Step Form: navigation, validation, localStorage persistence
   ============================================================ */

const STORAGE_KEY = "multiStepFormData";
const TOTAL_STEPS = 4;

const form = document.getElementById("multiStepForm");
const stepperEl = document.getElementById("stepper");
const backBtn = document.getElementById("backBtn");
const nextBtn = document.getElementById("nextBtn");
const submitBtn = document.getElementById("submitBtn");
const successMessage = document.getElementById("successMessage");
const restartBtn = document.getElementById("restartBtn");
const reviewList = document.getElementById("reviewList");

let currentStep = 1;
let highestStepReached = 1;

const FIELD_LABELS = {
  firstName: "First name",
  lastName: "Last name",
  email: "Email",
  phone: "Phone",
  street: "Street address",
  city: "City",
  state: "State",
  zip: "PIN / ZIP code",
  username: "Username",
  password: "Password",
};

/* ---------- Validation rules ---------- */
// Each validator returns an error string, or "" if valid.
const validators = {
  firstName: (v) => (v.trim() ? "" : "First name is required."),
  lastName: (v) => (v.trim() ? "" : "Last name is required."),
  email: (v) => {
    if (!v.trim()) return "Email is required.";
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(v) ? "" : "Enter a valid email address.";
  },
  phone: (v) => {
    if (!v.trim()) return "Phone number is required.";
    const digits = v.replace(/\D/g, "");
    return digits.length >= 10 ? "" : "Enter a valid phone number (10+ digits).";
  },
  street: (v) => (v.trim() ? "" : "Street address is required."),
  city: (v) => (v.trim() ? "" : "City is required."),
  state: (v) => (v.trim() ? "" : "State is required."),
  zip: (v) => (/^\d{4,10}$/.test(v.trim()) ? "" : "Enter a valid PIN/ZIP code."),
  username: (v) => (v.trim().length >= 3 ? "" : "Username must be at least 3 characters."),
  password: (v) => {
    if (v.length < 8) return "Password must be at least 8 characters.";
    if (!/\d/.test(v)) return "Password must include at least one number.";
    return "";
  },
  confirmPassword: (v) => {
    const pw = document.getElementById("password").value;
    return v === pw ? "" : "Passwords do not match.";
  },
  confirmAccurate: (v) => (v ? "" : "Please confirm your information is accurate."),
};

const STEP_FIELDS = {
  1: ["firstName", "lastName", "email", "phone"],
  2: ["street", "city", "state", "zip"],
  3: ["username", "password", "confirmPassword"],
  4: ["confirmAccurate"],
};

/* ---------- Persistence ---------- */
function saveToStorage() {
  const data = {};
  const fields = document.querySelectorAll("input");
  fields.forEach((input) => {
    if (input.type === "checkbox") {
      data[input.name] = input.checked;
    } else if (input.type !== "password") {
      // Passwords are not persisted to localStorage for security.
      data[input.name] = input.value;
    }
  });
  data._currentStep = currentStep;
  data._highestStepReached = highestStepReached;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function loadFromStorage() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return;
  try {
    const data = JSON.parse(raw);
    Object.keys(data).forEach((key) => {
      const input = form.elements[key];
      if (!input) return;
      if (input.type === "checkbox") {
        input.checked = !!data[key];
      } else {
        input.value = data[key];
      }
    });
    currentStep = data._currentStep || 1;
    highestStepReached = data._highestStepReached || 1;
  } catch (e) {
    console.warn("Could not parse saved form data.", e);
  }
}

function clearStorage() {
  localStorage.removeItem(STORAGE_KEY);
}

/* ---------- Validation UI ---------- */
function showError(fieldName, message) {
  const errorEl = document.querySelector(`.error-msg[data-for="${fieldName}"]`);
  const input = document.getElementById(fieldName);
  if (errorEl) errorEl.textContent = message;
  if (input) input.classList.toggle("invalid", !!message);
}

function validateField(fieldName) {
  const input = document.getElementById(fieldName);
  if (!input) return true;
  const value = input.type === "checkbox" ? input.checked : input.value;
  const validator = validators[fieldName];
  const message = validator ? validator(value) : "";
  showError(fieldName, message);
  return !message;
}

function validateStep(step) {
  const fields = STEP_FIELDS[step] || [];
  let allValid = true;
  fields.forEach((fieldName) => {
    if (!validateField(fieldName)) allValid = false;
  });
  return allValid;
}

/* ---------- Step rendering ---------- */
function renderStep() {
  document.querySelectorAll(".form-step").forEach((section) => {
    section.classList.toggle("active", Number(section.dataset.step) === currentStep);
  });

  document.querySelectorAll(".step").forEach((stepEl) => {
    const stepNum = Number(stepEl.dataset.step);
    stepEl.classList.toggle("active", stepNum === currentStep);
    stepEl.classList.toggle("completed", stepNum < currentStep || (stepNum <= highestStepReached && stepNum !== currentStep));
  });

  backBtn.disabled = currentStep === 1;
  nextBtn.hidden = currentStep === TOTAL_STEPS;
  submitBtn.hidden = currentStep !== TOTAL_STEPS;

  if (currentStep === TOTAL_STEPS) renderReview();
}

function renderReview() {
  reviewList.innerHTML = "";
  Object.keys(FIELD_LABELS).forEach((name) => {
    const input = document.getElementById(name);
    if (!input) return;
    const value = name === "password" ? "•".repeat(input.value.length || 0) : input.value;
    const row = document.createElement("div");
    row.innerHTML = `<dt>${FIELD_LABELS[name]}</dt><dd>${value || "—"}</dd>`;
    reviewList.appendChild(row);
  });
}

/* ---------- Navigation ---------- */
nextBtn.addEventListener("click", () => {
  if (!validateStep(currentStep)) return;
  currentStep = Math.min(currentStep + 1, TOTAL_STEPS);
  highestStepReached = Math.max(highestStepReached, currentStep);
  saveToStorage();
  renderStep();
});

backBtn.addEventListener("click", () => {
  currentStep = Math.max(currentStep - 1, 1);
  saveToStorage();
  renderStep();
});

stepperEl.addEventListener("click", (e) => {
  const stepEl = e.target.closest(".step");
  if (!stepEl) return;
  const targetStep = Number(stepEl.dataset.step);
  // Only allow jumping to a previously completed step (no skipping ahead unvalidated).
  if (targetStep <= highestStepReached) {
    currentStep = targetStep;
    renderStep();
  }
});

/* ---------- Live validation while typing ---------- */
form.addEventListener("input", (e) => {
  if (validators[e.target.name]) validateField(e.target.name);
  saveToStorage();
});

/* ---------- Submit ---------- */
form.addEventListener("submit", (e) => {
  e.preventDefault();
  if (!validateStep(currentStep)) return;

  // In a real app, send data to a server here.
  form.hidden = true;
  stepperEl.hidden = true;
  successMessage.hidden = false;
  clearStorage();
});

restartBtn.addEventListener("click", () => {
  form.reset();
  form.hidden = false;
  stepperEl.hidden = false;
  successMessage.hidden = true;
  currentStep = 1;
  highestStepReached = 1;
  document.querySelectorAll(".error-msg").forEach((el) => (el.textContent = ""));
  document.querySelectorAll("input.invalid").forEach((el) => el.classList.remove("invalid"));
  clearStorage();
  renderStep();
});

/* ---------- Init ---------- */
loadFromStorage();
renderStep();
