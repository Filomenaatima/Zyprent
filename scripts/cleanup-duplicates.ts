import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const result = await prisma.$executeRawUnsafe(`
    DELETE FROM "ProfitDistribution"
    WHERE id NOT IN (
      SELECT MIN(id)
      FROM "ProfitDistribution"
      GROUP BY "propertyId", "investorId", "periodMonth", "periodYear"
    );
  `);

  console.log("Duplicate records removed:", result);
}

main()
  .catch((error) => {
    console.error(error);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });