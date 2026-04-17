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

async function login() {
  hideError(); // clear any previous error before new attempt

  const email = document.getElementById("email").value.trim();
  const password = passwordInput.value.trim();

  if (!email || !password) {
    // changed, now shows styled inline error box
    showError("Username and password are required.");
    return;
  }

  try {
    const response = await fetch("http://localhost:5000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();
    console.log(data);

    if (data.token) {
      localStorage.setItem("token", data.token);
      window.location.href = "dashboard.html";
    } else {
      // changed, now shows styled inline error box
      showError(data.message || "Wrong email or password.");
    }
  } catch (err) {
    console.error(err);
    // changed, now shows styled inline error box
    showError("Server error. Try again later.");
  }
}
