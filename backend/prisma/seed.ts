/**
 * Local seed: creates (or resets) the demo account with a sample dataset.
 * Only the demo account is touched, other users are left as they are.
 */
import 'dotenv/config';
import prisma from '../src/config/database.js';
import { resetDemoAccount } from '../src/services/demo.service.js';

const email = (process.env.DEMO_USER_EMAIL || 'demo@example.com').trim().toLowerCase();
const password = process.env.DEMO_USER_PASSWORD || 'Demo1234!';

async function main() {
  await resetDemoAccount(email, password);
  console.log('🌱 Seed completed');
  console.log(`   Demo account: ${email} / ${password}`);
}

main()
  .catch((error) => {
    console.error('❌ Seed failed:', error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
