import {
  PrismaClient,
  Role,
  RentCycle,
  UnitStatus,
  ResidentStatus,
  InvoiceStatus,
  InvoiceKind,
  PaymentChannel,
  PaymentProvider,
  PaymentStatus,
  LedgerSource,
  ReportType,
  ReportRunStatus,
  WalletTransactionType,
  WalletTransactionStatus,
  WithdrawalStatus,
  PayoutStatus,
  NotificationType,
  ShareTransactionType,
  MaintenanceStatus,
  ServiceProviderType,
  MaintenanceCategory,
  MaintenancePaymentResponsibility,
  ProviderVerificationStatus,
  QuoteStatus,
  DispatchStatus,
  MaintenancePriority,
  DamageSeverity,
  KycStatus,
  InvestmentSource,
  AccountType,
  ProviderSource,
  ExpenseCategory,
  ExpenseStatus,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

async function upsertUser(params: {
  email: string;
  name: string;
  role: Role;
  phone?: string;
  password?: string;
}) {
  const hashed = await hashPassword(params.password ?? 'Password123!');

  return prisma.user.upsert({
    where: { email: params.email },
    update: {
      name: params.name,
      role: params.role,
      phone: params.phone,
    },
    create: {
      name: params.name,
      email: params.email,
      role: params.role,
      phone: params.phone,
      password: hashed,
    },
  });
}

async function ensureAccount(params: {
  userId?: string;
  propertyId?: string;
  type: AccountType;
  balance?: number;
}) {
  if (params.userId) {
    return prisma.account.upsert({
      where: { userId: params.userId },
      update: {
        type: params.type,
        balance: params.balance ?? 0,
      },
      create: {
        userId: params.userId,
        type: params.type,
        balance: params.balance ?? 0,
      },
    });
  }

  if (params.propertyId) {
    return prisma.account.upsert({
      where: { propertyId: params.propertyId },
      update: {
        type: params.type,
        balance: params.balance ?? 0,
      },
      create: {
        propertyId: params.propertyId,
        type: params.type,
        balance: params.balance ?? 0,
      },
    });
  }

  throw new Error('ensureAccount requires userId or propertyId');
}

async function ensureWallet(userId: string, balance = 0) {
  return prisma.wallet.upsert({
    where: { userId },
    update: { balance },
    create: { userId, balance },
  });
}

async function ensureLedgerEntry(data: {
  accountId: string;
  debit?: number;
  credit?: number;
  source: LedgerSource;
  reference?: string | null;
  propertyId?: string | null;
  rentInvoiceId?: string | null;
  paymentId?: string | null;
  payoutId?: string | null;
}) {
  const existing = data.reference
    ? await prisma.ledgerEntry.findFirst({
        where: {
          accountId: data.accountId,
          reference: data.reference,
          source: data.source,
        },
      })
    : null;

  if (existing) {
    return prisma.ledgerEntry.update({
      where: { id: existing.id },
      data: {
        debit: data.debit ?? 0,
        credit: data.credit ?? 0,
        propertyId: data.propertyId ?? null,
        rentInvoiceId: data.rentInvoiceId ?? null,
        paymentId: data.paymentId ?? null,
        ...(data.payoutId ? { payoutId: data.payoutId } : {}),
      },
    });
  }

  return prisma.ledgerEntry.create({
    data: {
      accountId: data.accountId,
      debit: data.debit ?? 0,
      credit: data.credit ?? 0,
      source: data.source,
      reference: data.reference ?? null,
      propertyId: data.propertyId ?? null,
      rentInvoiceId: data.rentInvoiceId ?? null,
      paymentId: data.paymentId ?? null,
      ...(data.payoutId ? { payoutId: data.payoutId } : {}),
    },
  });
}

async function syncWalletFromLedger(userId: string) {
  const account = await prisma.account.findFirst({
    where: { userId, type: AccountType.USER },
  });

  if (!account) return null;

  const totals = await prisma.ledgerEntry.aggregate({
    where: { accountId: account.id },
    _sum: {
      credit: true,
      debit: true,
    },
  });

  const credit = Number(totals._sum.credit ?? 0);
  const debit = Number(totals._sum.debit ?? 0);
  const balance = credit - debit;

  return prisma.wallet.upsert({
    where: { userId },
    update: { balance },
    create: { userId, balance },
  });
}

async function ensureWalletTransaction(params: {
  walletId: string;
  type: WalletTransactionType;
  status: WalletTransactionStatus;
  amount: number;
  reference: string;
}) {
  const existing = await prisma.walletTransaction.findFirst({
    where: {
      walletId: params.walletId,
      reference: params.reference,
    },
  });

  if (existing) {
    return prisma.walletTransaction.update({
      where: { id: existing.id },
      data: {
        type: params.type,
        status: params.status,
        amount: params.amount,
      },
    });
  }

  return prisma.walletTransaction.create({
    data: {
      walletId: params.walletId,
      type: params.type,
      status: params.status,
      amount: params.amount,
      reference: params.reference,
    },
  });
}

async function syncAccountFromLedger(accountId: string) {
  const totals = await prisma.ledgerEntry.aggregate({
    where: { accountId },
    _sum: {
      credit: true,
      debit: true,
    },
  });

  const credit = Number(totals._sum.credit ?? 0);
  const debit = Number(totals._sum.debit ?? 0);
  const balance = credit - debit;

  return prisma.account.update({
    where: { id: accountId },
    data: { balance },
  });
}

function calculateSeedInvestorAllocations(
  totalAmount: number,
  shares: { investorId: string; sharesOwned: number }[],
) {
  const totalShares = shares.reduce(
    (sum, share) => sum + Number(share.sharesOwned || 0),
    0,
  );

  if (!shares.length || totalShares <= 0) {
    throw new Error('No valid investor shares found for seeded expense');
  }

  let allocatedTotal = 0;

  return shares.map((share, index) => {
    const isLast = index === shares.length - 1;
    const calculated = Math.round(
      (Number(share.sharesOwned || 0) / totalShares) * totalAmount,
    );
    const amount = isLast ? totalAmount - allocatedTotal : calculated;
    allocatedTotal += amount;

    return {
      investorId: share.investorId,
      amount,
    };
  });
}

async function chargeSeedExpenseToInvestors(params: {
  propertyId: string;
  amount: number;
  reference: string;
  creditAccountId: string;
}) {
  const shares = await prisma.investorShare.findMany({
    where: { propertyId: params.propertyId },
    select: {
      investorId: true,
      sharesOwned: true,
    },
    orderBy: { createdAt: 'asc' },
  });

  const allocations = calculateSeedInvestorAllocations(params.amount, shares);

  for (const allocation of allocations) {
    if (allocation.amount <= 0) continue;

    const investorAccount = await prisma.account.findFirst({
      where: {
        userId: allocation.investorId,
        type: AccountType.USER,
      },
    });

    if (!investorAccount) {
      throw new Error(`Investor account not found: ${allocation.investorId}`);
    }

    const wallet = await ensureWallet(allocation.investorId, 0);
    const investorReference = `${params.reference}-${allocation.investorId}`;

    await ensureLedgerEntry({
      accountId: investorAccount.id,
      debit: allocation.amount,
      source: LedgerSource.EXPENSE_PAYMENT,
      reference: investorReference,
      propertyId: params.propertyId,
    });

    await ensureLedgerEntry({
      accountId: params.creditAccountId,
      credit: allocation.amount,
      source: LedgerSource.EXPENSE_PAYMENT,
      reference: investorReference,
      propertyId: params.propertyId,
    });

    await ensureWalletTransaction({
      walletId: wallet.id,
      type: WalletTransactionType.EXPENSE_PAYMENT,
      status: WalletTransactionStatus.COMPLETED,
      amount: allocation.amount,
      reference: investorReference,
    });
  }
}

async function ensureSeedServiceProvider(params: {
  name: string;
  email: string;
  phone: string;
  type: ServiceProviderType;
  companyName: string;
  licenseNumber: string;
  city: string;
  serviceRadiusKm: number;
  managerId: string;
  rating?: number;
  reviewCount?: number;
}) {
  const user = await upsertUser({
    name: params.name,
    email: params.email,
    role: Role.SERVICE_PROVIDER,
    phone: params.phone,
  });

  await ensureAccount({
    userId: user.id,
    type: AccountType.USER,
    balance: 0,
  });

  await ensureWallet(user.id, 0);

  return prisma.serviceProvider.upsert({
    where: { userId: user.id },
    update: {
      type: params.type,
      rating: params.rating ?? 4.5,
      reviewCount: params.reviewCount ?? 0,
      isActive: true,
      verificationStatus: ProviderVerificationStatus.VERIFIED,
      companyName: params.companyName,
      licenseNumber: params.licenseNumber,
      city: params.city,
      serviceRadiusKm: params.serviceRadiusKm,
      managerId: params.managerId,
      source: ProviderSource.PLATFORM,
    },
    create: {
      userId: user.id,
      type: params.type,
      rating: params.rating ?? 4.5,
      reviewCount: params.reviewCount ?? 0,
      isActive: true,
      verificationStatus: ProviderVerificationStatus.VERIFIED,
      companyName: params.companyName,
      licenseNumber: params.licenseNumber,
      city: params.city,
      serviceRadiusKm: params.serviceRadiusKm,
      managerId: params.managerId,
      source: ProviderSource.PLATFORM,
    },
  });
}

async function main() {
  console.log('🌱 Starting clean Zyrent seed...'); 

  // =====================================================
  // USERS
  // =====================================================
  const admin = await upsertUser({
    name: 'Sarah Admin',
    email: 'admin@zyrent.com',
    role: Role.ADMIN,
    phone: '+256700000001',
  });

  const manager = await upsertUser({
    name: 'Michael Manager',
    email: 'manager@zyrent.com',
    role: Role.MANAGER,
    phone: '+256700000002',
  });

  const investorJohn = await upsertUser({
    name: 'John Doe',
    email: 'john@zyrent.com',
    role: Role.INVESTOR,
    phone: '+256700000003',
  });

  const investorMary = await upsertUser({
    name: 'Mary Investor',
    email: 'mary@zyrent.com',
    role: Role.INVESTOR,
    phone: '+256700000004',
  });

  const residentAliceUser = await upsertUser({
    name: 'Alice Resident',
    email: 'alice@zyrent.com',
    role: Role.RESIDENT,
    phone: '+256700000005',
  });

  const residentBrianUser = await upsertUser({
    name: 'Brian Resident',
    email: 'brian@zyrent.com',
    role: Role.RESIDENT,
    phone: '+256700000006',
  });

  const providerUser = await upsertUser({
    name: 'Peter Plumber',
    email: 'provider@zyrent.com',
    role: Role.SERVICE_PROVIDER,
    phone: '+256700000007',
  });

  const electricianUser = await upsertUser({
    name: 'Eva Electric',
    email: 'electrician@zyrent.com',
    role: Role.SERVICE_PROVIDER,
    phone: '+256700000008',
  });

  const securityUser = await upsertUser({
    name: 'Sam Security',
    email: 'security@zyrent.com',
    role: Role.SERVICE_PROVIDER,
    phone: '+256700000009',
  });

  // =====================================================
  // USER ACCOUNTS + WALLETS
  // =====================================================
  const adminAccount = await ensureAccount({
    userId: admin.id,
    type: AccountType.USER,
    balance: 0,
  });

  await ensureAccount({
    userId: manager.id,
    type: AccountType.USER,
    balance: 0,
  });

  const johnAccount = await ensureAccount({
    userId: investorJohn.id,
    type: AccountType.USER,
    balance: 1145000,
  });

  const maryAccount = await ensureAccount({
    userId: investorMary.id,
    type: AccountType.USER,
    balance: 1505000,
  });

  const aliceAccount = await ensureAccount({
    userId: residentAliceUser.id,
    type: AccountType.USER,
    balance: 4000000,
  });

  const brianAccount = await ensureAccount({
    userId: residentBrianUser.id,
    type: AccountType.USER,
    balance: 3000000,
  });

  const providerAccount = await ensureAccount({
    userId: providerUser.id,
    type: AccountType.USER,
    balance: 180000,
  });

  const electricianAccount = await ensureAccount({
    userId: electricianUser.id,
    type: AccountType.USER,
    balance: 0,
  });

  const securityAccount = await ensureAccount({
    userId: securityUser.id,
    type: AccountType.USER,
    balance: 0,
  });

  const johnWallet = await ensureWallet(investorJohn.id, 1145000);
  const maryWallet = await ensureWallet(investorMary.id, 1505000);
  const aliceWallet = await ensureWallet(residentAliceUser.id, 4000000);
  const brianWallet = await ensureWallet(residentBrianUser.id, 3000000);
  const providerWallet = await ensureWallet(providerUser.id, 180000);
  await ensureWallet(electricianUser.id, 0);
  await ensureWallet(securityUser.id, 0);

  // =====================================================
  // KYC
  // =====================================================
  await prisma.kycVerification.upsert({
    where: { userId: investorJohn.id },
    update: {
      fullName: 'John Doe',
      status: KycStatus.APPROVED,
      reviewedBy: admin.id,
      reviewedAt: new Date(),
    },
    create: {
      userId: investorJohn.id,
      fullName: 'John Doe',
      dateOfBirth: new Date('1993-04-12'),
      nationality: 'Ugandan',
      address: 'Naguru, Kampala',
      idType: 'National ID',
      idNumber: 'CM93041201ABC',
      documentUrl: 'https://example.com/docs/john-kyc.pdf',
      status: KycStatus.APPROVED,
      reviewedBy: admin.id,
      reviewedAt: new Date(),
    },
  });

  await prisma.kycVerification.upsert({
    where: { userId: investorMary.id },
    update: {
      fullName: 'Mary Investor',
      status: KycStatus.APPROVED,
      reviewedBy: admin.id,
      reviewedAt: new Date(),
    },
    create: {
      userId: investorMary.id,
      fullName: 'Mary Investor',
      dateOfBirth: new Date('1991-08-20'),
      nationality: 'Ugandan',
      address: 'Kololo, Kampala',
      idType: 'Passport',
      idNumber: 'PA12345678',
      documentUrl: 'https://example.com/docs/mary-kyc.pdf',
      status: KycStatus.APPROVED,
      reviewedBy: admin.id,
      reviewedAt: new Date(),
    },
  });

  // =====================================================
  // PROPERTIES
  // =====================================================
  const naguruProperty = await prisma.property.upsert({
    where: {
      title_phase: {
        title: 'Zyrent Apartments',
        phase: 1,
      },
    },
    update: {
      slug: 'zyrent-apartments',
      location: 'Naguru',
      totalUnits: 2,
      version: 1,
      isActive: true,
      ownerId: investorJohn.id,
      managerId: manager.id,
      serviceChargeAmount: 150000,
      garbageFeeAmount: 25000,
      expenseApprovalThreshold: 200000,
      autoApproveSmallExpenses: true,
    },
    create: {
      title: 'Zyrent Apartments',
      slug: 'zyrent-apartments',
      location: 'Naguru',
      totalUnits: 2,
      phase: 1,
      version: 1,
      isActive: true,
      ownerId: investorJohn.id,
      managerId: manager.id,
      serviceChargeAmount: 150000,
      garbageFeeAmount: 25000,
      expenseApprovalThreshold: 200000,
      autoApproveSmallExpenses: true,
    },
  });

  const crestProperty = await prisma.property.upsert({
    where: {
      title_phase: {
        title: 'Crest View Residences',
        phase: 1,
      },
    },
    update: {
      slug: 'crest-view-residences',
      location: 'Bugolobi',
      totalUnits: 1,
      version: 1,
      isActive: true,
      ownerId: investorMary.id,
      managerId: manager.id,
      serviceChargeAmount: 120000,
      garbageFeeAmount: 25000,
      expenseApprovalThreshold: 200000,
      autoApproveSmallExpenses: true,
    },
    create: {
      title: 'Crest View Residences',
      slug: 'crest-view-residences',
      location: 'Bugolobi',
      totalUnits: 1,
      phase: 1,
      version: 1,
      isActive: true,
      ownerId: investorMary.id,
      managerId: manager.id,
      serviceChargeAmount: 120000,
      garbageFeeAmount: 25000,
      expenseApprovalThreshold: 200000,
      autoApproveSmallExpenses: true,
    },
  });
    const naguruAccount = await ensureAccount({
    propertyId: naguruProperty.id,
    type: AccountType.PROPERTY,
    balance: 10180000,
  });

    const crestAccount = await ensureAccount({
    propertyId: crestProperty.id,
    type: AccountType.PROPERTY,
    balance: 10645000,
  });

  // =====================================================
  // UNITS
  // =====================================================
  const unitA04 = await prisma.unit.upsert({
    where: {
      propertyId_number: {
        propertyId: naguruProperty.id,
        number: 'A04',
      },
    },
    update: {
      rentAmount: 1200000,
      rentCycle: RentCycle.MONTHLY,
      status: UnitStatus.OCCUPIED,
    },
    create: {
      propertyId: naguruProperty.id,
      number: 'A04',
      rentAmount: 1200000,
      rentCycle: RentCycle.MONTHLY,
      status: UnitStatus.OCCUPIED,
    },
  });

  const unitB12 = await prisma.unit.upsert({
    where: {
      propertyId_number: {
        propertyId: crestProperty.id,
        number: 'B12',
      },
    },
    update: {
      rentAmount: 950000,
      rentCycle: RentCycle.MONTHLY,
      status: UnitStatus.OCCUPIED,
    },
    create: {
      propertyId: crestProperty.id,
      number: 'B12',
      rentAmount: 950000,
      rentCycle: RentCycle.MONTHLY,
      status: UnitStatus.OCCUPIED,
    },
  });

  const unitC07 = await prisma.unit.upsert({
    where: {
      propertyId_number: {
        propertyId: naguruProperty.id,
        number: 'C07',
      },
    },
    update: {
      rentAmount: 850000,
      rentCycle: RentCycle.MONTHLY,
      status: UnitStatus.VACANT,
    },
    create: {
      propertyId: naguruProperty.id,
      number: 'C07',
      rentAmount: 850000,
      rentCycle: RentCycle.MONTHLY,
      status: UnitStatus.VACANT,
    },
  });

  // =====================================================
  // RESIDENT PROFILES
  // =====================================================
  const aliceResident = await prisma.resident.upsert({
    where: { userId: residentAliceUser.id },
    update: {
      unitId: unitA04.id,
      status: ResidentStatus.ACTIVE,
      createdById: manager.id,
    },
    create: {
      userId: residentAliceUser.id,
      unitId: unitA04.id,
      status: ResidentStatus.ACTIVE,
      createdById: manager.id,
    },
  });

  const brianResident = await prisma.resident.upsert({
    where: { userId: residentBrianUser.id },
    update: {
      unitId: unitB12.id,
      status: ResidentStatus.ACTIVE,
      createdById: manager.id,
    },
    create: {
      userId: residentBrianUser.id,
      unitId: unitB12.id,
      status: ResidentStatus.ACTIVE,
      createdById: manager.id,
    },
  });

  // =====================================================
  // RENT CONTRACTS
  // =====================================================
  let aliceContract = await prisma.rentContract.findFirst({
    where: {
      residentId: aliceResident.id,
      unitId: unitA04.id,
      isActive: true,
    },
  });

  if (!aliceContract) {
    aliceContract = await prisma.rentContract.create({
      data: {
        residentId: aliceResident.id,
        unitId: unitA04.id,
        rentAmount: 1200000,
        depositAmount: 1200000,
        serviceCharge: 150000,
        garbageFee: 25000,
        initialTermMonths: 12,
        startDate: new Date('2026-01-01'),
        billingAnchorDay: 1,
        nextBillingDate: new Date('2026-05-01'),
        isActive: true,
      },
    });
  }

  let brianContract = await prisma.rentContract.findFirst({
    where: {
      residentId: brianResident.id,
      unitId: unitB12.id,
      isActive: true,
    },
  });

  if (!brianContract) {
    brianContract = await prisma.rentContract.create({
      data: {
        residentId: brianResident.id,
        unitId: unitB12.id,
        rentAmount: 950000,
        depositAmount: 950000,
        serviceCharge: 120000,
        garbageFee: 25000,
        initialTermMonths: 12,
        startDate: new Date('2026-01-01'),
        billingAnchorDay: 1,
        nextBillingDate: new Date('2026-05-01'),
        isActive: true,
      },
    });
  }

  // =====================================================
  // RENT INVOICES
  // =====================================================
  const aliceRentInvoiceApr = await prisma.rentInvoice.upsert({
    where: {
      rentContractId_period_kind: {
        rentContractId: aliceContract.id,
        period: '2026-04',
        kind: InvoiceKind.RENT,
      },
    },
    update: {
      residentId: aliceResident.id,
      unitId: unitA04.id,
      kind: InvoiceKind.RENT,
      dueDate: new Date('2026-04-05'),
      totalAmount: 1200000,
      paidAmount: 1200000,
      status: InvoiceStatus.PAID,
    },
    create: {
      rentContractId: aliceContract.id,
      residentId: aliceResident.id,
      unitId: unitA04.id,
      kind: InvoiceKind.RENT,
      period: '2026-04',
      dueDate: new Date('2026-04-05'),
      totalAmount: 1200000,
      paidAmount: 1200000,
      status: InvoiceStatus.PAID,
    },
  });

  await prisma.rentInvoice.upsert({
    where: {
      rentContractId_period_kind: {
        rentContractId: aliceContract.id,
        period: '2026-04',
        kind: InvoiceKind.SERVICE_CHARGE,
      },
    },
    update: {
      residentId: aliceResident.id,
      unitId: unitA04.id,
      kind: InvoiceKind.SERVICE_CHARGE,
      dueDate: new Date('2026-04-05'),
      totalAmount: 150000,
      paidAmount: 0,
      status: InvoiceStatus.ISSUED,
    },
    create: {
      rentContractId: aliceContract.id,
      residentId: aliceResident.id,
      unitId: unitA04.id,
      kind: InvoiceKind.SERVICE_CHARGE,
      period: '2026-04',
      dueDate: new Date('2026-04-05'),
      totalAmount: 150000,
      paidAmount: 0,
      status: InvoiceStatus.ISSUED,
    },
  });

  await prisma.rentInvoice.upsert({
    where: {
      rentContractId_period_kind: {
        rentContractId: aliceContract.id,
        period: '2026-04',
        kind: InvoiceKind.GARBAGE,
      },
    },
    update: {
      residentId: aliceResident.id,
      unitId: unitA04.id,
      kind: InvoiceKind.GARBAGE,
      dueDate: new Date('2026-04-05'),
      totalAmount: 25000,
      paidAmount: 0,
      status: InvoiceStatus.ISSUED,
    },
    create: {
      rentContractId: aliceContract.id,
      residentId: aliceResident.id,
      unitId: unitA04.id,
      kind: InvoiceKind.GARBAGE,
      period: '2026-04',
      dueDate: new Date('2026-04-05'),
      totalAmount: 25000,
      paidAmount: 0,
      status: InvoiceStatus.ISSUED,
    },
  });

  const brianRentInvoiceApr = await prisma.rentInvoice.upsert({
    where: {
      rentContractId_period_kind: {
        rentContractId: brianContract.id,
        period: '2026-04',
        kind: InvoiceKind.RENT,
      },
    },
    update: {
      residentId: brianResident.id,
      unitId: unitB12.id,
      kind: InvoiceKind.RENT,
      dueDate: new Date('2026-04-05'),
      totalAmount: 950000,
      paidAmount: 950000,
      status: InvoiceStatus.PAID,
    },
    create: {
      rentContractId: brianContract.id,
      residentId: brianResident.id,
      unitId: unitB12.id,
      kind: InvoiceKind.RENT,
      period: '2026-04',
      dueDate: new Date('2026-04-05'),
      totalAmount: 950000,
      paidAmount: 950000,
      status: InvoiceStatus.PAID,
    },
  });

  const brianServiceInvoiceApr = await prisma.rentInvoice.upsert({
    where: {
      rentContractId_period_kind: {
        rentContractId: brianContract.id,
        period: '2026-04',
        kind: InvoiceKind.SERVICE_CHARGE,
      },
    },
    update: {
      residentId: brianResident.id,
      unitId: unitB12.id,
      kind: InvoiceKind.SERVICE_CHARGE,
      dueDate: new Date('2026-04-05'),
      totalAmount: 120000,
      paidAmount: 120000,
      status: InvoiceStatus.PAID,
    },
    create: {
      rentContractId: brianContract.id,
      residentId: brianResident.id,
      unitId: unitB12.id,
      kind: InvoiceKind.SERVICE_CHARGE,
      period: '2026-04',
      dueDate: new Date('2026-04-05'),
      totalAmount: 120000,
      paidAmount: 120000,
      status: InvoiceStatus.PAID,
    },
  });

  const brianGarbageInvoiceApr = await prisma.rentInvoice.upsert({
    where: {
      rentContractId_period_kind: {
        rentContractId: brianContract.id,
        period: '2026-04',
        kind: InvoiceKind.GARBAGE,
      },
    },
    update: {
      residentId: brianResident.id,
      unitId: unitB12.id,
      kind: InvoiceKind.GARBAGE,
      dueDate: new Date('2026-04-05'),
      totalAmount: 25000,
      paidAmount: 25000,
      status: InvoiceStatus.PAID,
    },
    create: {
      rentContractId: brianContract.id,
      residentId: brianResident.id,
      unitId: unitB12.id,
      kind: InvoiceKind.GARBAGE,
      period: '2026-04',
      dueDate: new Date('2026-04-05'),
      totalAmount: 25000,
      paidAmount: 25000,
      status: InvoiceStatus.PAID,
    },
  });

  // =====================================================
  // PAYMENTS
  // =====================================================
  const paymentAlice = await prisma.payment.upsert({
    where: { providerRef: 'SEED-PAY-ALICE-APR-2026' },
    update: {
      amount: 1200000,
      channel: PaymentChannel.MOBILE_MONEY,
      provider: PaymentProvider.MTN,
      status: PaymentStatus.SUCCESS,
      invoiceId: aliceRentInvoiceApr.id,
    },
    create: {
      amount: 1200000,
      channel: PaymentChannel.MOBILE_MONEY,
      provider: PaymentProvider.MTN,
      providerRef: 'SEED-PAY-ALICE-APR-2026',
      status: PaymentStatus.SUCCESS,
      invoiceId: aliceRentInvoiceApr.id,
    },
  });

  const paymentBrianRent = await prisma.payment.upsert({
    where: { providerRef: 'SEED-PAY-BRIAN-APR-2026-RENT' },
    update: {
      amount: 950000,
      channel: PaymentChannel.MOBILE_MONEY,
      provider: PaymentProvider.FLUTTERWAVE,
      status: PaymentStatus.SUCCESS,
      invoiceId: brianRentInvoiceApr.id,
    },
    create: {
      amount: 950000,
      channel: PaymentChannel.MOBILE_MONEY,
      provider: PaymentProvider.FLUTTERWAVE,
      providerRef: 'SEED-PAY-BRIAN-APR-2026-RENT',
      status: PaymentStatus.SUCCESS,
      invoiceId: brianRentInvoiceApr.id,
    },
  });

  const paymentBrianService = await prisma.payment.upsert({
    where: { providerRef: 'SEED-PAY-BRIAN-APR-2026-SERVICE' },
    update: {
      amount: 120000,
      channel: PaymentChannel.MOBILE_MONEY,
      provider: PaymentProvider.FLUTTERWAVE,
      status: PaymentStatus.SUCCESS,
      invoiceId: brianServiceInvoiceApr.id,
    },
    create: {
      amount: 120000,
      channel: PaymentChannel.MOBILE_MONEY,
      provider: PaymentProvider.FLUTTERWAVE,
      providerRef: 'SEED-PAY-BRIAN-APR-2026-SERVICE',
      status: PaymentStatus.SUCCESS,
      invoiceId: brianServiceInvoiceApr.id,
    },
  });

  const paymentBrianGarbage = await prisma.payment.upsert({
    where: { providerRef: 'SEED-PAY-BRIAN-APR-2026-GARBAGE' },
    update: {
      amount: 25000,
      channel: PaymentChannel.MOBILE_MONEY,
      provider: PaymentProvider.FLUTTERWAVE,
      status: PaymentStatus.SUCCESS,
      invoiceId: brianGarbageInvoiceApr.id,
    },
    create: {
      amount: 25000,
      channel: PaymentChannel.MOBILE_MONEY,
      provider: PaymentProvider.FLUTTERWAVE,
      providerRef: 'SEED-PAY-BRIAN-APR-2026-GARBAGE',
      status: PaymentStatus.SUCCESS,
      invoiceId: brianGarbageInvoiceApr.id,
    },
  });

  // =====================================================
  // LEDGER
  // =====================================================
  await ensureLedgerEntry({
    accountId: johnAccount.id,
    credit: 12000000,
    source: LedgerSource.EXTERNAL_FUNDING,
    reference: 'EXT-JOHN-001',
  });

  await ensureLedgerEntry({
    accountId: maryAccount.id,
    credit: 10000000,
    source: LedgerSource.EXTERNAL_FUNDING,
    reference: 'EXT-MARY-001',
  });

  await ensureLedgerEntry({
    accountId: aliceAccount.id,
    credit: 4000000,
    source: LedgerSource.EXTERNAL_FUNDING,
    reference: 'EXT-ALICE-001',
  });

  await ensureLedgerEntry({
    accountId: brianAccount.id,
    credit: 3000000,
    source: LedgerSource.EXTERNAL_FUNDING,
    reference: 'EXT-BRIAN-001',
  });

  await ensureLedgerEntry({
    accountId: johnAccount.id,
    debit: 6000000,
    source: LedgerSource.INVESTMENT,
    reference: 'INV-JOHN-NAGURU',
    propertyId: naguruProperty.id,
  });

  await ensureLedgerEntry({
    accountId: naguruAccount.id,
    credit: 6000000,
    source: LedgerSource.INVESTMENT,
    reference: 'INV-JOHN-NAGURU',
    propertyId: naguruProperty.id,
  });

  await ensureLedgerEntry({
    accountId: johnAccount.id,
    debit: 5000000,
    source: LedgerSource.INVESTMENT,
    reference: 'INV-JOHN-BUGOLOBI',
    propertyId: crestProperty.id,
  });

  await ensureLedgerEntry({
    accountId: crestAccount.id,
    credit: 5000000,
    source: LedgerSource.INVESTMENT,
    reference: 'INV-JOHN-BUGOLOBI',
    propertyId: crestProperty.id,
  });

  await ensureLedgerEntry({
    accountId: maryAccount.id,
    debit: 4000000,
    source: LedgerSource.INVESTMENT,
    reference: 'INV-MARY-NAGURU',
    propertyId: naguruProperty.id,
  });

  await ensureLedgerEntry({
    accountId: naguruAccount.id,
    credit: 4000000,
    source: LedgerSource.INVESTMENT,
    reference: 'INV-MARY-NAGURU',
    propertyId: naguruProperty.id,
  });

  await ensureLedgerEntry({
    accountId: maryAccount.id,
    debit: 5000000,
    source: LedgerSource.INVESTMENT,
    reference: 'INV-MARY-BUGOLOBI',
    propertyId: crestProperty.id,
  });

  await ensureLedgerEntry({
    accountId: crestAccount.id,
    credit: 5000000,
    source: LedgerSource.INVESTMENT,
    reference: 'INV-MARY-BUGOLOBI',
    propertyId: crestProperty.id,
  });

  await ensureLedgerEntry({
    accountId: aliceAccount.id,
    debit: 1200000,
    source: LedgerSource.RENT_PAYMENT,
    reference: 'SEED-PAY-ALICE-APR-2026',
    propertyId: naguruProperty.id,
    rentInvoiceId: aliceRentInvoiceApr.id,
    paymentId: paymentAlice.id,
  });

  await ensureLedgerEntry({
    accountId: naguruAccount.id,
    credit: 1200000,
    source: LedgerSource.RENT_PAYMENT,
    reference: 'SEED-PAY-ALICE-APR-2026',
    propertyId: naguruProperty.id,
    rentInvoiceId: aliceRentInvoiceApr.id,
    paymentId: paymentAlice.id,
  });

  await ensureLedgerEntry({
    accountId: brianAccount.id,
    debit: 950000,
    source: LedgerSource.RENT_PAYMENT,
    reference: 'SEED-PAY-BRIAN-APR-2026-RENT',
    propertyId: crestProperty.id,
    rentInvoiceId: brianRentInvoiceApr.id,
    paymentId: paymentBrianRent.id,
  });

  await ensureLedgerEntry({
    accountId: crestAccount.id,
    credit: 950000,
    source: LedgerSource.RENT_PAYMENT,
    reference: 'SEED-PAY-BRIAN-APR-2026-RENT',
    propertyId: crestProperty.id,
    rentInvoiceId: brianRentInvoiceApr.id,
    paymentId: paymentBrianRent.id,
  });

  await ensureLedgerEntry({
    accountId: brianAccount.id,
    debit: 120000,
    source: LedgerSource.SERVICE_CHARGE_PAYMENT,
    reference: 'SEED-PAY-BRIAN-APR-2026-SERVICE',
    propertyId: crestProperty.id,
    rentInvoiceId: brianServiceInvoiceApr.id,
    paymentId: paymentBrianService.id,
  });

  await ensureLedgerEntry({
    accountId: crestAccount.id,
    credit: 120000,
    source: LedgerSource.SERVICE_CHARGE_PAYMENT,
    reference: 'SEED-PAY-BRIAN-APR-2026-SERVICE',
    propertyId: crestProperty.id,
    rentInvoiceId: brianServiceInvoiceApr.id,
    paymentId: paymentBrianService.id,
  });

  await ensureLedgerEntry({
    accountId: brianAccount.id,
    debit: 25000,
    source: LedgerSource.GARBAGE_PAYMENT,
    reference: 'SEED-PAY-BRIAN-APR-2026-GARBAGE',
    propertyId: crestProperty.id,
    rentInvoiceId: brianGarbageInvoiceApr.id,
    paymentId: paymentBrianGarbage.id,
  });

  await ensureLedgerEntry({
    accountId: crestAccount.id,
    credit: 25000,
    source: LedgerSource.GARBAGE_PAYMENT,
    reference: 'SEED-PAY-BRIAN-APR-2026-GARBAGE',
    propertyId: crestProperty.id,
    rentInvoiceId: brianGarbageInvoiceApr.id,
    paymentId: paymentBrianGarbage.id,
  });

  // =====================================================
  // INVESTMENTS TABLE
  // Share model: only fully sold properties operate.
  // Zyrent Apartments: John 60%, Mary 40%.
  // Crest View Residences: John 50%, Mary 50%.
  // =====================================================
  await prisma.investment.deleteMany({
    where: {
      investorId: { in: [investorJohn.id, investorMary.id] },
      propertyId: { in: [naguruProperty.id, crestProperty.id] },
    },
  });

  const investmentsToEnsure = [
    {
      propertyId: naguruProperty.id,
      investorId: investorJohn.id,
      amount: 6000000,
    },
    {
      propertyId: naguruProperty.id,
      investorId: investorMary.id,
      amount: 4000000,
    },
    {
      propertyId: crestProperty.id,
      investorId: investorJohn.id,
      amount: 5000000,
    },
    {
      propertyId: crestProperty.id,
      investorId: investorMary.id,
      amount: 5000000,
    },
  ];

  for (const item of investmentsToEnsure) {
    await prisma.investment.create({ data: item });
  }

  // =====================================================
  // INVESTMENT OFFERS
  // =====================================================
  const naguruOffer = await prisma.investmentOffer.upsert({
    where: { propertyId: naguruProperty.id },
    update: {
      totalShares: 100,
      pricePerShare: 100000,
      sharesSold: 100,
      isActive: true,
    },
    create: {
      propertyId: naguruProperty.id,
      totalShares: 100,
      pricePerShare: 100000,
      sharesSold: 100,
      isActive: true,
    },
  });

  const crestOffer = await prisma.investmentOffer.upsert({
    where: { propertyId: crestProperty.id },
    update: {
      totalShares: 100,
      pricePerShare: 100000,
      sharesSold: 100,
      isActive: true,
    },
    create: {
      propertyId: crestProperty.id,
      totalShares: 100,
      pricePerShare: 100000,
      sharesSold: 100,
      isActive: true,
    },
  });

  // =====================================================
  // INVESTOR SHARES
  // =====================================================
  const johnNaguruShares = await prisma.investorShare.upsert({
    where: {
      investorId_propertyId: {
        investorId: investorJohn.id,
        propertyId: naguruProperty.id,
      },
    },
    update: {
      offerId: naguruOffer.id,
      sharesOwned: 60,
      amountPaid: 6000000,
      source: InvestmentSource.PLATFORM,
    },
    create: {
      investorId: investorJohn.id,
      propertyId: naguruProperty.id,
      offerId: naguruOffer.id,
      sharesOwned: 60,
      amountPaid: 6000000,
      source: InvestmentSource.PLATFORM,
    },
  });

  const maryNaguruShares = await prisma.investorShare.upsert({
    where: {
      investorId_propertyId: {
        investorId: investorMary.id,
        propertyId: naguruProperty.id,
      },
    },
    update: {
      offerId: naguruOffer.id,
      sharesOwned: 40,
      amountPaid: 4000000,
      source: InvestmentSource.PLATFORM,
    },
    create: {
      investorId: investorMary.id,
      propertyId: naguruProperty.id,
      offerId: naguruOffer.id,
      sharesOwned: 40,
      amountPaid: 4000000,
      source: InvestmentSource.PLATFORM,
    },
  });

  const johnCrestShares = await prisma.investorShare.upsert({
    where: {
      investorId_propertyId: {
        investorId: investorJohn.id,
        propertyId: crestProperty.id,
      },
    },
    update: {
      offerId: crestOffer.id,
      sharesOwned: 50,
      amountPaid: 5000000,
      source: InvestmentSource.PLATFORM,
    },
    create: {
      investorId: investorJohn.id,
      propertyId: crestProperty.id,
      offerId: crestOffer.id,
      sharesOwned: 50,
      amountPaid: 5000000,
      source: InvestmentSource.PLATFORM,
    },
  });

  const maryCrestShares = await prisma.investorShare.upsert({
    where: {
      investorId_propertyId: {
        investorId: investorMary.id,
        propertyId: crestProperty.id,
      },
    },
    update: {
      offerId: crestOffer.id,
      sharesOwned: 50,
      amountPaid: 5000000,
      source: InvestmentSource.PLATFORM,
    },
    create: {
      investorId: investorMary.id,
      propertyId: crestProperty.id,
      offerId: crestOffer.id,
      sharesOwned: 50,
      amountPaid: 5000000,
      source: InvestmentSource.PLATFORM,
    },
  });

  // =====================================================
  // SHARE TRANSACTIONS
  // =====================================================
  await prisma.shareTransaction.deleteMany({
    where: {
      investorId: { in: [investorJohn.id, investorMary.id] },
      propertyId: { in: [naguruProperty.id, crestProperty.id] },
      type: ShareTransactionType.BUY,
    },
  });

  const shareTransactionsToEnsure = [
    {
      investorId: investorJohn.id,
      propertyId: naguruProperty.id,
      investorShareId: johnNaguruShares.id,
      shares: 60,
      amount: 6000000,
      type: ShareTransactionType.BUY,
    },
    {
      investorId: investorMary.id,
      propertyId: naguruProperty.id,
      investorShareId: maryNaguruShares.id,
      shares: 40,
      amount: 4000000,
      type: ShareTransactionType.BUY,
    },
    {
      investorId: investorJohn.id,
      propertyId: crestProperty.id,
      investorShareId: johnCrestShares.id,
      shares: 50,
      amount: 5000000,
      type: ShareTransactionType.BUY,
    },
    {
      investorId: investorMary.id,
      propertyId: crestProperty.id,
      investorShareId: maryCrestShares.id,
      shares: 50,
      amount: 5000000,
      type: ShareTransactionType.BUY,
    },
  ];

  for (const tx of shareTransactionsToEnsure) {
    await prisma.shareTransaction.create({ data: tx });
  }

  // =====================================================
  // SHARE LISTING
  // =====================================================
  const existingListing = await prisma.shareListing.findFirst({
    where: {
      investorId: investorMary.id,
      propertyId: naguruProperty.id,
      isActive: true,
    },
  });

  if (!existingListing) {
    await prisma.shareListing.create({
      data: {
        investorId: investorMary.id,
        propertyId: naguruProperty.id,
        shares: 3,
        pricePerShare: 120000,
        isActive: true,
      },
    });
  }

  // =====================================================
  // PROPERTY PROFITS + PROFIT DISTRIBUTIONS
  // =====================================================
  await prisma.propertyProfit.upsert({
    where: {
      propertyId_periodMonth_periodYear: {
        propertyId: naguruProperty.id,
        periodMonth: 4,
        periodYear: 2026,
      },
    },
    update: {
      totalProfit: 1400000,
      distributedAmount: 700000,
    },
    create: {
      propertyId: naguruProperty.id,
      periodMonth: 4,
      periodYear: 2026,
      totalProfit: 1400000,
      distributedAmount: 700000,
    },
  });

  await prisma.propertyProfit.upsert({
    where: {
      propertyId_periodMonth_periodYear: {
        propertyId: crestProperty.id,
        periodMonth: 4,
        periodYear: 2026,
      },
    },
    update: {
      totalProfit: 900000,
      distributedAmount: 450000,
    },
    create: {
      propertyId: crestProperty.id,
      periodMonth: 4,
      periodYear: 2026,
      totalProfit: 900000,
      distributedAmount: 450000,
    },
  });

  await prisma.profitDistribution.upsert({
    where: {
      propertyId_investorId_periodMonth_periodYear: {
        propertyId: naguruProperty.id,
        investorId: investorJohn.id,
        periodMonth: 4,
        periodYear: 2026,
      },
    },
    update: { amount: 420000 },
    create: {
      propertyId: naguruProperty.id,
      investorId: investorJohn.id,
      amount: 420000,
      periodMonth: 4,
      periodYear: 2026,
    },
  });

  await prisma.profitDistribution.upsert({
    where: {
      propertyId_investorId_periodMonth_periodYear: {
        propertyId: naguruProperty.id,
        investorId: investorMary.id,
        periodMonth: 4,
        periodYear: 2026,
      },
    },
    update: { amount: 280000 },
    create: {
      propertyId: naguruProperty.id,
      investorId: investorMary.id,
      amount: 280000,
      periodMonth: 4,
      periodYear: 2026,
    },
  });

  await prisma.profitDistribution.upsert({
    where: {
      propertyId_investorId_periodMonth_periodYear: {
        propertyId: crestProperty.id,
        investorId: investorJohn.id,
        periodMonth: 4,
        periodYear: 2026,
      },
    },
    update: { amount: 225000 },
    create: {
      propertyId: crestProperty.id,
      investorId: investorJohn.id,
      amount: 225000,
      periodMonth: 4,
      periodYear: 2026,
    },
  });

  await prisma.profitDistribution.upsert({
    where: {
      propertyId_investorId_periodMonth_periodYear: {
        propertyId: crestProperty.id,
        investorId: investorMary.id,
        periodMonth: 4,
        periodYear: 2026,
      },
    },
    update: { amount: 225000 },
    create: {
      propertyId: crestProperty.id,
      investorId: investorMary.id,
      amount: 225000,
      periodMonth: 4,
      periodYear: 2026,
    },
  });

  await ensureLedgerEntry({
    accountId: naguruAccount.id,
    debit: 420000,
    source: LedgerSource.PROFIT_DISTRIBUTION,
    reference: 'PROFIT-JOHN-NAGURU-APR-2026',
    propertyId: naguruProperty.id,
  });

  await ensureLedgerEntry({
    accountId: johnAccount.id,
    credit: 420000,
    source: LedgerSource.PROFIT_DISTRIBUTION,
    reference: 'PROFIT-JOHN-NAGURU-APR-2026',
    propertyId: naguruProperty.id,
  });

  await ensureLedgerEntry({
    accountId: crestAccount.id,
    debit: 225000,
    source: LedgerSource.PROFIT_DISTRIBUTION,
    reference: 'PROFIT-JOHN-CREST-APR-2026',
    propertyId: crestProperty.id,
  });

  await ensureLedgerEntry({
    accountId: johnAccount.id,
    credit: 225000,
    source: LedgerSource.PROFIT_DISTRIBUTION,
    reference: 'PROFIT-JOHN-CREST-APR-2026',
    propertyId: crestProperty.id,
  });

  await ensureLedgerEntry({
    accountId: naguruAccount.id,
    debit: 280000,
    source: LedgerSource.PROFIT_DISTRIBUTION,
    reference: 'PROFIT-MARY-NAGURU-APR-2026',
    propertyId: naguruProperty.id,
  });

  await ensureLedgerEntry({
    accountId: maryAccount.id,
    credit: 280000,
    source: LedgerSource.PROFIT_DISTRIBUTION,
    reference: 'PROFIT-MARY-NAGURU-APR-2026',
    propertyId: naguruProperty.id,
  });

  await ensureLedgerEntry({
    accountId: crestAccount.id,
    debit: 225000,
    source: LedgerSource.PROFIT_DISTRIBUTION,
    reference: 'PROFIT-MARY-CREST-APR-2026',
    propertyId: crestProperty.id,
  });

  await ensureLedgerEntry({
    accountId: maryAccount.id,
    credit: 225000,
    source: LedgerSource.PROFIT_DISTRIBUTION,
    reference: 'PROFIT-MARY-CREST-APR-2026',
    propertyId: crestProperty.id,
  });

  // =====================================================
  // WALLET TRANSACTIONS
  // =====================================================
  await ensureWalletTransaction({
    walletId: johnWallet.id,
    type: WalletTransactionType.DEPOSIT,
    status: WalletTransactionStatus.COMPLETED,
    amount: 12000000,
    reference: 'EXT-JOHN-001',
  });

  await ensureWalletTransaction({
    walletId: johnWallet.id,
    type: WalletTransactionType.PROFIT,
    status: WalletTransactionStatus.COMPLETED,
    amount: 420000,
    reference: 'PROFIT-JOHN-NAGURU-APR-2026',
  });

  await ensureWalletTransaction({
    walletId: johnWallet.id,
    type: WalletTransactionType.PROFIT,
    status: WalletTransactionStatus.COMPLETED,
    amount: 225000,
    reference: 'PROFIT-JOHN-CREST-APR-2026',
  });

  await ensureWalletTransaction({
    walletId: maryWallet.id,
    type: WalletTransactionType.DEPOSIT,
    status: WalletTransactionStatus.COMPLETED,
    amount: 10000000,
    reference: 'EXT-MARY-001',
  });

  await ensureWalletTransaction({
    walletId: maryWallet.id,
    type: WalletTransactionType.PROFIT,
    status: WalletTransactionStatus.COMPLETED,
    amount: 280000,
    reference: 'PROFIT-MARY-NAGURU-APR-2026',
  });

  await ensureWalletTransaction({
    walletId: maryWallet.id,
    type: WalletTransactionType.PROFIT,
    status: WalletTransactionStatus.COMPLETED,
    amount: 225000,
    reference: 'PROFIT-MARY-CREST-APR-2026',
  });

  await ensureWalletTransaction({
    walletId: aliceWallet.id,
    type: WalletTransactionType.DEPOSIT,
    status: WalletTransactionStatus.COMPLETED,
    amount: 4000000,
    reference: 'EXT-ALICE-001',
  });

  await ensureWalletTransaction({
    walletId: brianWallet.id,
    type: WalletTransactionType.DEPOSIT,
    status: WalletTransactionStatus.COMPLETED,
    amount: 3000000,
    reference: 'EXT-BRIAN-001',
  });

  await ensureWalletTransaction({
    walletId: providerWallet.id,
    type: WalletTransactionType.DEPOSIT,
    status: WalletTransactionStatus.COMPLETED,
    amount: 180000,
    reference: 'PROVIDER-PAYOUT-PLUMBING-A04',
  });

  // =====================================================
  // WITHDRAWAL REQUESTS
  // =====================================================
  const existingJohnWithdrawal = await prisma.withdrawalRequest.findFirst({
    where: {
      walletId: johnWallet.id,
      investorId: investorJohn.id,
      amount: 500000,
      status: WithdrawalStatus.APPROVED,
    },
  });

  if (!existingJohnWithdrawal) {
    await prisma.withdrawalRequest.create({
      data: {
        walletId: johnWallet.id,
        investorId: investorJohn.id,
        amount: 500000,
        status: WithdrawalStatus.APPROVED,
      },
    });
  }

  await ensureLedgerEntry({
    accountId: johnAccount.id,
    debit: 500000,
    source: LedgerSource.WITHDRAWAL,
    reference: 'WD-JOHN-001',
  });

  await ensureWalletTransaction({
    walletId: johnWallet.id,
    type: WalletTransactionType.WITHDRAWAL,
    status: WalletTransactionStatus.COMPLETED,
    amount: 500000,
    reference: 'WD-JOHN-001',
  });

  const existingMaryWithdrawal = await prisma.withdrawalRequest.findFirst({
    where: {
      walletId: maryWallet.id,
      investorId: investorMary.id,
      amount: 250000,
      status: WithdrawalStatus.PENDING,
    },
  });

  if (!existingMaryWithdrawal) {
    await prisma.withdrawalRequest.create({
      data: {
        walletId: maryWallet.id,
        investorId: investorMary.id,
        amount: 250000,
        status: WithdrawalStatus.PENDING,
      },
    });
  }
  // =====================================================
  // MAINTENANCE + PROVIDERS
  // =====================================================
  const serviceProvider = await prisma.serviceProvider.upsert({
    where: { userId: providerUser.id },
    update: {
      type: ServiceProviderType.PLUMBER,
      rating: 4.8,
      reviewCount: 1,
      isActive: true,
      verificationStatus: ProviderVerificationStatus.VERIFIED,
      companyName: 'Peter Plumbing Co.',
      licenseNumber: 'LIC-PL-0021',
      city: 'Kampala',
      serviceRadiusKm: 15,
      managerId: manager.id,
      source: ProviderSource.PLATFORM,
    },
    create: {
      userId: providerUser.id,
      type: ServiceProviderType.PLUMBER,
      rating: 4.8,
      reviewCount: 1,
      isActive: true,
      verificationStatus: ProviderVerificationStatus.VERIFIED,
      companyName: 'Peter Plumbing Co.',
      licenseNumber: 'LIC-PL-0021',
      city: 'Kampala',
      serviceRadiusKm: 15,
      managerId: manager.id,
      source: ProviderSource.PLATFORM,
    },
  });

  const electricianProvider = await prisma.serviceProvider.upsert({
    where: { userId: electricianUser.id },
    update: {
      type: ServiceProviderType.ELECTRICIAN,
      rating: 4.5,
      reviewCount: 0,
      isActive: true,
      verificationStatus: ProviderVerificationStatus.VERIFIED,
      companyName: 'Eva Electrical Services',
      licenseNumber: 'LIC-EL-0088',
      city: 'Kampala',
      serviceRadiusKm: 18,
      managerId: manager.id,
      source: ProviderSource.PLATFORM,
    },
    create: {
      userId: electricianUser.id,
      type: ServiceProviderType.ELECTRICIAN,
      rating: 4.5,
      reviewCount: 0,
      isActive: true,
      verificationStatus: ProviderVerificationStatus.VERIFIED,
      companyName: 'Eva Electrical Services',
      licenseNumber: 'LIC-EL-0088',
      city: 'Kampala',
      serviceRadiusKm: 18,
      managerId: manager.id,
      source: ProviderSource.PLATFORM,
    },
  });


  const securityProvider = await prisma.serviceProvider.upsert({
    where: { userId: securityUser.id },
    update: {
      type: ServiceProviderType.SECURITY_INSTALLER,
      rating: 4.6,
      reviewCount: 0,
      isActive: true,
      verificationStatus: ProviderVerificationStatus.VERIFIED,
      companyName: 'SecureTech Kampala',
      licenseNumber: 'LIC-SEC-0042',
      city: 'Kampala',
      serviceRadiusKm: 20,
      managerId: manager.id,
      source: ProviderSource.PLATFORM,
    },
    create: {
      userId: securityUser.id,
      type: ServiceProviderType.SECURITY_INSTALLER,
      rating: 4.6,
      reviewCount: 0,
      isActive: true,
      verificationStatus: ProviderVerificationStatus.VERIFIED,
      companyName: 'SecureTech Kampala',
      licenseNumber: 'LIC-SEC-0042',
      city: 'Kampala',
      serviceRadiusKm: 20,
      managerId: manager.id,
      source: ProviderSource.PLATFORM,
    },
  });

  const hvacProvider = await ensureSeedServiceProvider({
    name: 'Henry HVAC',
    email: 'hvac@zyrent.com',
    phone: '+256700000010',
    type: ServiceProviderType.HVAC_TECHNICIAN,
    companyName: 'Kampala AirCare HVAC',
    licenseNumber: 'LIC-HVAC-0010',
    city: 'Kampala',
    serviceRadiusKm: 20,
    managerId: manager.id,
    rating: 4.5,
  });

  const applianceProvider = await ensureSeedServiceProvider({
    name: 'Aaron Appliance',
    email: 'appliance@zyrent.com',
    phone: '+256700000011',
    type: ServiceProviderType.APPLIANCE_REPAIR,
    companyName: 'HomeFix Appliance Repair',
    licenseNumber: 'LIC-APP-0011',
    city: 'Kampala',
    serviceRadiusKm: 20,
    managerId: manager.id,
    rating: 4.5,
  });

  const carpenterProvider = await ensureSeedServiceProvider({
    name: 'Caleb Carpenter',
    email: 'carpenter@zyrent.com',
    phone: '+256700000012',
    type: ServiceProviderType.CARPENTER,
    companyName: 'FineWood Carpentry',
    licenseNumber: 'LIC-CARP-0012',
    city: 'Kampala',
    serviceRadiusKm: 20,
    managerId: manager.id,
    rating: 4.5,
  });

  const locksmithProvider = await ensureSeedServiceProvider({
    name: 'Lydia Locks',
    email: 'locksmith@zyrent.com',
    phone: '+256700000013',
    type: ServiceProviderType.LOCKSMITH,
    companyName: 'SafeEntry Locksmiths',
    licenseNumber: 'LIC-LOCK-0013',
    city: 'Kampala',
    serviceRadiusKm: 20,
    managerId: manager.id,
    rating: 4.5,
  });

  const rooferProvider = await ensureSeedServiceProvider({
    name: 'Robert Roofer',
    email: 'roofer@zyrent.com',
    phone: '+256700000014',
    type: ServiceProviderType.ROOFER,
    companyName: 'RoofCare Uganda',
    licenseNumber: 'LIC-ROOF-0014',
    city: 'Kampala',
    serviceRadiusKm: 20,
    managerId: manager.id,
    rating: 4.5,
  });

  const painterProvider = await ensureSeedServiceProvider({
    name: 'Paul Painter',
    email: 'painter@zyrent.com',
    phone: '+256700000015',
    type: ServiceProviderType.PAINTER,
    companyName: 'Precision Paint & Finishes',
    licenseNumber: 'LIC-PAINT-0015',
    city: 'Kampala',
    serviceRadiusKm: 20,
    managerId: manager.id,
    rating: 4.5,
  });

  const flooringProvider = await ensureSeedServiceProvider({
    name: 'Florence Flooring',
    email: 'flooring@zyrent.com',
    phone: '+256700000016',
    type: ServiceProviderType.FLOORING_SPECIALIST,
    companyName: 'PrimeFloor Specialists',
    licenseNumber: 'LIC-FLOOR-0016',
    city: 'Kampala',
    serviceRadiusKm: 20,
    managerId: manager.id,
    rating: 4.5,
  });

  const tilerProvider = await ensureSeedServiceProvider({
    name: 'Tony Tiler',
    email: 'tiler@zyrent.com',
    phone: '+256700000017',
    type: ServiceProviderType.TILER,
    companyName: 'TilePro Kampala',
    licenseNumber: 'LIC-TILE-0017',
    city: 'Kampala',
    serviceRadiusKm: 20,
    managerId: manager.id,
    rating: 4.5,
  });

  const cleanerProvider = await ensureSeedServiceProvider({
    name: 'Catherine Cleaner',
    email: 'cleaner@zyrent.com',
    phone: '+256700000018',
    type: ServiceProviderType.CLEANER,
    companyName: 'SparkleClean Services',
    licenseNumber: 'LIC-CLEAN-0018',
    city: 'Kampala',
    serviceRadiusKm: 20,
    managerId: manager.id,
    rating: 4.5,
  });

  const housekeepingProvider = await ensureSeedServiceProvider({
    name: 'Harriet Housekeeping',
    email: 'housekeeping@zyrent.com',
    phone: '+256700000019',
    type: ServiceProviderType.HOUSEKEEPER,
    companyName: 'NeatNest Housekeeping',
    licenseNumber: 'LIC-HOUSE-0019',
    city: 'Kampala',
    serviceRadiusKm: 20,
    managerId: manager.id,
    rating: 4.5,
  });

  const laundryProvider = await ensureSeedServiceProvider({
    name: 'Liam Laundry',
    email: 'laundry@zyrent.com',
    phone: '+256700000020',
    type: ServiceProviderType.LAUNDRY_SERVICE,
    companyName: 'FreshFold Laundry',
    licenseNumber: 'LIC-LAUNDRY-0020',
    city: 'Kampala',
    serviceRadiusKm: 20,
    managerId: manager.id,
    rating: 4.5,
  });

  const landscaperProvider = await ensureSeedServiceProvider({
    name: 'Grace Landscaper',
    email: 'landscaper@zyrent.com',
    phone: '+256700000021',
    type: ServiceProviderType.LANDSCAPER,
    companyName: 'GreenEdge Landscaping',
    licenseNumber: 'LIC-LAND-0021',
    city: 'Kampala',
    serviceRadiusKm: 20,
    managerId: manager.id,
    rating: 4.5,
  });

  const poolProvider = await ensureSeedServiceProvider({
    name: 'Peter Pool',
    email: 'pool@zyrent.com',
    phone: '+256700000022',
    type: ServiceProviderType.POOL_TECHNICIAN,
    companyName: 'BlueWater Pool Care',
    licenseNumber: 'LIC-POOL-0022',
    city: 'Kampala',
    serviceRadiusKm: 20,
    managerId: manager.id,
    rating: 4.5,
  });

  const pestProvider = await ensureSeedServiceProvider({
    name: 'Patrick Pest',
    email: 'pest@zyrent.com',
    phone: '+256700000023',
    type: ServiceProviderType.PEST_CONTROL,
    companyName: 'SafeHome Pest Control',
    licenseNumber: 'LIC-PEST-0023',
    city: 'Kampala',
    serviceRadiusKm: 20,
    managerId: manager.id,
    rating: 4.5,
  });

  const cctvProvider = await ensureSeedServiceProvider({
    name: 'Cyrus CCTV',
    email: 'cctv@zyrent.com',
    phone: '+256700000024',
    type: ServiceProviderType.CCTV_TECHNICIAN,
    companyName: 'VisionPoint CCTV',
    licenseNumber: 'LIC-CCTV-0024',
    city: 'Kampala',
    serviceRadiusKm: 20,
    managerId: manager.id,
    rating: 4.5,
  });

  const internetProvider = await ensureSeedServiceProvider({
    name: 'Ivan Internet',
    email: 'internet@zyrent.com',
    phone: '+256700000025',
    type: ServiceProviderType.INTERNET_TECHNICIAN,
    companyName: 'FiberLink Technicians',
    licenseNumber: 'LIC-NET-0025',
    city: 'Kampala',
    serviceRadiusKm: 20,
    managerId: manager.id,
    rating: 4.5,
  });

  const interiorProvider = await ensureSeedServiceProvider({
    name: 'Irene Interior',
    email: 'interior@zyrent.com',
    phone: '+256700000026',
    type: ServiceProviderType.INTERIOR_DESIGNER,
    companyName: 'UrbanNest Interiors',
    licenseNumber: 'LIC-INT-0026',
    city: 'Kampala',
    serviceRadiusKm: 20,
    managerId: manager.id,
    rating: 4.5,
  });

  const furnitureProvider = await ensureSeedServiceProvider({
    name: 'Frank Furniture',
    email: 'furniture@zyrent.com',
    phone: '+256700000027',
    type: ServiceProviderType.FURNITURE_SPECIALIST,
    companyName: 'FitOut Furniture Services',
    licenseNumber: 'LIC-FURN-0027',
    city: 'Kampala',
    serviceRadiusKm: 20,
    managerId: manager.id,
    rating: 4.5,
  });

  const curtainProvider = await ensureSeedServiceProvider({
    name: 'Carol Curtains',
    email: 'curtains@zyrent.com',
    phone: '+256700000028',
    type: ServiceProviderType.CURTAIN_INSTALLER,
    companyName: 'SoftLine Curtain Installers',
    licenseNumber: 'LIC-CURT-0028',
    city: 'Kampala',
    serviceRadiusKm: 20,
    managerId: manager.id,
    rating: 4.5,
  });

  const moverProvider = await ensureSeedServiceProvider({
    name: 'Moses Movers',
    email: 'movers@zyrent.com',
    phone: '+256700000029',
    type: ServiceProviderType.MOVING_SERVICE,
    companyName: 'SwiftMove Kampala',
    licenseNumber: 'LIC-MOVE-0029',
    city: 'Kampala',
    serviceRadiusKm: 20,
    managerId: manager.id,
    rating: 4.5,
  });

  const deliveryProvider = await ensureSeedServiceProvider({
    name: 'Diana Delivery',
    email: 'delivery@zyrent.com',
    phone: '+256700000030',
    type: ServiceProviderType.DELIVERY_SERVICE,
    companyName: 'QuickDrop Delivery',
    licenseNumber: 'LIC-DEL-0030',
    city: 'Kampala',
    serviceRadiusKm: 20,
    managerId: manager.id,
    rating: 4.5,
  });

  const chefProvider = await ensureSeedServiceProvider({
    name: 'Charles Chef',
    email: 'chef@zyrent.com',
    phone: '+256700000031',
    type: ServiceProviderType.CHEF,
    companyName: 'Private Chef Kampala',
    licenseNumber: 'LIC-CHEF-0031',
    city: 'Kampala',
    serviceRadiusKm: 20,
    managerId: manager.id,
    rating: 4.5,
  });

  const cateringProvider = await ensureSeedServiceProvider({
    name: 'Connie Catering',
    email: 'catering@zyrent.com',
    phone: '+256700000032',
    type: ServiceProviderType.CATERING_SERVICE,
    companyName: 'EventPlate Catering',
    licenseNumber: 'LIC-CAT-0032',
    city: 'Kampala',
    serviceRadiusKm: 20,
    managerId: manager.id,
    rating: 4.5,
  });

  const generalContractorProvider = await ensureSeedServiceProvider({
    name: 'George Contractor',
    email: 'contractor@zyrent.com',
    phone: '+256700000033',
    type: ServiceProviderType.GENERAL_CONTRACTOR,
    companyName: 'AllRound Property Works',
    licenseNumber: 'LIC-GEN-0033',
    city: 'Kampala',
    serviceRadiusKm: 20,
    managerId: manager.id,
    rating: 4.5,
  });

  let plumbingRequest = await prisma.maintenanceRequest.findFirst({
    where: {
      propertyId: naguruProperty.id,
      unitId: unitA04.id,
      title: 'Plumbing issue - Unit A04',
    },
  });

  if (!plumbingRequest) {
    plumbingRequest = await prisma.maintenanceRequest.create({
      data: {
        propertyId: naguruProperty.id,
        unitId: unitA04.id,
        residentId: aliceResident.id,
        category: MaintenanceCategory.PLUMBING,
        title: 'Plumbing issue - Unit A04',
        description: 'Kitchen sink leakage reported by resident.',
        requiresInspection: true,
        status: MaintenanceStatus.IN_PROGRESS,
        priority: MaintenancePriority.HIGH,
        assignedProviderId: serviceProvider.id,
        estimatedCost: 180000,
        paymentResponsibility: MaintenancePaymentResponsibility.PROPERTY,
        propertyShare: 180000,
        residentShare: 0,
        inspectionScheduledAt: new Date('2026-04-02T09:00:00Z'),
        workScheduledAt: new Date('2026-04-03T10:00:00Z'),
        paidAt: new Date('2026-04-03T15:00:00Z'),
        paidByUserId: manager.id,
        paymentReference: 'PROVIDER-PAYOUT-PLUMBING-A04',
        paymentChannel: PaymentChannel.WALLET,
        paymentProvider: PaymentProvider.WALLET,
      },
    });
  } else {
    plumbingRequest = await prisma.maintenanceRequest.update({
      where: { id: plumbingRequest.id },
      data: {
        status: MaintenanceStatus.IN_PROGRESS,
        paymentResponsibility: MaintenancePaymentResponsibility.PROPERTY,
        propertyShare: 180000,
        residentShare: 0,
        paidAt: new Date('2026-04-03T15:00:00Z'),
        paidByUserId: manager.id,
        paymentReference: 'PROVIDER-PAYOUT-PLUMBING-A04',
        paymentChannel: PaymentChannel.WALLET,
        paymentProvider: PaymentProvider.WALLET,
      },
    });
  }

  const plumbingPhoto = await prisma.maintenancePhoto.findFirst({
    where: {
      requestId: plumbingRequest.id,
      url: 'https://example.com/maintenance/a04-plumbing.jpg',
    },
  });

  if (!plumbingPhoto) {
    await prisma.maintenancePhoto.create({
      data: {
        requestId: plumbingRequest.id,
        url: 'https://example.com/maintenance/a04-plumbing.jpg',
      },
    });
  }

  const plumbingDispatch = await prisma.maintenanceDispatch.findFirst({
    where: {
      requestId: plumbingRequest.id,
      providerId: serviceProvider.id,
    },
  });

  if (!plumbingDispatch) {
    await prisma.maintenanceDispatch.create({
      data: {
        requestId: plumbingRequest.id,
        providerId: serviceProvider.id,
        status: DispatchStatus.QUOTED,
        viewedAt: new Date('2026-04-02T10:00:00Z'),
        respondedAt: new Date('2026-04-02T11:00:00Z'),
      },
    });
  }

  let plumbingQuote = await prisma.maintenanceQuote.findFirst({
    where: {
      requestId: plumbingRequest.id,
      providerId: serviceProvider.id,
    },
  });

  if (!plumbingQuote) {
    plumbingQuote = await prisma.maintenanceQuote.create({
      data: {
        requestId: plumbingRequest.id,
        providerId: serviceProvider.id,
        totalAmount: 180000,
        laborCost: 90000,
        materialsCost: 90000,
        estimatedDurationHours: 4,
        severity: DamageSeverity.MODERATE,
        notes: 'Replacement of connector and sealant work required.',
        status: QuoteStatus.ACCEPTED,
        acceptedAt: new Date('2026-04-02T12:00:00Z'),
      },
    });
  }

  const plumbingQuoteItem1 = await prisma.maintenanceQuoteItem.findFirst({
    where: {
      quoteId: plumbingQuote.id,
      description: 'Pipe connector replacement',
    },
  });

  if (!plumbingQuoteItem1) {
    await prisma.maintenanceQuoteItem.create({
      data: {
        quoteId: plumbingQuote.id,
        description: 'Pipe connector replacement',
        quantity: 1,
        unitPrice: 60000,
        total: 60000,
      },
    });
  }

  const plumbingQuoteItem2 = await prisma.maintenanceQuoteItem.findFirst({
    where: {
      quoteId: plumbingQuote.id,
      description: 'Labor and installation',
    },
  });

  if (!plumbingQuoteItem2) {
    await prisma.maintenanceQuoteItem.create({
      data: {
        quoteId: plumbingQuote.id,
        description: 'Labor and installation',
        quantity: 1,
        unitPrice: 120000,
        total: 120000,
      },
    });
  }

  const existingPlumbingPayout = await prisma.providerPayout.findFirst({
    where: {
      providerId: serviceProvider.id,
      requestId: plumbingRequest.id,
    },
  });

  if (!existingPlumbingPayout) {
    await prisma.providerPayout.create({
      data: {
        providerId: serviceProvider.id,
        requestId: plumbingRequest.id,
        totalAmount: 180000,
        platformFee: 20000,
        providerEarning: 160000,
        status: PayoutStatus.COMPLETED,
        paymentChannel: PaymentChannel.WALLET,
        paymentProvider: PaymentProvider.WALLET,
        paymentReference: 'PROVIDER-PAYOUT-PLUMBING-A04',
        paidAt: new Date('2026-04-03T15:00:00Z'),
      },
    });
  } else {
    await prisma.providerPayout.update({
      where: { id: existingPlumbingPayout.id },
      data: {
        totalAmount: 180000,
        platformFee: 20000,
        providerEarning: 160000,
        status: PayoutStatus.COMPLETED,
        paymentChannel: PaymentChannel.WALLET,
        paymentProvider: PaymentProvider.WALLET,
        paymentReference: 'PROVIDER-PAYOUT-PLUMBING-A04',
        paidAt: new Date('2026-04-03T15:00:00Z'),
      },
    });
  }

  await ensureLedgerEntry({
    accountId: naguruAccount.id,
    debit: 180000,
    source: LedgerSource.PROVIDER_PAYOUT,
    reference: 'PROVIDER-PAYOUT-PLUMBING-A04',
    propertyId: naguruProperty.id,
  });

  await ensureLedgerEntry({
    accountId: providerAccount.id,
    credit: 180000,
    source: LedgerSource.PROVIDER_PAYOUT,
    reference: 'PROVIDER-PAYOUT-PLUMBING-A04',
    propertyId: naguruProperty.id,
  });

  await chargeSeedExpenseToInvestors({
    propertyId: naguruProperty.id,
    amount: 180000,
    reference: 'EXP-MAINT-PLUMBING-A04',
    creditAccountId: naguruAccount.id,
  });

  const existingPlumbingReview = await prisma.serviceProviderReview.findFirst({
    where: {
      providerId: serviceProvider.id,
      requestId: plumbingRequest.id,
      residentId: aliceResident.id,
    },
  });

  if (!existingPlumbingReview) {
    await prisma.serviceProviderReview.create({
      data: {
        providerId: serviceProvider.id,
        requestId: plumbingRequest.id,
        residentId: aliceResident.id,
        rating: 5,
        comment: 'Fast response and very professional work.',
      },
    });
  }

  let electricalRequest = await prisma.maintenanceRequest.findFirst({
    where: {
      propertyId: crestProperty.id,
      unitId: unitB12.id,
      title: 'Electrical issue - Unit B12',
    },
  });

  if (!electricalRequest) {
    electricalRequest = await prisma.maintenanceRequest.create({
      data: {
        propertyId: crestProperty.id,
        unitId: unitB12.id,
        residentId: brianResident.id,
        category: MaintenanceCategory.ELECTRICAL,
        title: 'Electrical issue - Unit B12',
        description: 'Living room sockets are not working consistently.',
        requiresInspection: true,
        status: MaintenanceStatus.PENDING,
        priority: MaintenancePriority.EMERGENCY,
      },
    });
  }

  const electricalPhoto = await prisma.maintenancePhoto.findFirst({
    where: {
      requestId: electricalRequest.id,
      url: 'https://example.com/maintenance/b12-electrical.jpg',
    },
  });

  if (!electricalPhoto) {
    await prisma.maintenancePhoto.create({
      data: {
        requestId: electricalRequest.id,
        url: 'https://example.com/maintenance/b12-electrical.jpg',
      },
    });
  }

  const electricalDispatch = await prisma.maintenanceDispatch.findFirst({
    where: {
      requestId: electricalRequest.id,
      providerId: electricianProvider.id,
    },
  });

  if (!electricalDispatch) {
    await prisma.maintenanceDispatch.create({
      data: {
        requestId: electricalRequest.id,
        providerId: electricianProvider.id,
        status: DispatchStatus.SENT,
      },
    });
  }

  let generalRequest = await prisma.maintenanceRequest.findFirst({
    where: {
      propertyId: naguruProperty.id,
      unitId: unitC07.id,
      title: 'General cleanup and repaint assessment - Unit C07',
    },
  });

  if (!generalRequest) {
    generalRequest = await prisma.maintenanceRequest.create({
      data: {
        propertyId: naguruProperty.id,
        unitId: unitC07.id,
        residentId: aliceResident.id,
        category: MaintenanceCategory.GENERAL,
        title: 'General cleanup and repaint assessment - Unit C07',
        description:
          'Vacant unit needs inspection for cleanup and minor repainting before next occupancy.',
        requiresInspection: false,
        status: MaintenanceStatus.QUOTED,
        priority: MaintenancePriority.MEDIUM,
        assignedProviderId: painterProvider.id,
        estimatedCost: 95000,
        paymentResponsibility: MaintenancePaymentResponsibility.PROPERTY,
        propertyShare: 95000,
        residentShare: 0,
        paidAt: null,
        paidByUserId: null,
        paymentReference: null,
        paymentChannel: null,
        paymentProvider: null,
      },
    });
  } else {
    generalRequest = await prisma.maintenanceRequest.update({
      where: { id: generalRequest.id },
      data: {
        status: MaintenanceStatus.QUOTED,
        paymentResponsibility: MaintenancePaymentResponsibility.PROPERTY,
        propertyShare: 95000,
        residentShare: 0,
        paidAt: null,
        paidByUserId: null,
        paymentReference: null,
        paymentChannel: null,
        paymentProvider: null,
      },
    });
  }

  let generalQuote = await prisma.maintenanceQuote.findFirst({
    where: {
      requestId: generalRequest.id,
      providerId: painterProvider.id,
    },
  });

  if (!generalQuote) {
    generalQuote = await prisma.maintenanceQuote.create({
      data: {
        requestId: generalRequest.id,
        providerId: painterProvider.id,
        totalAmount: 95000,
        laborCost: 65000,
        materialsCost: 30000,
        estimatedDurationHours: 3,
        severity: DamageSeverity.MINOR,
        notes: 'Minor touch-up and cleaning package.',
        status: QuoteStatus.PENDING,
      },
    });
  }

  const generalDispatch = await prisma.maintenanceDispatch.findFirst({
    where: {
      requestId: generalRequest.id,
      providerId: painterProvider.id,
    },
  });

  if (!generalDispatch) {
    await prisma.maintenanceDispatch.create({
      data: {
        requestId: generalRequest.id,
        providerId: painterProvider.id,
        status: DispatchStatus.QUOTED,
        viewedAt: new Date('2026-04-06T09:00:00Z'),
        respondedAt: new Date('2026-04-06T09:15:00Z'),
      },
    });
  }


  let securityRequest = await prisma.maintenanceRequest.findFirst({
    where: {
      propertyId: crestProperty.id,
      unitId: unitB12.id,
      title: 'Security upgrade - CCTV and entry reinforcement',
    },
  });

  if (!securityRequest) {
    securityRequest = await prisma.maintenanceRequest.create({
      data: {
        propertyId: crestProperty.id,
        unitId: unitB12.id,
        residentId: brianResident.id,
        category: MaintenanceCategory.SECURITY,
        title: 'Security upgrade - CCTV and entry reinforcement',
        description:
          'New CCTV blind spot correction and entry-point reinforcement for Crest View Residences.',
        requiresInspection: true,
        status: MaintenanceStatus.QUOTED,
        priority: MaintenancePriority.HIGH,
        assignedProviderId: securityProvider.id,
        estimatedCost: 250000,
        paymentResponsibility: MaintenancePaymentResponsibility.PROPERTY,
        propertyShare: 250000,
        residentShare: 0,
        inspectionScheduledAt: new Date('2026-04-04T08:00:00Z'),
        workScheduledAt: null,
        paidAt: null,
        paidByUserId: null,
        paymentReference: null,
        paymentChannel: null,
        paymentProvider: null,
      },
    });
  } else {
    securityRequest = await prisma.maintenanceRequest.update({
      where: { id: securityRequest.id },
      data: {
        category: MaintenanceCategory.SECURITY,
        description:
          'New CCTV blind spot correction and entry-point reinforcement for Crest View Residences.',
        requiresInspection: true,
        status: MaintenanceStatus.QUOTED,
        priority: MaintenancePriority.HIGH,
        assignedProviderId: securityProvider.id,
        estimatedCost: 250000,
        paymentResponsibility: MaintenancePaymentResponsibility.PROPERTY,
        propertyShare: 250000,
        residentShare: 0,
        inspectionScheduledAt: new Date('2026-04-04T08:00:00Z'),
        workScheduledAt: null,
        paidAt: null,
        paidByUserId: null,
        paymentReference: null,
        paymentChannel: null,
        paymentProvider: null,
      },
    });
  }

  const securityPhoto = await prisma.maintenancePhoto.findFirst({
    where: {
      requestId: securityRequest.id,
      url: 'https://example.com/maintenance/crest-security-upgrade.jpg',
    },
  });

  if (!securityPhoto) {
    await prisma.maintenancePhoto.create({
      data: {
        requestId: securityRequest.id,
        url: 'https://example.com/maintenance/crest-security-upgrade.jpg',
      },
    });
  }

  const securityDispatch = await prisma.maintenanceDispatch.findFirst({
    where: {
      requestId: securityRequest.id,
      providerId: securityProvider.id,
    },
  });

  if (!securityDispatch) {
    await prisma.maintenanceDispatch.create({
      data: {
        requestId: securityRequest.id,
        providerId: securityProvider.id,
        status: DispatchStatus.QUOTED,
        sentAt: new Date('2026-04-04T08:30:00Z'),
        viewedAt: new Date('2026-04-04T09:00:00Z'),
        respondedAt: new Date('2026-04-04T10:00:00Z'),
      },
    });
  } else {
    await prisma.maintenanceDispatch.update({
      where: { id: securityDispatch.id },
      data: {
        status: DispatchStatus.QUOTED,
        viewedAt: new Date('2026-04-04T09:00:00Z'),
        respondedAt: new Date('2026-04-04T10:00:00Z'),
      },
    });
  }

  let securityQuote = await prisma.maintenanceQuote.findFirst({
    where: {
      requestId: securityRequest.id,
      providerId: securityProvider.id,
    },
  });

  if (!securityQuote) {
    securityQuote = await prisma.maintenanceQuote.create({
      data: {
        requestId: securityRequest.id,
        providerId: securityProvider.id,
        totalAmount: 250000,
        laborCost: 100000,
        materialsCost: 150000,
        estimatedDurationHours: 6,
        severity: DamageSeverity.MODERATE,
        notes:
          'CCTV blind spot correction, entry-point reinforcement, and basic system testing.',
        status: QuoteStatus.PENDING,
      },
    });
  } else {
    securityQuote = await prisma.maintenanceQuote.update({
      where: { id: securityQuote.id },
      data: {
        totalAmount: 250000,
        laborCost: 100000,
        materialsCost: 150000,
        estimatedDurationHours: 6,
        severity: DamageSeverity.MODERATE,
        notes:
          'CCTV blind spot correction, entry-point reinforcement, and basic system testing.',
        status: QuoteStatus.PENDING,
        acceptedAt: null,
      },
    });
  }

  const securityQuoteItemsToEnsure = [
    {
      description: 'CCTV blind spot correction',
      quantity: 1,
      unitPrice: 150000,
      total: 150000,
    },
    {
      description: 'Entry-point reinforcement labor',
      quantity: 1,
      unitPrice: 100000,
      total: 100000,
    },
  ];

  for (const item of securityQuoteItemsToEnsure) {
    const existingItem = await prisma.maintenanceQuoteItem.findFirst({
      where: {
        quoteId: securityQuote.id,
        description: item.description,
      },
    });

    if (!existingItem) {
      await prisma.maintenanceQuoteItem.create({
        data: {
          quoteId: securityQuote.id,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: item.total,
        },
      });
    } else {
      await prisma.maintenanceQuoteItem.update({
        where: { id: existingItem.id },
        data: {
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: item.total,
        },
      });
    }
  }

  // =====================================================
  // NOTIFICATIONS
  // =====================================================
  const notificationsToEnsure = [
    {
      userId: investorJohn.id,
      title: 'Profit Distribution',
      message: 'You earned UGX 420,000 from Zyrent Apartments.',
      type: NotificationType.PROFIT_DISTRIBUTION,
    },
    {
      userId: investorMary.id,
      title: 'Withdrawal Request',
      message: 'Your withdrawal request of UGX 250,000 is pending review.',
      type: NotificationType.WITHDRAWAL_REQUEST,
    },
    {
      userId: residentAliceUser.id,
      title: 'Rent Payment',
      message: 'Your April rent payment of UGX 1,200,000 was received.',
      type: NotificationType.RENT_PAYMENT,
    },
    {
      userId: residentAliceUser.id,
      title: 'Maintenance Update',
      message: 'Your plumbing request for Unit A04 is now in progress.',
      type: NotificationType.MAINTENANCE,
    },
    {
      userId: residentBrianUser.id,
      title: 'Maintenance Request Logged',
      message:
        'Your electrical issue for Unit B12 has been received and dispatch is in progress.',
      type: NotificationType.MAINTENANCE,
    },
    {
      userId: providerUser.id,
      title: 'System',
      message: 'You have been assigned a new maintenance request.',
      type: NotificationType.SYSTEM,
    },
    {
      userId: electricianUser.id,
      title: 'New Maintenance Request',
      message: 'A new electrical request has been dispatched to you.',
      type: NotificationType.MAINTENANCE,
    },
    {
      userId: securityUser.id,
      title: 'Security Maintenance Quote Requested',
      message:
        'A security upgrade request for Crest View Residences has been dispatched to you.',
      type: NotificationType.MAINTENANCE,
    },
    {
      userId: manager.id,
      title: 'Security Upgrade Awaiting Approval',
      message:
        'The UGX 250,000 Crest View security upgrade is linked to maintenance and awaiting investor approval.',
      type: NotificationType.MAINTENANCE,
    },
  ];

  for (const item of notificationsToEnsure) {
    const existing = await prisma.notification.findFirst({
      where: {
        userId: item.userId,
        title: item.title,
        message: item.message,
      },
    });

    if (!existing) {
      await prisma.notification.create({
        data: item,
      });
    }
  }

  // =====================================================
  // CONVERSATIONS + MESSAGES
  // =====================================================
  async function ensureSeedConversation(params: {
    userAId: string;
    userBId: string;
    messages: {
      senderId: string;
      content: string;
      createdAt: Date;
      readAt?: Date | null;
    }[];
  }) {
    const existingConversations = await prisma.conversation.findMany({
      where: {
        AND: [
          {
            participants: {
              some: { userId: params.userAId },
            },
          },
          {
            participants: {
              some: { userId: params.userBId },
            },
          },
        ],
      },
      include: {
        participants: true,
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    const directConversations = existingConversations.filter(
      (item) =>
        item.participants.length === 2 &&
        item.participants.some(
          (participant) => participant.userId === params.userAId,
        ) &&
        item.participants.some(
          (participant) => participant.userId === params.userBId,
        ),
    );

    let conversation = directConversations[0];

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          participants: {
            create: [{ userId: params.userAId }, { userId: params.userBId }],
          },
        },
        include: {
          participants: true,
        },
      });
    }

    const duplicateConversations = directConversations.slice(1);

    for (const duplicate of duplicateConversations) {
      await prisma.message.deleteMany({
        where: { conversationId: duplicate.id },
      });

      await prisma.conversationParticipant.deleteMany({
        where: { conversationId: duplicate.id },
      });

      await prisma.conversation.delete({
        where: { id: duplicate.id },
      });
    }

    await prisma.message.deleteMany({
      where: { conversationId: conversation.id },
    });

    for (const item of params.messages) {
      await prisma.message.create({
        data: {
          conversationId: conversation.id,
          senderId: item.senderId,
          content: item.content,
          createdAt: item.createdAt,
          readAt: item.readAt ?? null,
        },
      });
    }

    const latestMessageTime = params.messages.reduce(
      (latest, item) => (item.createdAt > latest ? item.createdAt : latest),
      params.messages[0]?.createdAt ?? new Date(),
    );

    await prisma.conversation.update({
      where: { id: conversation.id },
      data: { updatedAt: latestMessageTime },
    });

    return conversation;
  }

  const seedMessageReadAt = new Date('2026-04-29T20:30:00Z');

  await ensureSeedConversation({
    userAId: investorJohn.id,
    userBId: manager.id,
    messages: [
      {
        senderId: investorJohn.id,
        content: 'Hi Michael, can I get the latest update on April returns?',
        createdAt: new Date('2026-04-29T20:00:00Z'),
        readAt: seedMessageReadAt,
      },
      {
        senderId: manager.id,
        content:
          'Yes. April returns have been distributed for Zyrent Apartments and Crest View Residences.',
        createdAt: new Date('2026-04-29T20:04:00Z'),
        readAt: seedMessageReadAt,
      },
    ],
  });

  await ensureSeedConversation({
    userAId: investorMary.id,
    userBId: manager.id,
    messages: [
      {
        senderId: manager.id,
        content:
          'Hi Mary, your April distribution summary is ready. You can review it under Profit Center.',
        createdAt: new Date('2026-04-29T20:08:00Z'),
        readAt: seedMessageReadAt,
      },
      {
        senderId: investorMary.id,
        content:
          'Thanks Michael. I will review the Naguru and Crest View breakdown.',
        createdAt: new Date('2026-04-29T20:10:00Z'),
        readAt: seedMessageReadAt,
      },
    ],
  });

  await ensureSeedConversation({
    userAId: residentAliceUser.id,
    userBId: manager.id,
    messages: [
      {
        senderId: residentAliceUser.id,
        content:
          'Hi Michael, please keep me updated on the plumbing request for Unit A04.',
        createdAt: new Date('2026-04-29T20:12:00Z'),
        readAt: seedMessageReadAt,
      },
      {
        senderId: manager.id,
        content:
          'Hi Alice. The provider has been assigned and the request is being handled. You will only see a charge if responsibility is assigned to you.',
        createdAt: new Date('2026-04-29T20:14:00Z'),
        readAt: seedMessageReadAt,
      },
    ],
  });

  await ensureSeedConversation({
    userAId: providerUser.id,
    userBId: manager.id,
    messages: [
      {
        senderId: manager.id,
        content:
          'Hi Peter, please confirm the plumbing job status for Unit A04 once the inspection is complete.',
        createdAt: new Date('2026-04-29T20:16:00Z'),
        readAt: seedMessageReadAt,
      },
      {
        senderId: providerUser.id,
        content:
          'Confirmed. I have reviewed the job and will update the request after the work is completed.',
        createdAt: new Date('2026-04-29T20:18:00Z'),
        readAt: seedMessageReadAt,
      },
    ],
  });

  await ensureSeedConversation({
    userAId: admin.id,
    userBId: manager.id,
    messages: [
      {
        senderId: admin.id,
        content:
          'Michael, please keep the April operations records updated before the final review.',
        createdAt: new Date('2026-04-29T20:20:00Z'),
        readAt: seedMessageReadAt,
      },
      {
        senderId: manager.id,
        content:
          'Noted Sarah. Payments, maintenance, and provider records are being kept up to date.',
        createdAt: new Date('2026-04-29T20:22:00Z'),
        readAt: seedMessageReadAt,
      },
    ],
  });

  // =====================================================
  // PROFIT REQUEST + VOTES
  // =====================================================
  let profitRequest = await prisma.profitRequest.findFirst({
    where: {
      propertyId: naguruProperty.id,
      amount: 500000,
    },
  });

  if (!profitRequest) {
    profitRequest = await prisma.profitRequest.create({
      data: {
        propertyId: naguruProperty.id,
        amount: 500000,
        status: 'APPROVED',
        createdBy: investorJohn.id,
        expiresAt: new Date('2026-04-10T12:00:00Z'),
        processedAt: new Date('2026-04-09T16:00:00Z'),
      },
    });
  }

  await prisma.profitVote.upsert({
    where: {
      requestId_investorId: {
        requestId: profitRequest.id,
        investorId: investorJohn.id,
      },
    },
    update: { vote: true },
    create: {
      requestId: profitRequest.id,
      investorId: investorJohn.id,
      vote: true,
    },
  });

  await prisma.profitVote.upsert({
    where: {
      requestId_investorId: {
        requestId: profitRequest.id,
        investorId: investorMary.id,
      },
    },
    update: { vote: true },
    create: {
      requestId: profitRequest.id,
      investorId: investorMary.id,
      vote: true,
    },
  });

  // =====================================================
  // REPORTS
  // =====================================================
  let scheduledInvestorReport = await prisma.scheduledReport.findFirst({
    where: {
      type: ReportType.INVESTOR_INCOME,
      cron: '0 8 * * 1',
      createdBy: admin.id,
    },
  });

  if (!scheduledInvestorReport) {
    scheduledInvestorReport = await prisma.scheduledReport.create({
      data: {
        type: ReportType.INVESTOR_INCOME,
        cron: '0 8 * * 1',
        createdBy: admin.id,
      },
    });
  }

  const existingReportRun = await prisma.reportRun.findFirst({
    where: {
      type: ReportType.INVESTOR_INCOME,
      scheduleId: scheduledInvestorReport.id,
      executedBy: admin.id,
    },
  });

  if (!existingReportRun) {
    await prisma.reportRun.create({
      data: {
        type: ReportType.INVESTOR_INCOME,
        scheduleId: scheduledInvestorReport.id,
        status: ReportRunStatus.SUCCESS,
        output: {
          totalInvested: 11000000,
          totalProfit: 645000,
          walletBalance: 1145000,
          roi: '5.86%',
        },
        executedBy: admin.id,
      },
    });
  }

  // =====================================================
  // EXPENSES
  // =====================================================
  await prisma.expense.deleteMany({
    where: {
      title: 'Security upgrade',
      maintenanceRequestId: null,
      propertyId: crestProperty.id,
      amount: 250000,
    },
  });

  await prisma.expense.deleteMany({
    where: {
      title: 'General cleanup and repaint assessment - Unit C07',
      maintenanceRequestId: null,
      propertyId: naguruProperty.id,
      amount: 95000,
    },
  });

  const expensesToEnsure = [
    {
      propertyId: crestProperty.id,
      unitId: unitB12.id,
      maintenanceRequestId: securityRequest.id,
      title: 'Security upgrade - CCTV and entry reinforcement',
      description:
        'Maintenance-linked CCTV blind spot correction and entry-point reinforcement for Crest View Residences.',
      category: ExpenseCategory.SECURITY,
      amount: 250000,
      currency: 'UGX',
      vendorName: 'SecureTech Kampala',
      receiptUrl:
        'https://example.com/receipts/security-upgrade-apr-2026.pdf',
      notes: 'Requires investor approval because it exceeds threshold.',
      paymentReference: null,
      paymentChannel: null,
      paymentProvider: null,
      paidByUserId: null,
      rejectionReason: null,
      status: ExpenseStatus.SUBMITTED,
      isAboveApprovalThreshold: true,
      autoApproved: false,
      expenseDate: new Date('2026-04-04'),
      submittedAt: new Date('2026-04-04T10:00:00Z'),
      reviewedAt: null,
      paidAt: null,
      createdById: manager.id,
      reviewedById: null,
    },
    {
      propertyId: naguruProperty.id,
      unitId: null,
      maintenanceRequestId: null,
      title: 'Property insurance renewal',
      description:
        'Quarterly insurance renewal for common areas and landlord risk cover.',
      category: ExpenseCategory.INSURANCE,
      amount: 140000,
      currency: 'UGX',
      vendorName: 'Jubilee Insurance',
      receiptUrl:
        'https://example.com/receipts/insurance-renewal-apr-2026.pdf',
      notes: 'Auto-approved operating expense below threshold.',
      paymentReference: 'EXP-INSURANCE-NAGURU-APR-2026',
      paymentChannel: PaymentChannel.WALLET,
      paymentProvider: PaymentProvider.WALLET,
      paidByUserId: manager.id,
      rejectionReason: null,
      status: ExpenseStatus.PAID,
      isAboveApprovalThreshold: false,
      autoApproved: true,
      expenseDate: new Date('2026-04-02'),
      submittedAt: new Date('2026-04-02T09:00:00Z'),
      reviewedAt: new Date('2026-04-02T09:01:00Z'),
      paidAt: new Date('2026-04-02T14:00:00Z'),
      createdById: manager.id,
      reviewedById: manager.id,
    },
  ];

  for (const exp of expensesToEnsure) {
    const existing = await prisma.expense.findFirst({
      where: {
        propertyId: exp.propertyId,
        title: exp.title,
        amount: exp.amount,
        expenseDate: exp.expenseDate,
      },
    });

    if (existing) {
      await prisma.expense.update({
        where: { id: existing.id },
        data: {
          unitId: exp.unitId,
          maintenanceRequestId: exp.maintenanceRequestId,
          description: exp.description,
          category: exp.category,
          amount: exp.amount,
          currency: exp.currency,
          vendorName: exp.vendorName,
          receiptUrl: exp.receiptUrl,
          notes: exp.notes,
          paymentReference: exp.paymentReference,
          paymentChannel: exp.paymentChannel,
          paymentProvider: exp.paymentProvider,
          paidByUserId: exp.paidByUserId,
          rejectionReason: exp.rejectionReason,
          status: exp.status,
          isAboveApprovalThreshold: exp.isAboveApprovalThreshold,
          autoApproved: exp.autoApproved,
          submittedAt: exp.submittedAt,
          reviewedAt: exp.reviewedAt,
          paidAt: exp.paidAt,
          ...(exp.reviewedById ? { reviewedById: exp.reviewedById } : {}),
        },
      });
    } else {
      await prisma.expense.create({
        data: {
          propertyId: exp.propertyId,
          ...(exp.unitId ? { unitId: exp.unitId } : {}),
          ...(exp.maintenanceRequestId
            ? { maintenanceRequestId: exp.maintenanceRequestId }
            : {}),
          title: exp.title,
          description: exp.description,
          category: exp.category,
          amount: exp.amount,
          currency: exp.currency,
          vendorName: exp.vendorName,
          receiptUrl: exp.receiptUrl,
          notes: exp.notes,
          paymentReference: exp.paymentReference,
          paymentChannel: exp.paymentChannel,
          paymentProvider: exp.paymentProvider,
          paidByUserId: exp.paidByUserId,
          rejectionReason: exp.rejectionReason,
          status: exp.status,
          isAboveApprovalThreshold: exp.isAboveApprovalThreshold,
          autoApproved: exp.autoApproved,
          expenseDate: exp.expenseDate,
          submittedAt: exp.submittedAt,
          reviewedAt: exp.reviewedAt,
          paidAt: exp.paidAt,
          createdById: exp.createdById,
          ...(exp.reviewedById ? { reviewedById: exp.reviewedById } : {}),
        },
      });
    }
  }

  await chargeSeedExpenseToInvestors({
    propertyId: naguruProperty.id,
    amount: 140000,
    reference: 'EXP-INSURANCE-NAGURU-APR-2026',
    creditAccountId: adminAccount.id,
  });

  // =====================================================
  // SAMPLE PAYOUT ROW
  // =====================================================
  const existingPayout = await prisma.payout.findFirst({
    where: { reference: 'SEED-PAYOUT-001' },
  });

  let createdPayout = existingPayout;

  if (!existingPayout) {
    createdPayout = await prisma.payout.create({
      data: {
        userId: providerUser.id,
        amount: 180000,
        currency: 'UGX',
        status: PayoutStatus.COMPLETED,
        narration: 'Provider payout for Unit A04 plumbing',
        reference: 'SEED-PAYOUT-001',
      },
    });
  }

  await ensureLedgerEntry({
    accountId: providerAccount.id,
    credit: 0,
    source: LedgerSource.PROVIDER_PAYOUT,
    reference: 'SEED-PAYOUT-LEDGER-LINK',
    payoutId: createdPayout!.id,
  });

  // =====================================================
// NOTIFICATIONS (CRITICAL FOR UI)
// =====================================================

// Clear existing (optional but recommended for clean reseed)
await prisma.notification.deleteMany({});

// -------- INVESTOR (JOHN) --------
await prisma.notification.createMany({
  data: [
    {
      userId: investorJohn.id,
      title: "Profit received",
      message: "You received UGX 420,000 from Naguru Apartments (April).",
      type: NotificationType.PROFIT_DISTRIBUTION,
      isRead: false,
      createdAt: new Date(),
    },
    {
      userId: investorJohn.id,
      title: "Withdrawal approved",
      message: "Your withdrawal of UGX 500,000 has been approved.",
      type: NotificationType.WITHDRAWAL_APPROVED,
      isRead: false,
      createdAt: new Date(),
    },
  ],
});

// -------- INVESTOR (MARY) --------
await prisma.notification.createMany({
  data: [
    {
      userId: investorMary.id,
      title: "Profit received",
      message: "You received UGX 280,000 from Naguru Apartments.",
      type: NotificationType.PROFIT_DISTRIBUTION,
      isRead: false,
      createdAt: new Date(),
    },
    {
      userId: investorMary.id,
      title: "Withdrawal pending",
      message: "Your withdrawal request of UGX 250,000 is under review.",
      type: NotificationType.WITHDRAWAL_REQUEST,
      isRead: false,
      createdAt: new Date(),
    },
  ],
});

// -------- RESIDENT (ALICE) --------
await prisma.notification.createMany({
  data: [
    {
      userId: residentAliceUser.id,
      title: "Rent payment successful",
      message: "Your April rent payment of UGX 1,200,000 has been received.",
      type: NotificationType.RENT_PAYMENT,
      isRead: false,
      createdAt: new Date(),
    },
    {
      userId: residentAliceUser.id,
      title: "Maintenance update",
      message: "Your plumbing request is currently in progress.",
      type: NotificationType.MAINTENANCE,
      isRead: false,
      createdAt: new Date(),
    },
  ],
});

// -------- RESIDENT (BRIAN) --------
await prisma.notification.create({
  data: {
    userId: residentBrianUser.id,
    title: "Service charge paid",
    message: "Your service charge for April has been successfully processed.",
    type: NotificationType.RENT_PAYMENT,
    isRead: true,
  },
});

// -------- SERVICE PROVIDER --------
await prisma.notification.createMany({
  data: [
    {
      userId: providerUser.id,
      title: "New job assigned",
      message: "You have been assigned a plumbing job at Unit A04.",
      type: NotificationType.MAINTENANCE,
      isRead: false,
    },
    {
      userId: providerUser.id,
      title: "Payment received",
      message: "UGX 180,000 has been credited to your wallet.",
      type: NotificationType.SYSTEM,
      isRead: false,
    },
  ],
});

// -------- MANAGER --------
await prisma.notification.create({
  data: {
    userId: manager.id,
    title: "Maintenance request submitted",
    message: "A new plumbing issue has been reported in Unit A04.",
    type: NotificationType.MAINTENANCE,
    isRead: false,
  },
});

// -------- ADMIN --------
await prisma.notification.create({
  data: {
    userId: admin.id,
    title: "System activity",
    message: "Daily operations completed successfully.",
    type: NotificationType.SYSTEM,
    isRead: true,
  },
});

  // =====================================================
  // FINAL ACCOUNT + WALLET SYNC
  // =====================================================
  const accountsToSync = await prisma.account.findMany({
    select: { id: true },
  });

  for (const account of accountsToSync) {
    await syncAccountFromLedger(account.id);
  }

  await syncWalletFromLedger(investorJohn.id);
  await syncWalletFromLedger(investorMary.id);
  await syncWalletFromLedger(residentAliceUser.id);
  await syncWalletFromLedger(residentBrianUser.id);
  await syncWalletFromLedger(providerUser.id);
  await syncWalletFromLedger(electricianUser.id);
  await syncWalletFromLedger(securityUser.id);

  console.log('✅ Seed completed successfully');
  console.log('');
  console.log('Demo logins:');
  console.log('Admin: admin@zyrent.com / Password123!');
  console.log('Manager: manager@zyrent.com / Password123!');
  console.log('Investor: john@zyrent.com / Password123!');
  console.log('Investor: mary@zyrent.com / Password123!');
  console.log('Resident: alice@zyrent.com / Password123!');
  console.log('Resident: brian@zyrent.com / Password123!');
  console.log('Provider: provider@zyrent.com / Password123!');
  console.log('Provider: electrician@zyrent.com / Password123!');
  console.log('Provider: security@zyrent.com / Password123!');
  console.log('Provider: painter@zyrent.com / Password123!');
  console.log('Provider: cleaner@zyrent.com / Password123!');
  console.log('Provider: contractor@zyrent.com / Password123!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed');
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });