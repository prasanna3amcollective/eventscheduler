const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Current working directory:', process.cwd());
  
  try {
    const events = await prisma.event.findMany();
    console.log('Events in DB:', JSON.stringify(events, null, 2));
    console.log('Total count:', events.length);
  } catch (e) {
    console.error('Error:', e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
