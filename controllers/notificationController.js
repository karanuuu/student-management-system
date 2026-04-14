const db = require("../config/db");

// Format date → 4/13/2026
const formatDate = (dateStr) => {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "Africa/Nairobi",
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).format(new Date(dateStr));
};

// Format time → 8:00pm
const formatTime = (dateStr) => {
  const time = new Intl.DateTimeFormat("en-US", {
    timeZone: "Africa/Nairobi",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(dateStr));

  return time.replace(" ", "").toLowerCase();
};

const getNotifications = async (req, res) => {
  try {
    const user = req.user;
    let notifications = [];

    // ===================== STUDENT =====================
    if (user.role === "student") {
      const [tasks] = await db.query(
        `SELECT id, title, created_at, deadline, status
         FROM tasks
         WHERE assigned_to = ?
         ORDER BY created_at DESC`,
        [user.id]
      );

      tasks.forEach((t) => {
        // Task assigned
        notifications.push({
          icon: "📌",
          type: "assign",
          text: `Task assigned: ${t.title}`,
          time: `${formatDate(t.created_at)} ${formatTime(t.created_at)}`,
          rawTime: t.created_at,
        });

        // Completed task
        if (t.status === "completed") {
          notifications.push({
            icon: "✅",
            type: "done",
            text: `You completed: ${t.title}`,
            time: `${formatDate(t.created_at)} ${formatTime(t.created_at)}`,
            rawTime: t.created_at,
          });
        }

        // Deadline reminder
        if (t.deadline) {
          notifications.push({
            icon: "⏰",
            type: "deadline",
            text: `Deadline for "${t.title}" is approaching`,
            time: `${formatDate(t.deadline)} ${formatTime(t.deadline)}`,
            rawTime: t.deadline,
          });
        }
      });
    }

    // ===================== TEACHER =====================
    if (user.role === "teacher") {
      const [tasks] = await db.query(
        `SELECT t.title, u.name AS student, t.created_at, t.status
         FROM tasks t
         LEFT JOIN users u ON t.assigned_to = u.id
         ORDER BY t.created_at DESC`
      );

      tasks.forEach((t) => {
        if (t.student) {
          notifications.push({
            icon: "📌",
            type: "assign",
            text: `${t.title} assigned to ${t.student}`,
            time: `${formatDate(t.created_at)} ${formatTime(t.created_at)}`,
            rawTime: t.created_at,
          });
        }

        if (t.status === "completed") {
          notifications.push({
            icon: "✅",
            type: "done",
            text: `${t.student || "Student"} completed ${t.title}`,
            time: `${formatDate(t.created_at)} ${formatTime(t.created_at)}`,
            rawTime: t.created_at,
          });
        }
      });
    }

    // ===================== COMMENTS (ALL USERS) =====================
    const [comments] = await db.query(
      `SELECT c.comment, c.created_at, u.name, t.title
       FROM comments c
       JOIN users u ON c.user_id = u.id
       JOIN tasks t ON c.task_id = t.id
       ORDER BY c.created_at DESC
       LIMIT 10`
    );

    comments.forEach((c) => {
      notifications.push({
        icon: "💬",
        type: "comment",
        text: `${c.name} commented on "${c.title}"`,
        time: `${formatDate(c.created_at)} ${formatTime(c.created_at)}`,
        rawTime: c.created_at,
      });
    });

    // ===================== SORT BY REAL TIME =====================
    notifications.sort((a, b) => new Date(b.rawTime) - new Date(a.rawTime));

    res.json({ notifications });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to load notifications" });
  }
};

module.exports = { getNotifications };
