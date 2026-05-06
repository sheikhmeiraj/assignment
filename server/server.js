require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/authRoutes');
const projectRoutes = require('./routes/projectRoutes');
const taskRoutes = require('./routes/taskRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Allow multiple frontend origins via FRONTEND_URL (comma-separated)
const corsOptions = {
  origin: (origin, callback) => {
    const raw = process.env.FRONTEND_URL || '';
    const allowed = raw
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    if (!origin || allowed.length === 0 || allowed.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

// If FRONTEND_URL unset, reflect request origin so local dev works out of the box
if (!(process.env.FRONTEND_URL || '').trim()) {
  corsOptions.origin = true;
}

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json());

app.get('/health', (_req, res) => res.json({ ok: true }));

app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/dashboard', dashboardRoutes);

// 404 fallback
app.use((_req, res) => res.status(404).json({ message: 'Not found' }));

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
