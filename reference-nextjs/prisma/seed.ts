import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL || 'mohammadabulhayatt@gmail.com';
  const password = process.env.ADMIN_PASSWORD || 'Admin@1234';
  const name = process.env.ADMIN_NAME || 'Abul Hayat';

  const passwordHash = await bcrypt.hash(password, 12);

  const admin = await prisma.customer.upsert({
    where: { email },
    update: { role: 'super_admin', password_hash: passwordHash, name },
    create: { email, name, role: 'super_admin', password_hash: passwordHash },
  });

  console.log(`✅ Super admin created: ${admin.email}`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
