const pool = require('../config/db');
const { userIsMemberOfProject } = require('./projectController');

const ALLOWED_STATUSES = ['todo', 'in_progress', 'done'];

// GET /api/tasks/project/:projectId
async function getTasksForProject(req, res) {
  try {
    const projectId = Number(req.params.projectId);
    if (Number.isNaN(projectId)) {
      return res.status(400).json({ message: 'Invalid project id' });
    }

    if (req.user.role !== 'admin') {
      const member = await userIsMemberOfProject(req.user.id, projectId);
      if (!member) {
        return res.status(403).json({ message: 'You do not have access to this project' });
      }
      const [rows] = await pool.execute(
        `SELECT t.id, t.project_id, t.title, t.description, t.assigned_to, t.status, t.due_date, t.created_by, t.created_at,
                u.name AS assignee_name, u.email AS assignee_email
         FROM tasks t
         LEFT JOIN users u ON u.id = t.assigned_to
         WHERE t.project_id = ? AND t.assigned_to = ?
         ORDER BY t.created_at DESC`,
        [projectId, req.user.id]
      );
      return res.json({ tasks: rows });
    }

    const [rows] = await pool.execute(
      `SELECT t.id, t.project_id, t.title, t.description, t.assigned_to, t.status, t.due_date, t.created_by, t.created_at,
              u.name AS assignee_name, u.email AS assignee_email
       FROM tasks t
       LEFT JOIN users u ON u.id = t.assigned_to
       WHERE t.project_id = ?
       ORDER BY t.created_at DESC`,
      [projectId]
    );
    res.json({ tasks: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}

// POST /api/tasks — admin only
async function createTask(req, res) {
  try {
    const { project_id: projectIdBody, title, description, assigned_to, due_date } = req.body;

    const projectId = Number(projectIdBody);
    if (Number.isNaN(projectId)) {
      return res.status(400).json({ message: 'Valid project_id is required' });
    }

    if (!title || typeof title !== 'string' || !title.trim()) {
      return res.status(400).json({ message: 'Task title is required' });
    }

    const assigneeId = Number(assigned_to);
    if (Number.isNaN(assigneeId)) {
      return res.status(400).json({ message: 'Assignee user id is required' });
    }

    const desc = description && typeof description === 'string' ? description.trim() : '';

    let dueDateVal = null;
    if (due_date != null && String(due_date).trim()) {
      dueDateVal = String(due_date).trim().slice(0, 10);
    }

    const [projRows] = await pool.execute('SELECT id FROM projects WHERE id = ?', [projectId]);
    if (!projRows[0]) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const [membership] = await pool.execute(
      'SELECT 1 FROM project_members WHERE project_id = ? AND user_id = ? LIMIT 1',
      [projectId, assigneeId]
    );
    if (membership.length === 0) {
      return res.status(400).json({ message: 'Assignee must be a member of the project' });
    }

    const [result] = await pool.execute(
      `INSERT INTO tasks (project_id, title, description, assigned_to, status, due_date, created_by)
       VALUES (?, ?, ?, ?, 'todo', ?, ?)`,
      [projectId, title.trim(), desc || null, assigneeId, dueDateVal, req.user.id]
    );

    const taskId = result.insertId;
    const [rows] = await pool.execute(
      `SELECT t.id, t.project_id, t.title, t.description, t.assigned_to, t.status, t.due_date, t.created_by, t.created_at,
              u.name AS assignee_name, u.email AS assignee_email
       FROM tasks t
       LEFT JOIN users u ON u.id = t.assigned_to
       WHERE t.id = ?`,
      [taskId]
    );
    res.status(201).json({ task: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}

// PUT /api/tasks/:id/status
async function updateTaskStatus(req, res) {
  try {
    const taskId = Number(req.params.id);
    if (Number.isNaN(taskId)) {
      return res.status(400).json({ message: 'Invalid task id' });
    }

    const { status } = req.body;
    if (!status || typeof status !== 'string' || !ALLOWED_STATUSES.includes(status)) {
      return res.status(400).json({ message: 'Status must be todo, in_progress, or done' });
    }

    const [tasks] = await pool.execute(
      `SELECT t.id, t.project_id, t.assigned_to
       FROM tasks t
       WHERE t.id = ?
       LIMIT 1`,
      [taskId]
    );
    const task = tasks[0];
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    if (req.user.role === 'admin') {
      await pool.execute('UPDATE tasks SET status = ? WHERE id = ?', [status, taskId]);
      const [rows] = await pool.execute(
        `SELECT t.id, t.project_id, t.title, t.description, t.assigned_to, t.status, t.due_date, t.created_by, t.created_at,
                u.name AS assignee_name, u.email AS assignee_email
         FROM tasks t
         LEFT JOIN users u ON u.id = t.assigned_to
         WHERE t.id = ?`,
        [taskId]
      );
      return res.json({ task: rows[0] });
    }

    if (task.assigned_to !== req.user.id) {
      return res.status(403).json({ message: 'You can only update tasks assigned to you' });
    }

    const member = await userIsMemberOfProject(req.user.id, task.project_id);
    if (!member) {
      return res.status(403).json({ message: 'You do not have access to this task' });
    }

    await pool.execute('UPDATE tasks SET status = ? WHERE id = ?', [status, taskId]);
    const [rows] = await pool.execute(
      `SELECT t.id, t.project_id, t.title, t.description, t.assigned_to, t.status, t.due_date, t.created_by, t.created_at,
              u.name AS assignee_name, u.email AS assignee_email
       FROM tasks t
       LEFT JOIN users u ON u.id = t.assigned_to
       WHERE t.id = ?`,
      [taskId]
    );
    res.json({ task: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}

// DELETE /api/tasks/:id — admin only
async function deleteTask(req, res) {
  try {
    const taskId = Number(req.params.id);
    if (Number.isNaN(taskId)) {
      return res.status(400).json({ message: 'Invalid task id' });
    }

    const [tasks] = await pool.execute(
      `SELECT id, project_id, title, assigned_to FROM tasks WHERE id = ?`,
      [taskId]
    );
    if (!tasks[0]) {
      return res.status(404).json({ message: 'Task not found' });
    }

    await pool.execute('DELETE FROM tasks WHERE id = ?', [taskId]);
    res.json({ message: 'Task deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}

module.exports = {
  getTasksForProject,
  createTask,
  updateTaskStatus,
  deleteTask,
};
