const express = require('express');
const {
  getTasksForProject,
  createTask,
  updateTaskStatus,
  deleteTask,
} = require('../controllers/taskController');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

const router = express.Router();

router.use(authMiddleware);

// Order matters: /project/:projectId must come before generic :id routes would if we added any
router.get('/project/:projectId', getTasksForProject);
router.post('/', adminMiddleware, createTask);
router.put('/:id/status', updateTaskStatus);
router.delete('/:id', adminMiddleware, deleteTask);

module.exports = router;
