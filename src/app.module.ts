import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { InvestmentModule } from './investment/investment.module';
import { InvestmentMarketplaceModule } from './investment-marketplace/investment-marketplace.module';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { PropertyModule } from './property/property.module';
import { UnitModule } from './unit/unit.module';
import { ResidentModule } from './resident/resident.module';
import { RentContractModule } from './rent-contract/rent-contract.module';
import { PaymentModule } from './payment/payment.module';
import { InvoiceModule } from './invoice/invoice.module';
import { WebhookModule } from './webhook/webhook.module';
import { PayoutsModule } from './payouts/payouts.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { ReportsModule } from './reports/reports.module';
import { SubscriptionModule } from './subscription/subscription.module';
import { NotificationsModule } from './notifications/notifications.module';
import { ProfitDistributionsModule } from './profit-distributions/profit-distributions.module';
import { WithdrawalsModule } from './withdrawals/withdrawals.module';
import { JobsModule } from './jobs/jobs.module';
import { WalletModule } from './wallet/wallet.module';
import { PortfolioModule } from './portfolio/portfolio.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { MaintenanceModule } from './maintenance/maintenance.module';
import { ServiceProvidersModule } from './service-providers/service-providers.module';
import { MessagingModule } from './messaging/messaging.module';
import { ShareMarketModule } from './share-market/share-market.module';
import { KycModule } from './kyc/kyc.module';
import { InvestorShareModule } from './investor-share/investor-share.module';
import { ProfitModule } from './profits/profit.module';
import { ProfitRequestModule } from './profit-requests/profit-request.module';
import { PropertyAdminModule } from './property-admin/property-admin.module';
import { TransactionsModule } from './transactions/transactions.module';
import { ProfitCenterModule } from './profit-center/profit-center.module';
import { ExpenseModule } from './expense/expense.module';
import { ReviewsModule } from './reviews/reviews.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    EventEmitterModule.forRoot(), 
    PrismaModule,
    AuthModule,
    UserModule,
    PropertyModule,
    UnitModule,
    ResidentModule,
    RentContractModule,
    PaymentModule,
    InvoiceModule,
    InvestmentModule,
    WebhookModule,
    PayoutsModule,
    DashboardModule,
    ReportsModule,
    SubscriptionModule,
    NotificationsModule,
    ProfitDistributionsModule,
    WithdrawalsModule,
    JobsModule,
    InvestmentMarketplaceModule,
    WalletModule,
    PortfolioModule,
    AnalyticsModule,
    MaintenanceModule,
    ServiceProvidersModule,
    MessagingModule,
    ShareMarketModule,
    KycModule,
    InvestorShareModule,
    ProfitModule,
    ProfitRequestModule,
    PropertyAdminModule,
    TransactionsModule,
    ProfitCenterModule,
    ExpenseModule,
    ReviewsModule
  ],
})
export class AppModule {}