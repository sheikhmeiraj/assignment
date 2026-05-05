const pool = require('../config/db');

async function userIsMemberOfProject(userId, projectId) {
  const [rows] = await pool.execute(
    'SELECT 1 FROM project_members WHERE project_id = ? AND user_id = ? LIMIT 1',
    [projectId, userId]
  );
  return rows.length > 0;
}

// GET /api/projects — admin: all projects; member: projects they belong to
async function listProjects(req, res) {
  try {
    if (req.user.role === 'admin') {
      const [rows] = await pool.execute(
        'SELECT id, name, description, created_by, created_at FROM projects ORDER BY created_at DESC'
      );
      return res.json({ projects: rows });
    }

    const [rows] = await pool.execute(
      `SELECT p.id, p.name, p.description, p.created_by, p.created_at
       FROM projects p
       INNER JOIN project_members pm ON pm.project_id = p.id AND pm.user_id = ?
       ORDER BY p.created_at DESC`,
      [req.user.id]
    );
    res.json({ projects: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}

// POST /api/projects — admin only (middleware handles role)
async function createProject(req, res) {
  try {
    const { name, description } = req.body;
    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ message: 'Project name is required' });
    }

    const desc = description && typeof description === 'string' ? description.trim() : '';

    const [result] = await pool.execute(
      'INSERT INTO projects (name, description, created_by) VALUES (?, ?, ?)',
      [name.trim(), desc || null, req.user.id]
    );
    const projectId = result.insertId;

    // Creator is automatically an admin for this project
    await pool.execute(
      'INSERT INTO project_members (project_id, user_id, role) VALUES (?, ?, ?)',
      [projectId, req.user.id, 'admin']
    );

    const [rows] = await pool.execute(
      'SELECT id, name, description, created_by, created_at FROM projects WHERE id = ?',
      [projectId]
    );
    res.status(201).json({ project: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}

// GET /api/projects/:id
async function getProject(req, res) {
  try {
    const projectId = Number(req.params.id);
    if (Number.isNaN(projectId)) {
      return res.status(400).json({ message: 'Invalid project id' });
    }

    if (req.user.role !== 'admin') {
      const member = await userIsMemberOfProject(req.user.id, projectId);
      if (!member) {
        return res.status(403).json({ message: 'You do not have access to this project' });
      }
    }

    const [projRows] = await pool.execute(
      'SELECT id, name, description, created_by, created_at FROM projects WHERE id = ?',
      [projectId]
    );
    if (!projRows[0]) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const [memberRows] = await pool.execute(
      `SELECT u.id, u.name, u.email, pm.role AS project_role
       FROM project_members pm
       INNER JOIN users u ON u.id = pm.user_id
       WHERE pm.project_id = ?
       ORDER BY u.name`,
      [projectId]
    );

    const membersNoPassword = memberRows.map((m) => ({
      id: m.id,
      name: m.name,
      email: m.email,
      project_role: m.project_role,
    }));

    res.json({ project: projRows[0], members: membersNoPassword });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}

// POST /api/projects/:id/members — add existing user by email (admin middleware)
async function addMember(req, res) {
  try {
    const projectId = Number(req.params.id);
    if (Number.isNaN(projectId)) {
      return res.status(400).json({ message: 'Invalid project id' });
    }

    const { email } = req.body;
    if (!email || typeof email !== 'string' || !email.trim()) {
      return res.status(400).json({ message: 'Member email is required' });
    }

    const [projRows] = await pool.execute('SELECT id FROM projects WHERE id = ?', [projectId]);
    if (!projRows[0]) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const emailNorm = email.trim().toLowerCase();
    const [userRows] = await pool.execute('SELECT id, name, email, role, created_at FROM users WHERE email = ?', [
      emailNorm,
    ]);
    const target = userRows[0];
    if (!target) {
      return res.status(404).json({ message: 'No user found with this email' });
    }

    try {
      await pool.execute(
        'INSERT INTO project_members (project_id, user_id, role) VALUES (?, ?, ?)',
        [projectId, target.id, 'member']
      );
    } catch (e) {
      if (e.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({ message: 'User is already a member of this project' });
      }
      throw e;
    }

    res.status(201).json({ member: { id: target.id, name: target.name, email: target.email } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}

module.exports = {
  listProjects,
  createProject,
  getProject,
  addMember,
  userIsMemberOfProject,
};
