import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';

export const prisma = new PrismaClient();

export async function ensureDefaultUser() {
  console.log('[db] Running prisma db push to sync schema...');
  try {
    execSync('npx prisma db push --skip-generate', { stdio: 'inherit' });
    console.log('[db] Schema sync complete.');
  } catch (err) {
    console.error('[db] prisma db push failed:', err);
    throw err;
  }

  console.log('[db] Upserting default user...');
  const user = await prisma.user.upsert({
    where: { email: 'local@written-entity.dev' },
    update: {},
    create: { email: 'local@written-entity.dev', name: 'Local User' },
  });
  console.log('[db] Default user ready:', user.email);
  return user;
}
