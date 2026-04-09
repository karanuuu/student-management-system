let tasks = [];
let selectedTask = null;
//Added auth header helper function
const getAuthHeader = () => ({
  "Content-Type": "application/json",
  "Authorization":`Beare ${localStorage.getItem("token")}`
});
//Redirect to login if no token found
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
  try {
  const res = await fetch("http://localhost:5000/api/tasks", {
    headers: getAuthHeader()
  });

 if(!res.ok) throw new Error(`Error: ${res.status}`);
  const data = await res.json();
    tasks = data.tasks;
  renderTasks();
} catch(err) {
    console.error("Failed to load tasks:", err);
    alert("Could not load tasks. Please log in again.");
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
    const comments = await res.json();

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

// Initial load
loadTasks();
