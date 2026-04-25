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

// CREATE A TASK — Teachers only, must assign to a student
const createTask = async (req, res) => {
  try {
    if (req.user.role !== "teacher") {
      return res
        .status(403)
        .json({ message: "Only teachers can create tasks." });
    }

    const { title, description, priority, deadline, assigned_to } = req.body;
    const created_by = req.user.id;

    if (!title) return res.status(400).json({ message: "Title is required." });
    if (!["Low", "Medium", "High"].includes(priority))
      return res
        .status(400)
        .json({ message: "Priority must be Low, Medium or High." });
    if (!assigned_to)
      return res
        .status(400)
        .json({ message: "You must assign this task to a student." });

    const [users] = await db.query("SELECT id, role FROM users WHERE id = ?", [
      assigned_to,
    ]);
    if (users.length === 0)
      return res.status(404).json({ message: "Assigned user not found." });
    if (users[0].role !== "student")
      return res
        .status(400)
        .json({ message: "Tasks can only be assigned to students." });

    const [result] = await db.query(
      `INSERT INTO tasks (title, description, priority, deadline, assigned_to, created_by)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [title, description, priority, deadline, assigned_to, created_by]
    );

    res.status(201).json({
      message: "Task created and assigned successfully.",
      task_id: result.insertId,
    });
  } catch (error) {
    console.error("Create task error:", error);
    res.status(500).json({ message: "Server error while creating task." });
  }
};

// GET TASKS — Teachers see their own tasks; students see only their assigned tasks
const getAllTasks = async (req, res) => {
  try {
    let tasks;

    if (req.user.role === "teacher") {
      [tasks] = await db.query(
        `SELECT t.id, t.title, t.description, t.status, t.priority, t.deadline, t.created_at,
                creator.name AS created_by, assignee.name AS assigned_to, t.assigned_to AS assigned_to_id
         FROM tasks t
         LEFT JOIN users creator ON t.created_by = creator.id
         LEFT JOIN users assignee ON t.assigned_to = assignee.id
         WHERE t.created_by = ?
         ORDER BY t.created_at DESC`,
        [req.user.id]
      );
    } else {
      [tasks] = await db.query(
        `SELECT t.id, t.title, t.description, t.status, t.priority, t.deadline, t.created_at,
                creator.name AS created_by, assignee.name AS assigned_to
         FROM tasks t
         LEFT JOIN users creator ON t.created_by = creator.id
         LEFT JOIN users assignee ON t.assigned_to = assignee.id
         WHERE t.assigned_to = ?
         ORDER BY t.created_at DESC`,
        [req.user.id]
      );
    }

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

// GET SINGLE TASK — with access control
const getTask = async (req, res) => {
  try {
    const { id } = req.params;

    const [tasks] = await db.query(
      `SELECT t.id, t.title, t.description, t.status, t.priority, t.deadline, t.created_at,
              t.assigned_to, t.created_by,
              creator.name AS created_by_name, assignee.name AS assigned_to_name
       FROM tasks t
       LEFT JOIN users creator ON t.created_by = creator.id
       LEFT JOIN users assignee ON t.assigned_to = assignee.id
       WHERE t.id = ?`,
      [id]
    );

    if (tasks.length === 0)
      return res.status(404).json({ message: "Task not found." });

    const task = tasks[0];
    if (req.user.role === "teacher" && task.created_by !== req.user.id)
      return res.status(403).json({ message: "Access denied." });
    if (req.user.role === "student" && task.assigned_to !== req.user.id)
      return res
        .status(403)
        .json({ message: "Access denied. This task is not assigned to you." });

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

// UPDATE TASK — Teachers only, own tasks
const updateTask = async (req, res) => {
  try {
    if (req.user.role !== "teacher")
      return res
        .status(403)
        .json({ message: "Only teachers can update tasks." });

    const { id } = req.params;
    const { title, description, priority, deadline } = req.body;

    const [tasks] = await db.query(
      "SELECT id, created_by FROM tasks WHERE id = ?",
      [id]
    );
    if (tasks.length === 0)
      return res.status(404).json({ message: "Task not found." });
    if (tasks[0].created_by !== req.user.id)
      return res
        .status(403)
        .json({ message: "You can only edit tasks you created." });

    await db.query(
      `UPDATE tasks SET title = ?, description = ?, priority = ?, deadline = ? WHERE id = ?`,
      [title, description, priority, deadline, id]
    );

    res.status(200).json({ message: "Task updated successfully." });
  } catch (error) {
    console.error("Update task error:", error);
    res.status(500).json({ message: "Server error while updating task." });
  }
};

// UPDATE TASK STATUS — students update their own and teachers update their own
const updateTaskStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["pending", "in_progress", "completed"].includes(status))
      return res
        .status(400)
        .json({ message: "Status must be pending, in_progress or completed." });

    const [tasks] = await db.query(
      "SELECT id, assigned_to, created_by FROM tasks WHERE id = ?",
      [id]
    );
    if (tasks.length === 0)
      return res.status(404).json({ message: "Task not found." });

    const task = tasks[0];
    if (req.user.role === "student" && task.assigned_to !== req.user.id)
      return res.status(403).json({
        message: "You can only update status of tasks assigned to you.",
      });
    if (req.user.role === "teacher" && task.created_by !== req.user.id)
      return res
        .status(403)
        .json({ message: "You can only update tasks you created." });

    await db.query("UPDATE tasks SET status = ? WHERE id = ?", [status, id]);

    // Fix : when marked completed, write a timestamped row into the
    // notifications table so we have an accurate completion time without
    // needing a new database column.
    if (status === "completed") {
      // Fetch full task info for a meaningful message
      const [rows] = await db.query(
        `SELECT t.title, u.name AS student_name
         FROM tasks t
         LEFT JOIN users u ON t.assigned_to = u.id
         WHERE t.id = ?`,
        [id]
      );
      const taskTitle = rows[0]?.title || "Task";
      const studentName = rows[0]?.student_name || "Student";

      // Notify the teacher that the student completed it
      if (task.created_by) {
        await db.query(
          "INSERT INTO notifications (user_id, message) VALUES (?, ?)",
          [
            task.created_by,
            `COMPLETED::${id}::${studentName} completed "${taskTitle}"`,
          ]
        );
      }
      // Notify the student themselves (used to get accurate completion time)
      if (task.assigned_to) {
        await db.query(
          "INSERT INTO notifications (user_id, message) VALUES (?, ?)",
          [task.assigned_to, `COMPLETED::${id}::You completed "${taskTitle}"`]
        );
      }
    }

    res.status(200).json({ message: "Task status updated successfully." });
  } catch (error) {
    console.error("Update status error:", error);
    res
      .status(500)
      .json({ message: "Server error while updating task status." });
  }
};

// DELETE TASK — Teachers only, own tasks
const deleteTask = async (req, res) => {
  try {
    if (req.user.role !== "teacher")
      return res
        .status(403)
        .json({ message: "Only teachers can delete tasks." });

    const { id } = req.params;
    const [tasks] = await db.query(
      "SELECT id, created_by FROM tasks WHERE id = ?",
      [id]
    );
    if (tasks.length === 0)
      return res.status(404).json({ message: "Task not found." });
    if (tasks[0].created_by !== req.user.id)
      return res
        .status(403)
        .json({ message: "You can only delete tasks you created." });

    // Delete child rows first to satisfy FK constraints
    await db.query("DELETE FROM comments WHERE task_id = ?", [id]);
    await db.query(
      "DELETE FROM notifications WHERE message LIKE CONCAT('COMPLETED::', ?, '::%')",
      [id]
    );
    await db.query("DELETE FROM tasks WHERE id = ?", [id]);
    res.status(200).json({ message: "Task deleted successfully." });
  } catch (error) {
    console.error("Delete task error:", error);
    res.status(500).json({ message: "Server error while deleting task." });
  }
};

// REASSIGN TASK — Teachers only, own tasks, to students only
const assignTask = async (req, res) => {
  try {
    if (req.user.role !== "teacher")
      return res
        .status(403)
        .json({ message: "Only teachers can assign tasks." });

    const { id } = req.params;
    const { assigned_to } = req.body;

    if (!assigned_to)
      return res
        .status(400)
        .json({ message: "assigned_to (user id) is required." });

    const [tasks] = await db.query(
      "SELECT id, created_by FROM tasks WHERE id = ?",
      [id]
    );
    if (tasks.length === 0)
      return res.status(404).json({ message: "Task not found." });
    if (tasks[0].created_by !== req.user.id)
      return res
        .status(403)
        .json({ message: "You can only reassign tasks you created." });

    const [users] = await db.query("SELECT id, role FROM users WHERE id = ?", [
      assigned_to,
    ]);
    if (users.length === 0)
      return res.status(404).json({ message: "User not found." });
    if (users[0].role !== "student")
      return res
        .status(400)
        .json({ message: "Tasks can only be assigned to students." });

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

// ADD COMMENT — only assigned student OR creating teacher
const addComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { comment } = req.body;
    const user_id = req.user.id;

    if (!comment)
      return res.status(400).json({ message: "Comment text is required." });

    const [tasks] = await db.query(
      "SELECT id, assigned_to, created_by FROM tasks WHERE id = ?",
      [id]
    );
    if (tasks.length === 0)
      return res.status(404).json({ message: "Task not found." });

    const task = tasks[0];
    const isAssignedStudent =
      req.user.role === "student" && task.assigned_to === user_id;
    const isCreatingTeacher =
      req.user.role === "teacher" && task.created_by === user_id;

    if (!isAssignedStudent && !isCreatingTeacher)
      return res
        .status(403)
        .json({ message: "You are not authorised to comment on this task." });

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

// GET COMMENTS — only assigned student OR creating teacher
const getComments = async (req, res) => {
  try {
    const { id } = req.params;

    const [tasks] = await db.query(
      "SELECT id, assigned_to, created_by FROM tasks WHERE id = ?",
      [id]
    );
    if (tasks.length === 0)
      return res.status(404).json({ message: "Task not found." });

    const task = tasks[0];
    const isAssignedStudent =
      req.user.role === "student" && task.assigned_to === req.user.id;
    const isCreatingTeacher =
      req.user.role === "teacher" && task.created_by === req.user.id;

    if (!isAssignedStudent && !isCreatingTeacher)
      return res.status(403).json({
        message: "You are not authorised to view comments on this task.",
      });

    const [comments] = await db.query(
      `SELECT c.id, c.comment, c.created_at, u.name AS commented_by, u.role AS commenter_role
       FROM comments c
       JOIN users u ON c.user_id = u.id
       WHERE c.task_id = ?
       ORDER BY c.created_at ASC`,
      [id]
    );

    res.status(200).json({
      task_id: id,
      total_comments: comments.length,
      comments: comments.map((c) => ({
        ...c,
        created_at: formatDate(c.created_at),
      })),
    });
  } catch (error) {
    console.error("Get comments error:", error);
    res.status(500).json({ message: "Server error while fetching comments." });
  }
};

// GET STUDENTS — for teacher's assign dropdown
const getStudents = async (req, res) => {
  try {
    if (req.user.role !== "teacher")
      return res
        .status(403)
        .json({ message: "Only teachers can access this." });

    const [students] = await db.query(
      "SELECT id, name, email FROM users WHERE role = ? ORDER BY name ASC",
      ["student"]
    );

    res.status(200).json({ students });
  } catch (error) {
    console.error("Get students error:", error);
    res.status(500).json({ message: "Server error while fetching students." });
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
  getStudents,
};
