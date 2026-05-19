import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient();

export async function ensureDefaultUser() {
  return prisma.user.upsert({
    where: { email: 'local@written-entity.dev' },
    update: {},
    create: { email: 'local@written-entity.dev', name: 'Local User' },
  });
}
