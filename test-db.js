const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const event = await prisma.event.create({
      data: {
        name: 'Test Event',
        leader: 'Test Leader',
        guide: 'Test Guide',
        observer: 'Test Observer',
        startDateTime: new Date(),
        endDateTime: new Date(Date.now() + 60 * 60 * 1000),
        duration: 60,
        isRecurring: false
      }
    });
    console.log('Successfully created test event:', event);
    const count = await prisma.event.count();
    console.log('Total events in DB:', count);
  } catch (e) {
    console.error('Failed to create event:', e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
