import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
(async ()=>{
  const userId = 'cmq7n40ai0000sl7g47a68i7e';
  try{
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, createdAt: true, email: true } });
    console.log('user:', user);
    const membership = await prisma.teamMember.findFirst({ where: { userId }, orderBy: { createdAt: 'asc' } });
    console.log('teamMember:', membership);
    const loginHistory = await prisma.loginHistory.findMany({ where: { userId }, orderBy: { createdAt: 'asc' }, take: 10 });
    console.log('loginHistory (latest 10):', loginHistory.map(l=>({createdAt:l.createdAt, reason:l.reason}))); 
  }catch(e){ console.error(e); } finally { await prisma.$disconnect(); }
})();
