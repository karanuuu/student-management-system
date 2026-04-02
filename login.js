const passwordInput = document.getElementById("password");
const toggleCheckbox = document.getElementById("showPassword");

toggleCheckbox.addEventListener("change", () => {
  passwordInput.type = toggleCheckbox.checked ? "text" : "password";
});

async function login() {
  const email = document.getElementById("email").value.trim();
  const password = passwordInput.value.trim();

  if (!email || !password) {
    alert("Please fill in all fields");
    return;
  }

  try {
    const response = await fetch("http://localhost:5000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();
    console.log(data);

    if (data.token) {
      localStorage.setItem("token", data.token);
      window.location.href = "dashboard.html";
    } else {
      alert(data.message || "Wrong email or password");
    }
  } catch (err) {
    console.error(err);
    alert("Server error. Try again later.");
  }
}