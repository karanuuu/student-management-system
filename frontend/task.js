let tasks = [];
let selectedTask = null;

// Auth header helper function
const getAuthHeader = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});

// Redirect to login if no token found
const token = localStorage.getItem("token");
if (!token) {
  window.location.href = "login.html";
}

// Get user role
const user = JSON.parse(localStorage.getItem("user") || "{}");
const userRole = user.role || localStorage.getItem("role");

// Display user role
const userRoleSpan = document.getElementById("userRole");
if (userRoleSpan) {
  userRoleSpan.textContent = userRole === "teacher" ? "Teacher" : "Student";
}

// Show/hide create form based on role
const createFormSection = document.getElementById("create");
if (createFormSection) {
  createFormSection.style.display = userRole === "teacher" ? "block" : "none";
}

// Logout function
function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  localStorage.removeItem("role");
  window.location.href = "login.html";
}

// Fetch tasks from backend
async function loadTasks() {
  try {
    const response = await fetch(
      "https://student-management-system-production-1ee7.up.railway.app/api/tasks",
      {
        headers: getAuthHeader(),
      }
    );

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        window.location.href = "login.html";
        return;
      }
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    const tasksArray = data.tasks || [];

    const taskList = document.getElementById("taskList");
    taskList.innerHTML = "";

    tasksArray.forEach((task) => {
      const li = document.createElement("li");

      // Only show delete button for teachers
      const deleteButton =
        userRole === "teacher"
          ? `<button class="delete-task" onclick="deleteTask('${task.id}')" title="Delete Task">🗑️</button>`
          : "";

      li.innerHTML = `
        <strong>${task.title}</strong> 
        <span class="priority-${task.priority}">(${task.priority})</span>
        <br>${task.description || ""}
        <br><small>Deadline: ${task.deadline || "Not set"}</small>
        <br><small>Status: ${task.status || "pending"}</small>
        
        <button class="toggle-comments" onclick="toggleComments('${
          task.id
        }')">Show Comments</button>
        
        <div class="comments-container hidden" id="comments-${task.id}">
          <div class="add-comment-inline">
            <input type="text" id="comment-input-${
              task.id
            }" placeholder="Add a comment...">
            <button onclick="addInlineComment('${task.id}')">Add</button>
          </div>
        </div>
        
        ${deleteButton}
      `;
      taskList.appendChild(li);

      loadCommentsForTask(task.id);
    });
  } catch (error) {
    console.error("Error loading tasks:", error);
    document.getElementById("taskList").innerHTML =
      "<li>Error loading tasks. Please try again.</li>";
  }
}

function toggleComments(taskId) {
  const container = document.getElementById(`comments-${taskId}`);
  if (container) {
    container.classList.toggle("hidden");
  }
}

async function loadCommentsForTask(taskId) {
  try {
    const response = await fetch(
      `https://student-management-system-production-1ee7.up.railway.app/api/tasks/${taskId}/comments`,
      {
        headers: getAuthHeader(),
      }
    );

    if (!response.ok) return;

    const data = await response.json();
    const commentsContainer = document.getElementById(`comments-${taskId}`);
    if (!commentsContainer) return;

    const comments = data.comments || [];
    comments.forEach((c) => {
      const commentDiv = document.createElement("div");
      commentDiv.className = "comment";
      commentDiv.textContent = `${c.comment} — ${c.commented_by}`;
      commentsContainer.insertBefore(
        commentDiv,
        commentsContainer.querySelector(".add-comment-inline")
      );
    });
  } catch (error) {
    console.error(`Error loading comments for task ${taskId}:`, error);
  }
}

// Handle Create Task
const taskForm = document.getElementById("taskForm");
if (taskForm) {
  taskForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const task = {
      title: document.getElementById("title").value,
      description: document.getElementById("description").value,
      priority: document.getElementById("priority").value,
      deadline: document.getElementById("deadline").value,
    };

    try {
      const response = await fetch(
        "https://student-management-system-production-1ee7.up.railway.app/api/tasks",
        {
          method: "POST",
          headers: getAuthHeader(),
          body: JSON.stringify(task),
        }
      );

      if (response.ok) {
        taskForm.reset();
        loadTasks(); // Refresh the task list
        alert("Task created successfully!");
      } else {
        const data = await response.json();
        alert(data.message || "Failed to create task");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error creating task");
    }
  });
}

// Add inline comment
async function addInlineComment(taskId) {
  const input = document.getElementById(`comment-input-${taskId}`);
  const comment = input.value.trim();
  if (!comment) return;

  try {
    const response = await fetch(
      `https://student-management-system-production-1ee7.up.railway.app/api/tasks/${taskId}/comments`,
      {
        method: "POST",
        headers: getAuthHeader(),
        body: JSON.stringify({ comment }),
      }
    );

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        window.location.href = "login.html";
        return;
      }
      throw new Error(`HTTP ${response.status}`);
    }

    input.value = "";
    loadCommentsForTask(taskId); // Reload comments
  } catch (error) {
    console.error("Failed to add comment:", error);
    alert("Could not add comment. Please try again.");
  }
}

// Delete task
function deleteTask(taskId) {
  if (!confirm("Are you sure you want to delete this task?")) return;

  fetch(
    `https://student-management-system-production-1ee7.up.railway.app/api/tasks/${taskId}`,
    {
      method: "DELETE",
      headers: getAuthHeader(),
    }
  )
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

// Load tasks when page loads
loadTasks();
