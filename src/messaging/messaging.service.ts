import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import {
  Conversation,
  ConversationParticipant,
  Message,
  Role,
  User,
} from '@prisma/client';

type SafeUser = Pick<User, 'id' | 'name' | 'email' | 'role'>;

type ConversationWithMeta = Conversation & {
  participants: (ConversationParticipant & {
    user: SafeUser;
  })[];
  messages: (Message & {
    sender: SafeUser;
  })[];
};

@Injectable()
export class MessagingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  private async getUserOrThrow(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        role: true,
        name: true,
        email: true,
      },
    });

    if (!user) throw new NotFoundException('User not found');

    return user;
  }

  private async ensureConversationParticipant(
    userId: string,
    conversationId: string,
  ) {
    const participant = await this.prisma.conversationParticipant.findUnique({
      where: {
        conversationId_userId: {
          conversationId,
          userId,
        },
      },
    });

    if (!participant) {
      throw new ForbiddenException(
        'You are not allowed to access this conversation',
      );
    }

    return participant;
  }

  private sortUsers(users: SafeUser[]) {
    return [...users].sort((a, b) =>
      (a.name || a.email || '').localeCompare(b.name || b.email || ''),
    );
  }

  private uniqueUsers(users: SafeUser[]) {
    const merged = new Map<string, SafeUser>();

    for (const user of users) {
      if (user?.id) merged.set(user.id, user);
    }

    return this.sortUsers(Array.from(merged.values()));
  }

  private async canInvestorTalkToManager(
    investorId: string,
    managerId: string,
  ): Promise<boolean> {
    const share = await this.prisma.investorShare.findFirst({
      where: {
        investorId,
        property: {
          managerId,
        },
      },
      select: { id: true },
    });

    return !!share;
  }

  private async canResidentTalkToManager(
    residentUserId: string,
    managerId: string,
  ): Promise<boolean> {
    const resident = await this.prisma.resident.findUnique({
      where: { userId: residentUserId },
      select: {
        unit: {
          select: {
            property: {
              select: {
                managerId: true,
              },
            },
          },
        },
      },
    });

    return resident?.unit?.property?.managerId === managerId;
  }

  private async canServiceProviderTalkToManager(
    providerUserId: string,
    managerId: string,
  ): Promise<boolean> {
    const provider = await this.prisma.serviceProvider.findUnique({
      where: { userId: providerUserId },
      select: {
        id: true,
        managerId: true,
        isActive: true,
      },
    });

    if (!provider?.isActive) return false;
    if (provider.managerId === managerId) return true;

    const assignedRequest = await this.prisma.maintenanceRequest.findFirst({
      where: {
        assignedProviderId: provider.id,
        property: {
          managerId,
        },
      },
      select: { id: true },
    });

    return !!assignedRequest;
  }

  private async canUsersMessageEachOther(
    userAId: string,
    userBId: string,
  ): Promise<boolean> {
    const [userA, userB] = await Promise.all([
      this.getUserOrThrow(userAId),
      this.getUserOrThrow(userBId),
    ]);

    if (userA.id === userB.id) return false;

    if (userA.role === Role.ADMIN || userB.role === Role.ADMIN) {
      return true;
    }

    if (userA.role === Role.INVESTOR && userB.role === Role.MANAGER) {
      return this.canInvestorTalkToManager(userA.id, userB.id);
    }

    if (userA.role === Role.MANAGER && userB.role === Role.INVESTOR) {
      return this.canInvestorTalkToManager(userB.id, userA.id);
    }

    if (userA.role === Role.RESIDENT && userB.role === Role.MANAGER) {
      return this.canResidentTalkToManager(userA.id, userB.id);
    }

    if (userA.role === Role.MANAGER && userB.role === Role.RESIDENT) {
      return this.canResidentTalkToManager(userB.id, userA.id);
    }

    if (
      userA.role === Role.SERVICE_PROVIDER &&
      userB.role === Role.MANAGER
    ) {
      return this.canServiceProviderTalkToManager(userA.id, userB.id);
    }

    if (
      userA.role === Role.MANAGER &&
      userB.role === Role.SERVICE_PROVIDER
    ) {
      return this.canServiceProviderTalkToManager(userB.id, userA.id);
    }

    return false;
  }

  async getAvailableContacts(userId: string): Promise<SafeUser[]> {
    const currentUser = await this.getUserOrThrow(userId);

    if (currentUser.role === Role.ADMIN) {
      const users = await this.prisma.user.findMany({
        where: {
          id: { not: userId },
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
        orderBy: [{ role: 'asc' }, { name: 'asc' }],
      });

      return this.uniqueUsers(users);
    }

    if (currentUser.role === Role.INVESTOR) {
      const managerRows = await this.prisma.investorShare.findMany({
        where: {
          investorId: userId,
          property: {
            managerId: { not: null },
          },
        },
        select: {
          property: {
            select: {
              manager: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  role: true,
                },
              },
            },
          },
        },
      });

      return this.uniqueUsers(
        managerRows
          .map((row) => row.property.manager)
          .filter((user): user is SafeUser => !!user),
      );
    }

    if (currentUser.role === Role.RESIDENT) {
      const resident = await this.prisma.resident.findUnique({
        where: { userId },
        select: {
          unit: {
            select: {
              property: {
                select: {
                  manager: {
                    select: {
                      id: true,
                      name: true,
                      email: true,
                      role: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      const manager = resident?.unit?.property?.manager;

      return manager ? [manager] : [];
    }

    if (currentUser.role === Role.SERVICE_PROVIDER) {
      const provider = await this.prisma.serviceProvider.findUnique({
        where: { userId },
        select: {
          id: true,
          manager: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
          isActive: true,
        },
      });

      if (!provider?.isActive) return [];

      const directManagers = provider.manager ? [provider.manager] : [];

      const assignedManagerRows = await this.prisma.maintenanceRequest.findMany({
        where: {
          assignedProviderId: provider.id,
          property: {
            managerId: { not: null },
          },
        },
        select: {
          property: {
            select: {
              manager: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  role: true,
                },
              },
            },
          },
        },
      });

      return this.uniqueUsers([
        ...directManagers,
        ...assignedManagerRows
          .map((row) => row.property.manager)
          .filter((user): user is SafeUser => !!user),
      ]);
    }

    if (currentUser.role === Role.MANAGER) {
      const investorRows = await this.prisma.investorShare.findMany({
        where: {
          property: {
            managerId: userId,
          },
        },
        select: {
          investor: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
        },
      });

      const residentRows = await this.prisma.resident.findMany({
        where: {
          unit: {
            property: {
              managerId: userId,
            },
          },
        },
        select: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
        },
      });

      const providerRows = await this.prisma.serviceProvider.findMany({
        where: {
          managerId: userId,
          isActive: true,
        },
        select: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
        },
      });

      const assignedProviderRows =
        await this.prisma.maintenanceRequest.findMany({
          where: {
            property: {
              managerId: userId,
            },
            assignedProviderId: { not: null },
          },
          select: {
            assignedProvider: {
              select: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                  },
                },
              },
            },
          },
        });

      return this.uniqueUsers([
        ...investorRows.map((row) => row.investor),
        ...residentRows.map((row) => row.user),
        ...providerRows.map((row) => row.user),
        ...assignedProviderRows
          .map((row) => row.assignedProvider?.user)
          .filter((user): user is SafeUser => !!user),
      ]);
    }

    return [];
  }

  async createConversation(
    currentUserId: string,
    otherUserId: string,
  ): Promise<
    Conversation & {
      participants: (ConversationParticipant & {
        user: SafeUser;
      })[];
    }
  > {
    const allowed = await this.canUsersMessageEachOther(
      currentUserId,
      otherUserId,
    );

    if (!allowed) {
      throw new ForbiddenException(
        'Messaging is only allowed between connected users',
      );
    }

    const existingConversations = await this.prisma.conversation.findMany({
      where: {
        AND: [
          {
            participants: {
              some: { userId: currentUserId },
            },
          },
          {
            participants: {
              some: { userId: otherUserId },
            },
          },
        ],
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
              },
            },
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    const existingDirectConversation = existingConversations.find(
      (conversation) =>
        conversation.participants.length === 2 &&
        conversation.participants.some(
          (participant) => participant.userId === currentUserId,
        ) &&
        conversation.participants.some(
          (participant) => participant.userId === otherUserId,
        ),
    );

    if (existingDirectConversation) {
      return existingDirectConversation;
    }

    return this.prisma.conversation.create({
      data: {
        participants: {
          create: [{ userId: currentUserId }, { userId: otherUserId }],
        },
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
              },
            },
          },
        },
      },
    });
  }

  async sendMessage(
    conversationId: string,
    senderId: string,
    content: string,
  ): Promise<Message> {
    await this.ensureConversationParticipant(senderId, conversationId);

    const cleanedContent = content.trim();

    if (!cleanedContent) {
      throw new ForbiddenException('Message content cannot be empty');
    }

    const participants = await this.prisma.conversationParticipant.findMany({
      where: { conversationId },
      select: {
        userId: true,
      },
    });

    const message = await this.prisma.message.create({
      data: {
        conversationId,
        senderId,
        content: cleanedContent,
      },
    });

    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    for (const participant of participants) {
      if (participant.userId === senderId) continue;

      await this.notifications.createNotification({
        userId: participant.userId,
        title: 'New Message',
        message: cleanedContent.slice(0, 100),
        type: 'SYSTEM',
      });
    }

    return message;
  }

  async getConversationMessages(
    userId: string,
    conversationId: string,
  ): Promise<(Message & { sender: SafeUser })[]> {
    await this.ensureConversationParticipant(userId, conversationId);

    return this.prisma.message.findMany({
      where: { conversationId },
      orderBy: [
        {
          createdAt: 'asc',
        },
        {
          id: 'asc',
        },
      ],
      include: {
        sender: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
          },
        },
      },
    });
  }

  async getUserConversations(userId: string): Promise<ConversationWithMeta[]> {
    const participants = await this.prisma.conversationParticipant.findMany({
      where: { userId },
      include: {
        conversation: {
          include: {
            participants: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                  },
                },
              },
            },
            messages: {
              take: 1,
              orderBy: [
                {
                  createdAt: 'desc',
                },
                {
                  id: 'desc',
                },
              ],
              include: {
                sender: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        conversation: {
          updatedAt: 'desc',
        },
      },
    });

    const uniqueConversations = new Map<string, ConversationWithMeta>();

    for (const participant of participants) {
      uniqueConversations.set(participant.conversation.id, participant.conversation);
    }

    return Array.from(uniqueConversations.values());
  }

  async markAsRead(userId: string, messageId: string): Promise<Message> {
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
      include: {
        conversation: {
          include: {
            participants: true,
          },
        },
      },
    });

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    const isParticipant = message.conversation.participants.some(
      (participant) => participant.userId === userId,
    );

    if (!isParticipant) {
      throw new ForbiddenException(
        'You are not allowed to mark this message as read',
      );
    }

    return this.prisma.message.update({
      where: { id: messageId },
      data: { readAt: new Date() },
    });
  }
}