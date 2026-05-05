const express = require('express');
const { listProjects, createProject, getProject, addMember } = require('../controllers/projectController');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

const router = express.Router();

router.use(authMiddleware);

router.get('/', listProjects);
router.post('/', adminMiddleware, createProject);
router.get('/:id', getProject);
router.post('/:id/members', adminMiddleware, addMember);

module.exports = router;
