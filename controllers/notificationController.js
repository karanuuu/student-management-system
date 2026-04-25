const db = require("../config/db");

const formatDate = (dateStr) => {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "Africa/Nairobi",
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).format(new Date(dateStr));
};

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

    const now = new Date();
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

    const [completionRows] = await db.query(
      `SELECT message, created_at FROM notifications
       WHERE user_id = ? AND message LIKE 'COMPLETED::%'`,
      [user.id]
    );
    const completionMap = {};
    completionRows.forEach((row) => {
      const parts = row.message.split("::");
      const taskId = parts[1];
      // Keep the earliest entry per task (first time it was completed)
      if (taskId && !completionMap[taskId]) {
        completionMap[taskId] = row.created_at;
      }
    });

    // STUDENT
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
          text: `Task assigned to you: "${t.title}"`,
          time: `${formatDate(t.created_at)} ${formatTime(t.created_at)}`,
          rawTime: t.created_at,
        });

        // Completed — use timestamp from notifications table
        if (t.status === "completed") {
          const completedAt = completionMap[String(t.id)] || null;
          notifications.push({
            icon: "✅",
            type: "done",
            text: `You completed: "${t.title}"`,
            time: completedAt
              ? `${formatDate(completedAt)} ${formatTime(completedAt)}`
              : "Completion time not recorded",
            rawTime: completedAt || t.created_at,
          });
        }

        // Deadline — only overdue or within 3 days
        if (t.deadline && t.status !== "completed") {
          const deadlineDate = new Date(t.deadline);

          if (deadlineDate < now) {
            notifications.push({
              icon: "🚨",
              type: "overdue",
              text: `OVERDUE: "${t.title}" was due on ${formatDate(
                t.deadline
              )}`,
              time: `${formatDate(t.deadline)} ${formatTime(t.deadline)}`,
              rawTime: t.deadline,
            });
          } else if (deadlineDate <= threeDaysFromNow) {
            const daysLeft = Math.ceil(
              (deadlineDate - now) / (1000 * 60 * 60 * 24)
            );
            const dayWord = daysLeft === 1 ? "tomorrow" : `in ${daysLeft} days`;
            notifications.push({
              icon: "⏰",
              type: "deadline",
              text: `Deadline for "${t.title}" is ${dayWord} — ${formatDate(
                t.deadline
              )}`,
              time: `${formatDate(t.deadline)} ${formatTime(t.deadline)}`,
              rawTime: t.deadline,
            });
          }
        }
      });

      // Comments — only on tasks assigned to THIS student, excluding own comments
      const [comments] = await db.query(
        `SELECT c.comment, c.created_at, u.name AS commenter, t.title
         FROM comments c
         JOIN users u ON c.user_id = u.id
         JOIN tasks t ON c.task_id = t.id
         WHERE t.assigned_to = ?
           AND c.user_id != ?
         ORDER BY c.created_at DESC
         LIMIT 20`,
        [user.id, user.id]
      );

      comments.forEach((c) => {
        notifications.push({
          icon: "💬",
          type: "comment",
          text: `${c.commenter} commented on "${
            c.title
          }": "${c.comment.substring(0, 60)}${
            c.comment.length > 60 ? "…" : ""
          }"`,
          time: `${formatDate(c.created_at)} ${formatTime(c.created_at)}`,
          rawTime: c.created_at,
        });
      });
    }

    // TEACHER
    if (user.role === "teacher") {
      const [tasks] = await db.query(
        `SELECT t.id, t.title, t.created_at, t.deadline, t.status,
                u.name AS student
         FROM tasks t
         LEFT JOIN users u ON t.assigned_to = u.id
         WHERE t.created_by = ?
         ORDER BY t.created_at DESC`,
        [user.id]
      );

      tasks.forEach((t) => {
        // Task assigned
        if (t.student) {
          notifications.push({
            icon: "📌",
            type: "assign",
            text: `You assigned "${t.title}" to ${t.student}`,
            time: `${formatDate(t.created_at)} ${formatTime(t.created_at)}`,
            rawTime: t.created_at,
          });
        }

        // Completed — use timestamp from notifications table
        if (t.status === "completed") {
          const completedAt = completionMap[String(t.id)] || null;
          notifications.push({
            icon: "✅",
            type: "done",
            text: `${t.student || "Student"} completed "${t.title}"`,
            time: completedAt
              ? `${formatDate(completedAt)} ${formatTime(completedAt)}`
              : "Completion time not recorded",
            rawTime: completedAt || t.created_at,
          });
        }

        // Deadline — only overdue or within 3 days
        if (t.deadline && t.status !== "completed") {
          const deadlineDate = new Date(t.deadline);

          if (deadlineDate < now) {
            notifications.push({
              icon: "🚨",
              type: "overdue",
              text: `OVERDUE: "${t.title}" (assigned to ${
                t.student || "student"
              }) was due ${formatDate(t.deadline)}`,
              time: `${formatDate(t.deadline)} ${formatTime(t.deadline)}`,
              rawTime: t.deadline,
            });
          } else if (deadlineDate <= threeDaysFromNow) {
            const daysLeft = Math.ceil(
              (deadlineDate - now) / (1000 * 60 * 60 * 24)
            );
            const dayWord = daysLeft === 1 ? "tomorrow" : `in ${daysLeft} days`;
            notifications.push({
              icon: "⏰",
              type: "deadline",
              text: `"${t.title}" (assigned to ${
                t.student || "student"
              }) is due ${dayWord}`,
              time: `${formatDate(t.deadline)} ${formatTime(t.deadline)}`,
              rawTime: t.deadline,
            });
          }
        }
      });

      // Comments — only on tasks THIS teacher created, excluding own comments
      const [comments] = await db.query(
        `SELECT c.comment, c.created_at, u.name AS commenter, t.title
         FROM comments c
         JOIN users u ON c.user_id = u.id
         JOIN tasks t ON c.task_id = t.id
         WHERE t.created_by = ?
           AND c.user_id != ?
         ORDER BY c.created_at DESC
         LIMIT 20`,
        [user.id, user.id]
      );

      comments.forEach((c) => {
        notifications.push({
          icon: "💬",
          type: "comment",
          text: `${c.commenter} commented on "${
            c.title
          }": "${c.comment.substring(0, 60)}${
            c.comment.length > 60 ? "…" : ""
          }"`,
          time: `${formatDate(c.created_at)} ${formatTime(c.created_at)}`,
          rawTime: c.created_at,
        });
      });
    }

    // Sort newest first
    notifications.sort((a, b) => new Date(b.rawTime) - new Date(a.rawTime));

    res.json({ notifications });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to load notifications" });
  }
};

module.exports = { getNotifications };
