import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const email = 'john@zyrent.com';
  const newPassword = 'Password123!';

  const hashed = await bcrypt.hash(newPassword, 10);

  await prisma.user.update({
    where: { email },
    data: { password: hashed },
  });

  console.log(`✅ Password reset for ${email}`);
  console.log(`New password: ${newPassword}`);
}

main()
  .catch(console.error)
  .finally(async () => prisma.$disconnect());