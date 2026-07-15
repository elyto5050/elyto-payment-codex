import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const slugs = ['dev-live-demo', 'dev-past-demo', 'rick-astley'];
  const deleted = await prisma.tutorial.deleteMany({ where: { OR: [{ slug: { in: slugs } }, { title: { contains: 'Rick Astley' } }] } });
  console.log('Deleted tutorials count:', deleted.count);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
