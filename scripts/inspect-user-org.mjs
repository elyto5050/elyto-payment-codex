import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
(async ()=>{
  const userId = 'cmq7n40ai0000sl7g47a68i7e';
  try{
    const teamMembers = await prisma.teamMember.findMany({ where: { userId } });
    console.log('teamMembers:', teamMembers);
    const orgIds = teamMembers.map(tm=>tm.organizationId);
    const orgs = orgIds.length ? await prisma.organization.findMany({ where: { id: { in: orgIds } } }) : [];
    console.log('organizations:', orgs);
    const sessions = await prisma.session.findMany({ where: { userId } });
    console.log('sessions:', sessions.map(s=>({id:s.id, sessionToken: s.sessionToken.slice(0,20)+'...' , expires: s.expires}))); 
  }catch(e){
    console.error('error', e);
  }finally{ await prisma.$disconnect(); }
})();
