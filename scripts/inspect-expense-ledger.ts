import { PrismaClient, LedgerSource } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const entries = await prisma.ledgerEntry.findMany({
    where: {
      source: LedgerSource.EXPENSE_PAYMENT,
    },
    include: {
      account: {
        include: {
          user: true,
          property: true,
        },
      },
      property: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  console.log(
    entries.map((entry) => ({
      id: entry.id,
      user: entry.account.user?.name,
      email: entry.account.user?.email,
      debit: Number(entry.debit),
      credit: Number(entry.credit),
      reference: entry.reference,
      property: entry.property?.title,
      createdAt: entry.createdAt,
    })),
  );
}

main()
  .catch(console.error)
  .finally(async () => prisma.$disconnect());