const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('CHANGE_ME_ON_SETUP', 10);
  
  // Seed Admin
  const admin = await prisma.admin.upsert({
    where: { email: 'admin@cfa.com' },
    update: {},
    create: {
      email: 'admin@cfa.com',
      password: hashedPassword,
    },
  });

  console.log('Admin seeded:', admin.email);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
