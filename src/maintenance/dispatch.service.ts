import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  MaintenanceCategory,
  DispatchStatus,
  MaintenancePriority,
  ServiceProviderType,
} from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service';
import { Cron } from '@nestjs/schedule';

@Injectable()
export class DispatchService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  private categoryMap: Record<MaintenanceCategory, ServiceProviderType> = {
    PLUMBING: ServiceProviderType.PLUMBER,
    ELECTRICAL: ServiceProviderType.ELECTRICIAN,
    HVAC: ServiceProviderType.HVAC_TECHNICIAN,
    APPLIANCE: ServiceProviderType.APPLIANCE_REPAIR,
    CARPENTRY: ServiceProviderType.CARPENTER,
    LOCKS: ServiceProviderType.LOCKSMITH,
    ROOFING: ServiceProviderType.ROOFER,
    FLOORING: ServiceProviderType.FLOORING_SPECIALIST,
    PAINTING: ServiceProviderType.PAINTER,

    CLEANING: ServiceProviderType.CLEANER,
    HOUSEKEEPING: ServiceProviderType.HOUSEKEEPER,
    LAUNDRY: ServiceProviderType.LAUNDRY_SERVICE,

    LANDSCAPING: ServiceProviderType.LANDSCAPER,
    POOL: ServiceProviderType.POOL_TECHNICIAN,

    PEST_CONTROL: ServiceProviderType.PEST_CONTROL,
    SECURITY: ServiceProviderType.SECURITY_INSTALLER,
    INTERNET: ServiceProviderType.INTERNET_TECHNICIAN,

    INTERIOR: ServiceProviderType.INTERIOR_DESIGNER,
    FURNITURE: ServiceProviderType.FURNITURE_SPECIALIST,

    GENERAL: ServiceProviderType.GENERAL_CONTRACTOR,
  };

  async smartDispatch(requestId: string, category: MaintenanceCategory) {
    const providerType = this.categoryMap[category];
    if (!providerType) return;

    const providers = await this.prisma.serviceProvider.findMany({
      where: {
        type: providerType,
        isActive: true,
      },
    });

    for (const provider of providers) {
      const exists = await this.prisma.maintenanceDispatch.findUnique({
        where: {
          requestId_providerId: {
            requestId,
            providerId: provider.id,
          },
        },
      });

      if (exists) continue;

      await this.prisma.maintenanceDispatch.create({
        data: {
          requestId,
          providerId: provider.id,
          status: DispatchStatus.SENT,
        },
      });

      if (provider.userId) {
        await this.notificationsService.createNotification({
          userId: provider.userId,
          type: 'MAINTENANCE',
          title: 'New Maintenance Request',
          message: 'A new maintenance request has been assigned to you.',
        });
      }
    }
  }

  async escalateDispatch(requestId: string) {
    const dispatches = await this.prisma.maintenanceDispatch.findMany({
      where: {
        requestId,
        status: DispatchStatus.SENT,
      },
      include: {
        request: {
          include: {
            property: true,
          },
        },
      },
    });

    const now = new Date();

    const cutoffs: Record<MaintenancePriority, number> = {
      EMERGENCY: 10 * 60 * 1000,
      HIGH: 30 * 60 * 1000,
      MEDIUM: 60 * 60 * 1000,
      LOW: 2 * 60 * 60 * 1000,
    };

    for (const dispatch of dispatches) {
      const priority = dispatch.request.priority || MaintenancePriority.MEDIUM;
      const cutoffMs = cutoffs[priority];

      if (now.getTime() - dispatch.sentAt.getTime() <= cutoffMs) {
        continue;
      }

      await this.prisma.maintenanceDispatch.update({
        where: { id: dispatch.id },
        data: {
          status: DispatchStatus.VIEWED,
        },
      });

      const managerId = dispatch.request.property?.managerId;
      if (managerId) {
        await this.notificationsService.createNotification({
          userId: managerId,
          type: 'MAINTENANCE',
          title: 'Dispatch Escalation',
          message: `Dispatch for request "${dispatch.request.title}" has been escalated due to delay.`,
        });
      }
    }
  }

  async acceptDispatch(requestId: string, providerId: string) {
    await this.prisma.maintenanceDispatch.update({
      where: {
        requestId_providerId: { requestId, providerId },
      },
      data: {
        status: DispatchStatus.VIEWED,
        respondedAt: new Date(),
      },
    });

    return { accepted: true };
  }

  async declineDispatch(requestId: string, providerId: string) {
    await this.prisma.maintenanceDispatch.update({
      where: {
        requestId_providerId: { requestId, providerId },
      },
      data: {
        status: DispatchStatus.DECLINED,
        respondedAt: new Date(),
      },
    });

    return { declined: true };
  }

  @Cron('*/5 * * * *')
  async checkPendingDispatches() {
    const pendingRequests = await this.prisma.maintenanceRequest.findMany({
      where: {
        status: 'PENDING',
        dispatches: {
          some: {
            status: DispatchStatus.SENT,
          },
        },
      },
      select: {
        id: true,
      },
    });

    for (const req of pendingRequests) {
      await this.escalateDispatch(req.id);
    }
  }
}