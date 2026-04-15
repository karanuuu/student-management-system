let tasks = [];
let selectedTask = null;
//Added auth header helper function
const getAuthHeader = () => ({
  "Content-Type": "application/json",
  "Authorization":`Bearer ${localStorage.getItem("token")}`
});
Redirect to login if no token found
const token = localStorage.getItem("token");
if(!token){
  window.location.href = "/login.html";
}

// Page switching
function showPage(pageId) {
  document.querySelectorAll(".page").forEach(p => p.classList.add("hidden"));
  document.getElementById(pageId).classList.remove("hidden");

  // Update nav active state
  document.querySelectorAll(".nav-link").forEach(link => link.classList.remove("active"));
  if (pageId === "tasks") document.querySelector(".nav-link[href='#']").classList.add("active");
  if (pageId === "create") document.querySelectorAll(".nav-link")[1].classList.add("active");
}

// Fetch tasks from backend
async function loadTasks() {
  fetch("http://localhost:5000/api/tasks")
    .then(res => res.json())
    .then(tasks => {
      const taskList = document.getElementById("taskList");
      taskList.innerHTML = "";

      tasks.forEach(task => {
        const li = document.createElement("li");
        li.innerHTML = `
          <strong>${task.title}</strong> 
          <span class="priority-${task.priority}">(${task.priority})</span>
          <br>${task.description}
          <br><small>Deadline: ${task.deadline}</small>

          <!-- Toggle comments -->
          <button class="toggle-comments" onclick="toggleComments('${task._id}')">Show Comments</button>

          <!-- Inline comments -->
          <div class="comments-container hidden" id="comments-${task._id}">
            ${(task.comments || []).map(c => `<div class="comment">${c}</div>`).join("")}
            <div class="add-comment-inline">
              <input type="text" id="comment-input-${task._id}" placeholder="Add a comment...">
              <button onclick="addInlineComment('${task._id}')">Add</button>
            </div>
          </div>

          <!-- Delete icon -->
          <button class="delete-task" onclick="deleteTask('${task._id}')" title="Delete Task">
            🗑️
          </button>
        `;
        taskList.appendChild(li);
      });
    });
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
      deadline: document.getElementById("deadline").value
    };

    await fetch("http://localhost:5000/api/tasks", {
      method: "POST",
      headers: getAuthHeader(),
      body: JSON.stringify(task)
    });

    taskForm.reset();
    showPage("tasks");
    loadTasks(); // refresh list
  });
}

// Render Task List with inline comments
async function renderTasks() {
  const taskList = document.getElementById("taskList");
  taskList.innerHTML = "";

  for (const task of tasks) {
    const li = document.createElement("li");
    li.innerHTML = `
      <strong>${task.title}</strong> 
      <span class="priority-${task.priority}">(${task.priority})</span>
      - Due: ${task.deadline}
      <div class="comments-container" id="comments-${task.id}"></div>
      <div class="add-comment-inline">
        <input type="text" id="inlineComment-${task.id}" placeholder="Add a comment...">
        <button onclick="addInlineComment(${task.id})">Add</button>
      </div>
    `;
    taskList.appendChild(li);

    // Load comments for each task
    try{
    const res = await fetch(`http://localhost:5000/api/tasks/${task.id}/comments`, {
      headers: getAuthHeader()
    });

      if(!res.ok) throw new Error(`Error: ${res.status}`);
      
    const data = await res.json();
    const comments = data.comments;

    const commentsDiv = document.getElementById(`comments-${task.id}`);
    comments.forEach(c => {
      const p = document.createElement("p");
      p.classList.add("comment");
      p.textContent = `${c.comment} — ${c.commented_by}`;
      commentsDiv.appendChild(p);
    });
    }
    catch(err) {
      console.error(`Failed to load comments for task ${task.id}:`, err);
    }
  }
}

// Inline comment handler
async function addInlineComment(taskId) {
  const input = document.getElementById(`inlineComment-${taskId}`);
  if (!input.value.trim()) return;
  try{
    const body = {comment: input.value};

  await fetch(`http://localhost:5000/api/tasks/${taskId}/comments`, {
    method: "POST",
    headers: getAuthHeader(),
    body: JSON.stringify(body)
  });

  input.value = "";
  loadTasks(); // refresh list to show new comment
  }
  catch(err) {
    console.error("Failed to add comment:", err);
    alert("Could not add comment. Please try again.");
  }
}

// Show Task Details
async function showTaskDetails(task) {
  selectedTask = task;
  document.getElementById("detailTitle").textContent = task.title;
  document.getElementById("detailDescription").textContent = task.description;
  document.getElementById("detailDeadline").textContent = task.deadline;
  document.getElementById("detailPriority").textContent = task.priority;

  await loadComments(task.id);
  showPage("details");
}

// Load comments for details view
async function loadComments(taskId) {
  try{
  const res = await fetch(`http://localhost:5000/api/tasks/${taskId}/comments`, {
    headers: getAuthHeader()
  });
  
  if (!res.ok) throw new Error(`Error: ${res.status}`);
    const data = await res.json();
  selectedTask.comments = data.comments;
  renderComments();
  }
  catch(err){
    console.error("Failed to load comments:", err);
  }
}

function renderComments() {
  const commentsUl = document.getElementById("comments");
  commentsUl.innerHTML = "";
  selectedTask.comments.forEach(c => {
    const li = document.createElement("li");
    li.textContent = `${c.comment} — ${c.commented_by} (${c.created_at})`;
    commentsUl.appendChild(li);
  });
}
function addInlineComment(taskId) {
  const input = document.getElementById(`comment-input-${taskId}`);
  const comment = input.value.trim();
  if (!comment) return;

  fetch(`http://localhost:5000/api/tasks/${taskId}/comments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ comment })
  })
  .then(res => res.json())
  .then(updatedTask => {
    const container = document.getElementById(`comments-${taskId}`);
    const newComment = document.createElement("div");
    newComment.className = "comment";
    newComment.textContent = comment;
    container.insertBefore(newComment, container.querySelector(".add-comment-inline"));
    input.value = "";
  });
}
function deleteTask(taskId) {
  if (!confirm("Are you sure you want to delete this task?")) return;

  fetch(`http://localhost:5000/api/tasks/${taskId}`, {
    method: "DELETE"
  })
  .then(res => {
    if (res.ok) {
      loadTasks(); // refresh list after deletion
    } else {
      alert("Failed to delete task.");
    }
  })
  .catch(err => {
    console.error(err);
    alert("Error deleting task.");
  });
}


