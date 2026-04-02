const API = "http://localhost:5000/api";

// Get token
const token = localStorage.getItem("token");

// Redirect if not logged in

if (!token) {
  alert("Please login first");
  window.location.href = "login.html";
}

// Fetch and display tasks
async function getTasks() {
  try {
    const response = await fetch(`${API}/tasks`, {
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    const tasks = await response.json();
    const container = document.getElementById("tasks-container");

    // Clear previous content
    container.innerHTML = "";

    // If no tasks
    if (tasks.length === 0) {
      container.innerHTML = "<p>No tasks assigned yet 📭</p>";
      return;
    }

    // Display tasks
    tasks.forEach(task => {
      const div = document.createElement("div");
      div.classList.add("task");

      // Priority color logic
      let priorityColor = "black";
      if (task.priority === "High") priorityColor = "red";
      else if (task.priority === "Medium") priorityColor = "orange";
      else if (task.priority === "Low") priorityColor = "green";

      // Format deadline date
      const formattedDate = new Date(task.deadline).toLocaleDateString();

      div.innerHTML = `
        <h3>${task.title}</h3>
        <p><strong>Priority:</strong> 
          <span style="color:${priorityColor}; font-weight:bold;">
            ${task.priority}
          </span>
        </p>
        <p><strong>Deadline:</strong> ${formattedDate}</p>
      `;

      container.appendChild(div);
    });

  } catch (error) {
    console.error(error);
    alert("Error loading tasks");
  }
}

// Logout function
function logout() {
  localStorage.removeItem("token");
  window.location.href = "login.html";
}

// Load tasks when page loads
getTasks();

function goToNotifications() {
  window.location.href = "notifications.html";
}