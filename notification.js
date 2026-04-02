// Check login
const token = localStorage.getItem("token");

if (!token) {
  alert("Please login first");
  window.location.href = "login.html";
}

// Notifications
function getNotifications() {
  const container = document.getElementById("notifications-container");

  const notifications = [
    { icon: "📌", text: "You have been assigned a new task" },
    { icon: "💬", text: "Someone commented on your task" },
    { icon: "⏰", text: "A task deadline is approaching" }
  ];

  container.innerHTML = "";

  if (notifications.length === 0) {
    container.innerHTML = "<p>No notifications yet 🔕</p>";
    return;
  }

  notifications.forEach(note => {
    const div = document.createElement("div");
    div.classList.add("notification");

    div.innerHTML = `
      <div class="icon">${note.icon}</div>
      <div class="text">${note.text}</div>
    `;

    container.appendChild(div);
  });
}

// Logout
function logout() {
  localStorage.removeItem("token");
  window.location.href = "login.html";
}

// Load
getNotifications();