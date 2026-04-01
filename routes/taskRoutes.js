const express = require('express');
const router = express.Router();

const { verifyToken } = require('../middlewares/authMiddleware');
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
} = require('../controllers/taskController');

const fakeAuth = (req, res, next) => {
  req.user = { id: 1, name: 'Test User', role: 'admin' };
  next();
};

router.post('/', fakeAuth, createTask);
router.get('/', fakeAuth, getAllTasks);
router.get('/:id', fakeAuth, getTask);
router.put('/:id', fakeAuth, updateTask);
router.put('/:id/status', fakeAuth, updateTaskStatus);
router.delete('/:id', fakeAuth, deleteTask);
router.post('/:id/assign', fakeAuth, assignTask);
router.post('/:id/comments', fakeAuth, addComment);
router.get('/:id/comments', fakeAuth, getComments);

module.exports = router;