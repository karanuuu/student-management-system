function showMessage(message, type) {
  const box = document.getElementById("messageBox");

  box.className = "message-box " + type;
  box.innerText = message;
  box.style.display = "block";
}

async function register() {
  const name = document.getElementById("name").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  //added inline message
  if (!name || !email || !password) {
    showMessage("Please fill all fields.", "error");
    return;
  }

  try {
    const response = await fetch("http://localhost:5000/api/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name, email, password }),
    });

    const data = await response.json();

    if (response.ok) {
      showMessage(
        "Registration successful! Redirecting to login page...",
        "success"
      );

      setTimeout(() => {
        window.location.href = "login.html";
      }, 2000);
    } else {
      showMessage(data.message || "Registration failed.", "error");
    }
  } catch (error) {
    showMessage("Server error. Please try again.", "error");
  }
}
