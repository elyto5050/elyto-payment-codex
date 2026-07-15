import { prisma } from "../lib/db/prisma";

(async () => {
  try {
    const o = await prisma.organization.findFirst();
    console.log(o ? o.id : "NO_ORG");
  } catch (e) {
    console.error(e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
})();
