let tasks = [];
let selectedTask = null;

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

          <!-- Inline comments -->
          <div class="comments-container" id="comments-${task._id}">
            ${(task.comments || []).map(c => `<div class="comment">${c}</div>`).join("")}
            <div class="add-comment-inline">
              <input type="text" id="comment-input-${task._id}" placeholder="Add a comment...">
              <button onclick="addInlineComment('${task._id}')">Add</button>
            </div>
          </div>
        `;
        li.onclick = () => showDetails(task._id);
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
      headers: { "Content-Type": "application/json" },
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
    const res = await fetch(`http://localhost:5000/api/tasks/${task.id}/comments`);
    const comments = await res.json();

    const commentsDiv = document.getElementById(`comments-${task.id}`);
    comments.forEach(c => {
      const p = document.createElement("p");
      p.classList.add("comment");
      p.textContent = `${c.text} — ${c.author}`;
      commentsDiv.appendChild(p);
    });
  }
}

// Inline comment handler
async function addInlineComment(taskId) {
  const input = document.getElementById(`inlineComment-${taskId}`);
  if (!input.value.trim()) return;

  const comment = {
    text: input.value,
    author: "Student"
  };

  await fetch(`http://localhost:5000/api/tasks/${taskId}/comments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(comment)
  });

  input.value = "";
  loadTasks(); // refresh list to show new comment
}

// Show Task Details (still available if needed)
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
  const res = await fetch(`http://localhost:5000/api/tasks/${taskId}/comments`);
  selectedTask.comments = await res.json();
  renderComments();
}

function renderComments() {
  const commentsUl = document.getElementById("comments");
  commentsUl.innerHTML = "";
  selectedTask.comments.forEach(c => {
    const li = document.createElement("li");
    li.textContent = `${c.text} — ${c.author} (${c.timestamp})`;
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

// Initial load
loadTasks();