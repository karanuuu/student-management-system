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

// Handle Create Task
const taskForm = document.getElementById("taskForm");
if (taskForm) {
  taskForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const task = {
      id: tasks.length + 1,
      title: document.getElementById("title").value,
      description: document.getElementById("description").value,
      priority: document.getElementById("priority").value,
      deadline: document.getElementById("deadline").value,
      comments: []
    };
    tasks.push(task);
    renderTasks();
    taskForm.reset();
    showPage("tasks");
  });
}

// Render Task List
function renderTasks() {
  const taskList = document.getElementById("taskList");
  taskList.innerHTML = "";
  tasks.forEach(task => {
    const li = document.createElement("li");
    li.innerHTML = `
      <strong>${task.title}</strong> 
      <span class="priority-${task.priority}">(${task.priority})</span>
      - Due: ${task.deadline}
    `;
    li.addEventListener("click", () => showTaskDetails(task));
    taskList.appendChild(li);
  });
}

// Show Task Details
function showTaskDetails(task) {
  selectedTask = task;
  document.getElementById("detailTitle").textContent = task.title;
  document.getElementById("detailDescription").textContent = task.description;
  document.getElementById("detailDeadline").textContent = task.deadline;
  document.getElementById("detailPriority").textContent = task.priority;
  renderComments();
  showPage("details");
}

// Render Comments
function renderComments() {
  const commentsUl = document.getElementById("comments");
  commentsUl.innerHTML = "";
  selectedTask.comments.forEach(c => {
    const li = document.createElement("li");
    li.textContent = `${c.text} — ${c.author} (${c.timestamp})`;
    commentsUl.appendChild(li);
  });
}

// Add Comment
const addCommentBtn = document.getElementById("addComment");
if (addCommentBtn) {
  addCommentBtn.addEventListener("click", () => {
    const newCommentInput = document.getElementById("newComment");
    if (!newCommentInput.value.trim()) return;
    const comment = {
      text: newCommentInput.value,
      author: "Student",
      timestamp: new Date().toLocaleString()
    };
    selectedTask.comments.push(comment);
    newCommentInput.value = "";
    renderComments();
  });
}