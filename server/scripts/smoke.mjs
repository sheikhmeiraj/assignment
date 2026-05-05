/**
 * HTTP smoke checks against a running API.
 * Usage (from server/):
 *   1) Configure .env and start the API: npm run dev
 *   2) In another shell: npm run smoke
 *
 * Optional: SMOKE_URL=http://127.0.0.1:5000 npm run smoke
 */
const base = (process.env.SMOKE_URL || 'http://localhost:5000').replace(/\/$/, '');

async function main() {
  console.log('\n→ GET', `${base}/health`);
  let res = await fetch(`${base}/health`);
  const healthText = await res.text();
  console.log(`  status ${res.status}`, healthText);
  if (!res.ok) process.exitCode = 1;

  console.log('\n→ POST', `${base}/api/auth/login`, '(admin demo)');
  res = await fetch(`${base}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@example.com', password: 'password123' }),
  });
  const loginText = await res.text();
  console.log(`  status ${res.status}`, loginText.slice(0, 280) + (loginText.length > 280 ? '…' : ''));

  if (!res.ok) {
    console.error('\nSmoke failed at login: fix MySQL `.env`, run schema + seed.sql, ensure server uses same `.env`.');
    process.exit(1);
  }

  let token;
  try {
    ({ token } = JSON.parse(loginText));
  } catch {
    console.error('\nSmoke failed: login response was not JSON.');
    process.exit(1);
  }

  console.log('\n→ GET', `${base}/api/auth/me`);
  res = await fetch(`${base}/api/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const meText = await res.text();
  console.log(`  status ${res.status}`, meText);
  if (!res.ok) process.exit(1);

  console.log('\n→ GET', `${base}/api/dashboard`);
  res = await fetch(`${base}/api/dashboard`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const dashText = await res.text();
  console.log(`  status ${res.status}`, dashText);
  if (!res.ok) process.exit(1);

  console.log('\nSmoke checks passed.');
}

main().catch((err) => {
  console.error(err);
  console.error('\n(Is the API running on', base + '?)');
  process.exit(1);
});
