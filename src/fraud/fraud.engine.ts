import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { FraudService } from './fraud.service';

@Injectable()
export class FraudEngine {

  private logger = new Logger(FraudEngine.name);

  constructor(private fraud: FraudService) {}

  /*
  RUN EVERY 6 HOURS
  */

  @Cron('0 */6 * * *')
  async runFraudScans() {

    this.logger.log('Running fraud detection scans...');

    await this.fraud.scanMaintenanceQuotes();
    await this.fraud.scanWithdrawals();
    await this.fraud.scanShareTransactions();

    this.logger.log('Fraud scans completed');

  }
}