const BASE_URL =
  "https://student-management-system-production-1ee7.up.railway.app";

//Auth helpers
const getAuthHeader = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});

// Redirect to login if no token
const token = localStorage.getItem("token");
if (!token) window.location.href = "login.html";

// Current user info (set during login and stored in localStorage)
const user = JSON.parse(localStorage.getItem("user") || "{}");
const userRole = user.role || localStorage.getItem("role");
const userId = user.id;

// show name + role in navbar
const userGreetingEl = document.getElementById("userGreeting");
const userRoleEl = document.getElementById("userRole");
if (userGreetingEl && user.name) userGreetingEl.textContent = user.name;
if (userRoleEl)
  userRoleEl.textContent = userRole === "teacher" ? " Teacher" : " Student";

// Task list heading
const headingEl = document.getElementById("taskListHeading");
if (headingEl) {
  headingEl.textContent =
    userRole === "teacher" ? "Tasks You've Assigned" : "Your Assigned Tasks";
}

// Show create form only for teachers
const createSection = document.getElementById("create");
if (createSection) {
  createSection.style.display = userRole === "teacher" ? "block" : "none";
}

//  Navigation helpers
function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  localStorage.removeItem("role");
  window.location.href = "login.html";
}

function getNotifications() {
  window.location.href = "notification.html";
}

//  Load students into dropdown (teachers only)
async function loadStudents() {
  if (userRole !== "teacher") return;

  try {
    const res = await fetch(`${BASE_URL}/api/tasks/students`, {
      headers: getAuthHeader(),
    });

    if (!res.ok) return;

    const data = await res.json();
    const select = document.getElementById("assigned_to");
    if (!select) return;

    data.students.forEach((s) => {
      const opt = document.createElement("option");
      opt.value = s.id;
      opt.textContent = `${s.name} (${s.email})`;
      select.appendChild(opt);
    });
  } catch (err) {
    console.error("Error loading students:", err);
  }
}

//  Load task list
async function loadTasks() {
  try {
    const res = await fetch(`${BASE_URL}/api/tasks`, {
      headers: getAuthHeader(),
    });

    if (!res.ok) {
      if (res.status === 401 || res.status === 403) {
        window.location.href = "login.html";
        return;
      }
      throw new Error(`HTTP ${res.status}`);
    }

    const data = await res.json();
    const tasksArray = data.tasks || [];
    const taskList = document.getElementById("taskList");
    taskList.innerHTML = "";

    if (tasksArray.length === 0) {
      taskList.innerHTML = `<li style="color:#888;padding:16px;">
        ${
          userRole === "teacher"
            ? "You haven't assigned any tasks yet."
            : "No tasks have been assigned to you yet."
        }
      </li>`;
      return;
    }

    tasksArray.forEach((task) => {
      const li = document.createElement("li");

      // Teacher sees who the task is assigned to; student sees who assigned it
      const metaLine =
        userRole === "teacher"
          ? `<small> Assigned to: <strong>${
              task.assigned_to || "Unassigned"
            }</strong></small>`
          : `<small> Set by: <strong>${
              task.created_by || "Teacher"
            }</strong></small>`;

      // Status badge colour
      const statusColour = {
        pending: "#e0a800",
        in_progress: "#1a73e8",
        completed: "#28a745",
      };
      const statusLabel = {
        pending: "Pending",
        in_progress: "In Progress",
        completed: "Completed",
      };
      const colour = statusColour[task.status] || "#888";
      const label = statusLabel[task.status] || task.status;

      // Status changer for students and teachers
      const statusChanger = `
        <select class="status-select" onchange="updateStatus('${
          task.id
        }', this.value)">
          <option value="pending"    ${
            task.status === "pending" ? "selected" : ""
          }>Pending</option>
          <option value="in_progress"${
            task.status === "in_progress" ? "selected" : ""
          }>In Progress</option>
          <option value="completed"  ${
            task.status === "completed" ? "selected" : ""
          }>Completed</option>
        </select>`;

      const deleteBtn =
        userRole === "teacher"
          ? `<button class="delete-task" onclick="deleteTask('${task.id}')" title="Delete Task">🗑️</button>`
          : "";

      li.innerHTML = `
        <div class="task-header">
          <strong>${task.title}</strong>
          <span class="priority-${task.priority}">${task.priority}</span>
          <span class="status-badge" style="background:${colour};color:#fff;padding:2px 8px;border-radius:12px;font-size:0.8em;">${label}</span>
          ${deleteBtn}
        </div>
        <div class="task-body">
          ${task.description ? `<p>${task.description}</p>` : ""}
          <small>📅 Deadline: ${task.deadline || "Not set"}</small><br/>
          ${metaLine}
        </div>
        <div class="task-actions">
          ${statusChanger}
          <button class="toggle-comments" onclick="toggleComments('${
            task.id
          }')">
            <i class="fa-solid fa-comments"></i> Comments
          </button>
        </div>
        <div class="comments-container hidden" id="comments-${task.id}">
          <div class="add-comment-inline">
            <input type="text" id="comment-input-${
              task.id
            }" placeholder="Write a comment…">
            <button onclick="addInlineComment('${task.id}')">Send</button>
          </div>
        </div>
      `;
      taskList.appendChild(li);
      loadCommentsForTask(task.id);
    });
  } catch (err) {
    console.error("Error loading tasks:", err);
    document.getElementById("taskList").innerHTML =
      "<li>Error loading tasks. Please try again.</li>";
  }
}

// Update task status
async function updateStatus(taskId, status) {
  try {
    const res = await fetch(`${BASE_URL}/api/tasks/${taskId}/status`, {
      method: "PUT",
      headers: getAuthHeader(),
      body: JSON.stringify({ status }),
    });

    if (!res.ok) {
      const data = await res.json();
      alert(data.message || "Failed to update status.");
      loadTasks(); // reset the select to server value
    }
  } catch (err) {
    console.error("Error updating status:", err);
  }
}

//  Toggle comment section
function toggleComments(taskId) {
  const container = document.getElementById(`comments-${taskId}`);
  if (container) container.classList.toggle("hidden");
}

//  Load comments for a task
async function loadCommentsForTask(taskId) {
  try {
    const res = await fetch(`${BASE_URL}/api/tasks/${taskId}/comments`, {
      headers: getAuthHeader(),
    });
    if (!res.ok) return; // silently skip — access denied tasks won't appear anyway

    const data = await res.json();
    const container = document.getElementById(`comments-${taskId}`);
    if (!container) return;

    // Remove old comment divs (keep the input row)
    container.querySelectorAll(".comment").forEach((el) => el.remove());

    const comments = data.comments || [];
    const addRow = container.querySelector(".add-comment-inline");

    comments.forEach((c) => {
      const div = document.createElement("div");
      div.className = "comment";
      const roleIcon = c.commenter_role === "teacher" ? "👩‍🏫" : "🎓";
      div.innerHTML = `<span class="comment-author">${roleIcon} ${c.commented_by}</span>: ${c.comment} <span class="comment-time">${c.created_at}</span>`;
      container.insertBefore(div, addRow);
    });
  } catch (err) {
    console.error(`Error loading comments for task ${taskId}:`, err);
  }
}

//  Add inline comment
async function addInlineComment(taskId) {
  const input = document.getElementById(`comment-input-${taskId}`);
  const comment = input.value.trim();
  if (!comment) return;

  try {
    const res = await fetch(`${BASE_URL}/api/tasks/${taskId}/comments`, {
      method: "POST",
      headers: getAuthHeader(),
      body: JSON.stringify({ comment }),
    });

    if (!res.ok) {
      const data = await res.json();
      alert(data.message || "Could not add comment.");
      if (res.status === 401 || res.status === 403)
        window.location.href = "login.html";
      return;
    }

    input.value = "";
    loadCommentsForTask(taskId);
  } catch (err) {
    console.error("Failed to add comment:", err);
    alert("Could not add comment. Please try again.");
  }
}

//  Delete task
function deleteTask(taskId) {
  if (!confirm("Are you sure you want to delete this task?")) return;

  fetch(`${BASE_URL}/api/tasks/${taskId}`, {
    method: "DELETE",
    headers: getAuthHeader(),
  })
    .then((res) => {
      if (res.ok) {
        loadTasks();
      } else if (res.status === 401 || res.status === 403) {
        window.location.href = "login.html";
      } else {
        alert("Failed to delete task.");
      }
    })
    .catch((err) => {
      console.error(err);
      alert("Error deleting task.");
    });
}

//  Create task form (teachers only)
const taskForm = document.getElementById("taskForm");
if (taskForm) {
  taskForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const assigned_to = document.getElementById("assigned_to").value;
    if (!assigned_to) {
      alert("Please select a student to assign this task to.");
      return;
    }

    const task = {
      title: document.getElementById("title").value,
      description: document.getElementById("description").value,
      priority: document.getElementById("priority").value,
      deadline: document.getElementById("deadline").value,
      assigned_to: parseInt(assigned_to, 10),
    };

    try {
      const res = await fetch(`${BASE_URL}/api/tasks`, {
        method: "POST",
        headers: getAuthHeader(),
        body: JSON.stringify(task),
      });

      if (res.ok) {
        taskForm.reset();
        document.getElementById("assigned_to").value = "";
        loadTasks();
        alert("Task created and assigned successfully!");
      } else {
        const data = await res.json();
        alert(data.message || "Failed to create task.");
      }
    } catch (err) {
      console.error("Error:", err);
      alert("Error creating task.");
    }
  });
}

//  Init
loadStudents();
loadTasks();
