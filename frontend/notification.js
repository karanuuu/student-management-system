// Check login
const token = localStorage.getItem("token");

if (!token) {
  alert("Please login first");
  window.location.href = "login.html";
}

// Fetch & render notifications from backend
async function getNotifications() {
  const container = document.getElementById("notifications-container");
  container.innerHTML = "<p>Loading...</p>";

  try {
    const response = await fetch(
      "https://student-management-system-production-1ee7.up.railway.app/api/notifications",
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (response.status === 401 || response.status === 403) {
      alert("Session expired. Please login again.");
      localStorage.removeItem("token");
      window.location.href = "login.html";
      return;
    }

    if (!response.ok) {
      throw new Error("Failed to fetch notifications");
    }

    const data = await response.json();
    const notifications = data.notifications;

    container.innerHTML = "";

    if (!notifications || notifications.length === 0) {
      container.innerHTML = "<p>No notifications yet 🔕</p>";
      return;
    }

    notifications.forEach((note) => {
      const div = document.createElement("div");
      div.classList.add("notification");
      div.innerHTML = `
        <div class="icon">${note.icon}</div>
        <div class="text">${note.text}</div>
      `;
      container.appendChild(div);
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    container.innerHTML =
      "<p>Failed to load notifications. Please try again.</p>";
  }
}

// Logout
function logout() {
  localStorage.removeItem("token");
  window.location.href = "login.html";
}

// wait for html to fully load before running
document.addEventListener("DOMContentLoaded", () => {
  getNotifications();
});
