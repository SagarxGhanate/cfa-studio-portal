const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function migrate() {
  // Find the first admin (your account)
  const admin = await prisma.admin.findFirst({ orderBy: { createdAt: 'asc' } });
  if (!admin) {
    console.log('No admin found!');
    return;
  }
  console.log(`Assigning all unlinked members to admin: ${admin.email} (${admin.id})`);
  
  const result = await prisma.member.updateMany({
    where: { adminId: null },
    data: { adminId: admin.id }
  });
  
  console.log(`✅ Updated ${result.count} members`);
  await prisma.$disconnect();
}

migrate().catch(console.error);
