import { prisma } from './config/db.js';

async function main() {
  const users = await prisma.user.findMany();
  console.log("Users and their roles:");
  console.log(users.map(u => ({
    username: u.username,
    name: u.name,
    role: u.role
  })));
}

main().catch(console.error).finally(() => prisma.$disconnect());
