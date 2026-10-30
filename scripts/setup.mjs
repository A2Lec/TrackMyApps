/**
 * One-command local setup: `npm run setup` (after `npm run db:up`).
 * Installs both packages, creates the .env files, migrates and seeds the database.
 */
import { execSync } from 'node:child_process';
import { copyFileSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { randomBytes } from 'node:crypto';

const run = (command, cwd) => {
  console.log(`\n› ${command}${cwd ? `  (${cwd})` : ''}`);
  execSync(command, { cwd, stdio: 'inherit' });
};

function createEnv(dir) {
  const target = `${dir}/.env`;
  if (existsSync(target)) {
    console.log(`✓ ${target} existe déjà, conservé`);
    return;
  }
  copyFileSync(`${dir}/.env.example`, target);
  if (dir === 'backend') {
    const env = readFileSync(target, 'utf8')
      .replace('JWT_SECRET="change-me"', `JWT_SECRET="${randomBytes(32).toString('hex')}"`)
      .replace('ENCRYPTION_KEY="change-me"', `ENCRYPTION_KEY="${randomBytes(32).toString('base64')}"`);
    writeFileSync(target, env);
  }
  console.log(`✓ ${target} créé depuis .env.example`);
}

run('npm ci', 'backend');
run('npm ci', 'frontend');
createEnv('backend');
createEnv('frontend');
run('npx prisma migrate deploy', 'backend');
run('npm run db:seed', 'backend');

console.log('\n✅ Prêt ! Lancez `npm run dev` puis ouvrez http://localhost:5173');
console.log('   Compte démo : demo@example.com / Demo1234!');
