const passwordInput = document.getElementById("password");
const toggleCheckbox = document.getElementById("showPassword");

toggleCheckbox.addEventListener("change", () => {
  passwordInput.type = toggleCheckbox.checked ? "text" : "password";
});

// added showError replaces all alert() calls
function showError(message) {
  const errorBox = document.getElementById("error-message");
  errorBox.textContent = message;
  errorBox.style.display = "block";
}

// added hideError
function hideError() {
  const errorBox = document.getElementById("error-message");
  errorBox.style.display = "none";
  errorBox.textContent = "";
}

//login
async function login() {
  hideError();

  const email = document.getElementById("email").value.trim();
  const password = passwordInput.value.trim();
  const role = document.getElementById("role").value;

  if (!email || !password) {
    showError("Email and password are required.");
    return;
  }

  // validation
  if (!role) {
    showError("Please select a role (Student or Teacher).");
    return;
  }

  try {
    const response = await fetch(
      "https://student-management-system-production-1ee7.up.railway.app/api/auth/login",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, role }),
      }
    );

    const data = await response.json();
    console.log(data);

    if (data.token) {
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      localStorage.setItem("role", data.user.role);

      // changed to task.html (not dashboard.html)
      window.location.href = "task.html";
    } else {
      showError(data.message || "Wrong email or password.");
    }
  } catch (err) {
    console.error(err);
    showError("Server error. Try again later.");
  }
}
