const express = require("express");
const router = express.Router();

const { verifyToken } = require("../middlewares/authMiddleware");
const {
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
} = require("../controllers/taskController");

router.get("/students", verifyToken, getStudents);

router.post("/", verifyToken, createTask);
router.get("/", verifyToken, getAllTasks);
router.get("/:id", verifyToken, getTask);
router.put("/:id", verifyToken, updateTask);
router.put("/:id/status", verifyToken, updateTaskStatus);
router.delete("/:id", verifyToken, deleteTask);
router.post("/:id/assign", verifyToken, assignTask);
router.post("/:id/comments", verifyToken, addComment);
router.get("/:id/comments", verifyToken, getComments);

module.exports = router;
