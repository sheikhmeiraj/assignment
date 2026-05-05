-- Run after schema.sql on an empty database (or delete existing rows first in dev)

INSERT INTO users (name, email, password, role) VALUES
(
  'Admin User',
  'admin@example.com',
  '$2a$10$AOJ5OK28lgoegzEyXYMJ9OkAL9hLhnkKuTBxPPXUIYYsXv.m5pP.y',
  'admin'
),
(
  'Member User',
  'member@example.com',
  '$2a$10$AOJ5OK28lgoegzEyXYMJ9OkAL9hLhnkKuTBxPPXUIYYsXv.m5pP.y',
  'member'
);

-- Assumes the two inserts above receive id 1 (admin) and id 2 (member)
INSERT INTO projects (name, description, created_by) VALUES
(
  'Website Redesign',
  'Refresh the marketing site and landing pages',
  1
);

INSERT INTO project_members (project_id, user_id, role) VALUES
(1, 1, 'admin'),
(1, 2, 'member');

INSERT INTO tasks (project_id, title, description, assigned_to, status, due_date, created_by) VALUES
(
  1,
  'Draft homepage copy',
  'Write a first draft for the hero section and CTA',
  2,
  'todo',
  DATE_ADD(CURDATE(), INTERVAL 5 DAY),
  1
),
(
  1,
  'Review wireframes',
  'Add comments in the shared design file',
  2,
  'in_progress',
  DATE_SUB(CURDATE(), INTERVAL 2 DAY),
  1
),
(
  1,
  'Set up analytics',
  'Connect basic pageview tracking for launch',
  1,
  'done',
  CURDATE(),
  1
);
