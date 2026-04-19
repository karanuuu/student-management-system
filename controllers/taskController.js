const db = require("../config/db");

const formatDate = (dateStr) => {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  return date.toLocaleString("en-KE", {
    timeZone: "Africa/Nairobi",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

const formatDeadline = (dateStr) => {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-KE", {
    timeZone: "Africa/Nairobi",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

// CREATE A TASK
// POST /api/tasks
const createTask = async (req, res) => {
  try {
    const { title, description, priority, deadline, assigned_to } = req.body;
    const created_by = req.user.id;

    if (!title) {
      return res.status(400).json({ message: "Title is required." });
    }

    if (!["Low", "Medium", "High"].includes(priority)) {
      return res
        .status(400)
        .json({ message: "Priority must be low, medium or high." });
    }

    const [result] = await db.query(
      `INSERT INTO tasks (title, description, priority, deadline, assigned_to, created_by)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [title, description, priority, deadline, assigned_to, created_by]
    );

    res.status(201).json({
      message: "Task created successfully.",
      task_id: result.insertId,
    });
  } catch (error) {
    console.error("Create task error:", error);
    res.status(500).json({ message: "Server error while creating task." });
  }
};

//GET ALL TASKS
// GET /api/tasks

const getAllTasks = async (req, res) => {
  try {
    const [tasks] = await db.query(
      `SELECT 
          t.id,
          t.title,
          t.description,
          t.status,
          t.priority,
          t.deadline,
          t.created_at,
          creator.name AS created_by,
          assignee.name AS assigned_to
       FROM tasks t
       LEFT JOIN users creator ON t.created_by = creator.id
       LEFT JOIN users assignee ON t.assigned_to = assignee.id
       ORDER BY t.created_at DESC`
    );

    res.status(200).json({
      total: tasks.length,
      tasks: tasks.map((task) => ({
        ...task,
        deadline: formatDeadline(task.deadline),
        created_at: formatDate(task.created_at),
      })),
    });
  } catch (error) {
    console.error("Get all tasks error:", error);
    res.status(500).json({ message: "Server error while fetching tasks." });
  }
};

//GET SINGLE TASK
// GET /api/tasks/:id
const getTask = async (req, res) => {
  try {
    const { id } = req.params;

    const [tasks] = await db.query(
      `SELECT 
          t.id,
          t.title,
          t.description,
          t.status,
          t.priority,
          t.deadline,
          t.created_at,
          creator.name AS created_by,
          assignee.name AS assigned_to
       FROM tasks t
       LEFT JOIN users creator ON t.created_by = creator.id
       LEFT JOIN users assignee ON t.assigned_to = assignee.id
       WHERE t.id = ?`,
      [id]
    );

    if (tasks.length === 0) {
      return res.status(404).json({ message: "Task not found." });
    }

    const task = tasks[0];
    res.status(200).json({
      ...task,
      deadline: formatDeadline(task.deadline),
      created_at: formatDate(task.created_at),
    });
  } catch (error) {
    console.error("Get task error:", error);
    res.status(500).json({ message: "Server error while fetching task." });
  }
};

//UPDATE TASK
// PUT /api/tasks/:id
const updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, priority, deadline } = req.body;

    const [tasks] = await db.query("SELECT id FROM tasks WHERE id = ?", [id]);

    if (tasks.length === 0) {
      return res.status(404).json({ message: "Task not found." });
    }

    await db.query(
      `UPDATE tasks 
       SET title = ?, description = ?, priority = ?, deadline = ?
       WHERE id = ?`,
      [title, description, priority, deadline, id]
    );

    res.status(200).json({ message: "Task updated successfully." });
  } catch (error) {
    console.error("Update task error:", error);
    res.status(500).json({ message: "Server error while updating task." });
  }
};

//UPDATE TASK STATUS
// PUT /api/tasks/:id/status
const updateTaskStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["pending", "in_progress", "completed"].includes(status)) {
      return res
        .status(400)
        .json({ message: "Status must be pending, in_progress or completed." });
    }

    const [tasks] = await db.query("SELECT id FROM tasks WHERE id = ?", [id]);

    if (tasks.length === 0) {
      return res.status(404).json({ message: "Task not found." });
    }

    await db.query("UPDATE tasks SET status = ? WHERE id = ?", [status, id]);

    res.status(200).json({ message: "Task status updated successfully." });
  } catch (error) {
    console.error("Update status error:", error);
    res
      .status(500)
      .json({ message: "Server error while updating task status." });
  }
};

//DELETE TASK
// DELETE /api/tasks/:id
const deleteTask = async (req, res) => {
  try {
    const { id } = req.params;

    const [tasks] = await db.query("SELECT id FROM tasks WHERE id = ?", [id]);

    if (tasks.length === 0) {
      return res.status(404).json({ message: "Task not found." });
    }

    await db.query("DELETE FROM tasks WHERE id = ?", [id]);

    res.status(200).json({ message: "Task deleted successfully." });
  } catch (error) {
    console.error("Delete task error:", error);
    res.status(500).json({ message: "Server error while deleting task." });
  }
};

// ASSIGN TASK
// POST /api/tasks/:id/assign
const assignTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { assigned_to } = req.body;

    if (!assigned_to) {
      return res
        .status(400)
        .json({ message: "assigned_to (user id) is required." });
    }

    const [tasks] = await db.query("SELECT id FROM tasks WHERE id = ?", [id]);

    if (tasks.length === 0) {
      return res.status(404).json({ message: "Task not found." });
    }

    const [users] = await db.query("SELECT id FROM users WHERE id = ?", [
      assigned_to,
    ]);

    if (users.length === 0) {
      return res.status(404).json({ message: "User not found." });
    }

    await db.query("UPDATE tasks SET assigned_to = ? WHERE id = ?", [
      assigned_to,
      id,
    ]);

    res.status(200).json({ message: "Task assigned successfully." });
  } catch (error) {
    console.error("Assign task error:", error);
    res.status(500).json({ message: "Server error while assigning task." });
  }
};

// ADD COMMENT
// POST /api/tasks/:id/comments
const addComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { comment } = req.body;
    const user_id = req.user.id;

    if (!comment) {
      return res.status(400).json({ message: "Comment text is required." });
    }

    const [tasks] = await db.query("SELECT id FROM tasks WHERE id = ?", [id]);

    if (tasks.length === 0) {
      return res.status(404).json({ message: "Task not found." });
    }

    const [result] = await db.query(
      "INSERT INTO comments (task_id, user_id, comment) VALUES (?, ?, ?)",
      [id, user_id, comment]
    );

    res.status(201).json({
      message: "Comment added successfully.",
      comment_id: result.insertId,
    });
  } catch (error) {
    console.error("Add comment error:", error);
    res.status(500).json({ message: "Server error while adding comment." });
  }
};

//GET COMMENTS
// GET /api/tasks/:id/comments
const getComments = async (req, res) => {
  try {
    const { id } = req.params;

    const [tasks] = await db.query("SELECT id FROM tasks WHERE id = ?", [id]);

    if (tasks.length === 0) {
      return res.status(404).json({ message: "Task not found." });
    }

    const [comments] = await db.query(
      `SELECT 
          c.id,
          c.comment,
          c.created_at,
          u.name AS commented_by
       FROM comments c
       JOIN users u ON c.user_id = u.id
       WHERE c.task_id = ?
       ORDER BY c.created_at ASC`,
      [id]
    );

    res.status(200).json({
      task_id: id,
      total_comments: comments.length,
      comments: comments.map((comment) => ({
        ...comment,
        created_at: formatDate(comment.created_at),
      })),
    });
  } catch (error) {
    console.error("Get comments error:", error);
    res.status(500).json({ message: "Server error while fetching comments." });
  }
};

module.exports = {
  createTask,
  getAllTasks,
  getTask,
  updateTask,
  updateTaskStatus,
  deleteTask,
  assignTask,
  addComment,
  getComments,
};
