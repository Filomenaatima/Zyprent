import {
  AccountType,
  LedgerSource,
  PrismaClient,
  WalletTransactionStatus,
  WalletTransactionType,
} from '@prisma/client';

const prisma = new PrismaClient();

const BAD_REFERENCE = 'EXP-1777324742444';
const PROPERTY_TITLE = 'Crest View Residences';
const TOTAL_AMOUNT = 250000;

async function syncWallet(userId: string) {
  const account = await prisma.account.findFirst({
    where: { userId, type: AccountType.USER },
  });

  if (!account) return;

  const totals = await prisma.ledgerEntry.aggregate({
    where: { accountId: account.id },
    _sum: { credit: true, debit: true },
  });

  const balance =
    Number(totals._sum.credit ?? 0) - Number(totals._sum.debit ?? 0);

  await prisma.wallet.update({
    where: { userId },
    data: { balance },
  });
}

async function main() {
  console.log('🔧 Repairing incorrect shared expense split...');

  const property = await prisma.property.findFirst({
    where: { title: PROPERTY_TITLE },
  });

  if (!property) throw new Error('Property not found');

  const shares = await prisma.investorShare.findMany({
    where: { propertyId: property.id },
    include: {
      investor: true,
    },
    orderBy: { createdAt: 'asc' },
  });

  if (!shares.length) throw new Error('No investor shares found');

  const adminCredit = await prisma.ledgerEntry.findFirst({
    where: {
      source: LedgerSource.EXPENSE_PAYMENT,
      reference: BAD_REFERENCE,
      credit: TOTAL_AMOUNT,
    },
  });

  if (!adminCredit) {
    throw new Error('Admin credit entry not found');
  }

  await prisma.$transaction(async (tx) => {
    await tx.ledgerEntry.deleteMany({
      where: {
        source: LedgerSource.EXPENSE_PAYMENT,
        reference: BAD_REFERENCE,
      },
    });

    await tx.walletTransaction.deleteMany({
      where: {
        reference: BAD_REFERENCE,
      },
    });

    const totalShares = shares.reduce(
      (sum, share) => sum + Number(share.sharesOwned || 0),
      0,
    );

    let allocatedTotal = 0;

    for (let i = 0; i < shares.length; i++) {
      const share = shares[i];
      const isLast = i === shares.length - 1;

      const calculated = Math.round(
        (Number(share.sharesOwned) / totalShares) * TOTAL_AMOUNT,
      );

      const amount = isLast ? TOTAL_AMOUNT - allocatedTotal : calculated;
      allocatedTotal += amount;

      const account = await tx.account.findFirst({
        where: {
          userId: share.investorId,
          type: AccountType.USER,
        },
      });

      const wallet = await tx.wallet.findUnique({
        where: { userId: share.investorId },
      });

      if (!account || !wallet) {
        throw new Error(`Missing account or wallet for ${share.investor.email}`);
      }

      const reference = `${BAD_REFERENCE}-${share.investorId}`;

      await tx.ledgerEntry.create({
        data: {
          accountId: account.id,
          debit: amount,
          credit: 0,
          source: LedgerSource.EXPENSE_PAYMENT,
          reference,
          propertyId: property.id,
        },
      });

      await tx.ledgerEntry.create({
        data: {
          accountId: adminCredit.accountId,
          debit: 0,
          credit: amount,
          source: LedgerSource.EXPENSE_PAYMENT,
          reference,
          propertyId: property.id,
        },
      });

      await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type: WalletTransactionType.EXPENSE_PAYMENT,
          status: WalletTransactionStatus.COMPLETED,
          amount,
          reference,
        },
      });

      console.log(`${share.investor.name}: UGX ${amount}`);
    }
  });

  for (const share of shares) {
    await syncWallet(share.investorId);
  }

  console.log('✅ Repair complete');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });