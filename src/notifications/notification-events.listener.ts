import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { NotificationsService } from './notifications.service';
import { SystemEvents } from '../events/system-events';
import {
  RentPaidEvent,
  MessageReceivedEvent,
  MaintenanceAssignedEvent,
  SharesPurchasedEvent,
} from '../events/event-payloads';

@Injectable()
export class NotificationEventsListener {

  constructor(
    private notificationsService: NotificationsService,
  ) {}

  /*
  RENT PAID
  */

  @OnEvent(SystemEvents.RENT_PAID)
  async handleRentPaid(event: RentPaidEvent) {

    await this.notificationsService.createNotification({
      userId: event.landlordId,
      title: 'Rent Received',
      message: `Tenant paid rent: $${event.amount}`,
    });

  }

  /*
  MESSAGE RECEIVED
  */

  @OnEvent(SystemEvents.MESSAGE_RECEIVED)
  async handleMessage(event: MessageReceivedEvent) {

    await this.notificationsService.createNotification({
      userId: event.receiverId,
      title: 'New Message',
      message: event.message,
    });

  }

  /*
  MAINTENANCE ASSIGNED
  */

  @OnEvent(SystemEvents.MAINTENANCE_ASSIGNED)
  async handleMaintenance(event: MaintenanceAssignedEvent) {

    await this.notificationsService.createNotification({
      userId: event.technicianId,
      title: 'Maintenance Job Assigned',
      message: event.issue,
    });

  }

  /*
  SHARES PURCHASED
  */

  @OnEvent(SystemEvents.SHARES_PURCHASED)
  async handleSharePurchase(event: SharesPurchasedEvent) {

    await this.notificationsService.createNotification({
      userId: event.investorId,
      title: 'Investment Successful',
      message: `You purchased ${event.shares} shares`,
    });

  }

}