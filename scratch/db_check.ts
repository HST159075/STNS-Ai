import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    const userCount = await prisma.user.count();
    const projectCount = await prisma.project.count();
    const projects = await prisma.project.findMany({ take: 5 });
    
    console.log('--- DATABASE REPORT ---');
    console.log('Total Users:', userCount);
    console.log('Total Projects:', projectCount);
    console.log('Recent Projects:', JSON.stringify(projects, null, 2));
    console.log('-----------------------');
  } catch (error) {
    console.error('Error querying database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
