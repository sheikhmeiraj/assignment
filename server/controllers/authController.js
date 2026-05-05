const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

function sanitizeUser(row) {
  if (!row) return null;
  const { password, ...rest } = row;
  return rest;
}

// POST /api/auth/signup — always registers as global "member"
async function signup(req, res) {
  try {
    const { name, email, password } = req.body;
    if (
      !name ||
      typeof name !== 'string' ||
      !name.trim() ||
      !email ||
      typeof email !== 'string' ||
      !email.trim() ||
      !password ||
      typeof password !== 'string' ||
      !password.trim()
    ) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }

    const hashed = await bcrypt.hash(password.trim(), 10);
    const [result] = await pool.execute(
      'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
      [name.trim(), email.trim().toLowerCase(), hashed, 'member']
    );

    const [rows] = await pool.execute('SELECT id, name, email, role, created_at FROM users WHERE id = ?', [
      result.insertId,
    ]);
    const user = rows[0];
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    res.status(201).json({ user, token });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ message: 'Email already registered' });
    }
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}

// POST /api/auth/login
async function login(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || typeof email !== 'string' || !email.trim()) {
      return res.status(400).json({ message: 'Email is required' });
    }
    if (!password || typeof password !== 'string' || !password.trim()) {
      return res.status(400).json({ message: 'Password is required' });
    }

    const [rows] = await pool.execute('SELECT * FROM users WHERE email = ?', [
      email.trim().toLowerCase(),
    ]);
    const userRow = rows[0];
    if (!userRow) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const match = await bcrypt.compare(password.trim(), userRow.password);
    if (!match) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const user = sanitizeUser(userRow);
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    res.json({ user, token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}

// GET /api/auth/me — current user without password
async function me(req, res) {
  try {
    const [rows] = await pool.execute('SELECT id, name, email, role, created_at FROM users WHERE id = ?', [
      req.user.id,
    ]);
    if (!rows[0]) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ user: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}

module.exports = { signup, login, me, sanitizeUser };
