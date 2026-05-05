const pool = require('../config/db');

// GET /api/dashboard — task counts scoped by role
async function getDashboard(req, res) {
  try {
    let total = 0;
    let todo = 0;
    let inProgress = 0;
    let done = 0;
    let overdue = 0;

    if (req.user.role === 'admin') {
      const [rows] = await pool.execute(
        `SELECT
           COUNT(*) AS total,
           SUM(status = 'todo') AS todo,
           SUM(status = 'in_progress') AS in_progress,
           SUM(status = 'done') AS done,
           SUM(
             due_date IS NOT NULL
             AND due_date < CURDATE()
             AND status <> 'done'
           ) AS overdue
         FROM tasks`
      );
      const r = rows[0];
      total = Number(r.total) || 0;
      todo = Number(r.todo) || 0;
      inProgress = Number(r.in_progress) || 0;
      done = Number(r.done) || 0;
      overdue = Number(r.overdue) || 0;
    } else {
      const uid = req.user.id;
      const [rows] = await pool.execute(
        `SELECT
           COUNT(*) AS total,
           SUM(status = 'todo') AS todo,
           SUM(status = 'in_progress') AS in_progress,
           SUM(status = 'done') AS done,
           SUM(
             due_date IS NOT NULL
             AND due_date < CURDATE()
             AND status <> 'done'
           ) AS overdue
         FROM tasks
         WHERE assigned_to = ?`,
        [uid]
      );
      const r = rows[0];
      total = Number(r.total) || 0;
      todo = Number(r.todo) || 0;
      inProgress = Number(r.in_progress) || 0;
      done = Number(r.done) || 0;
      overdue = Number(r.overdue) || 0;
    }

    res.json({
      total_tasks: total,
      todo_tasks: todo,
      in_progress_tasks: inProgress,
      done_tasks: done,
      overdue_tasks: overdue,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}

module.exports = { getDashboard };
