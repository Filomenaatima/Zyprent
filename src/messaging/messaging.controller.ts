import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { MessagingService } from './messaging.service';
import { SendMessageDto } from './dto/send-message.dto';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { JwtGuard } from '../auth/guards/jwt.guard';

@Controller('messages')
@UseGuards(JwtGuard)
export class MessagingController {
  constructor(private readonly messagingService: MessagingService) {}

  @Get('contacts')
  getAvailableContacts(@Req() req: Request) {
    const userId = (req.user as any).id;
    return this.messagingService.getAvailableContacts(userId);
  }

  @Post('conversation')
  createConversation(@Req() req: Request, @Body() dto: CreateConversationDto) {
    const userId = (req.user as any).id;
    return this.messagingService.createConversation(userId, dto.otherUserId);
  }

  @Post('send')
  sendMessage(@Req() req: Request, @Body() dto: SendMessageDto) {
    const userId = (req.user as any).id;
    return this.messagingService.sendMessage(
      dto.conversationId,
      userId,
      dto.content,
    );
  }

  @Get('conversation/:id')
  getConversationMessages(@Req() req: Request, @Param('id') id: string) {
    const userId = (req.user as any).id;
    return this.messagingService.getConversationMessages(userId, id);
  }

  @Get('me')
  getMyConversations(@Req() req: Request) {
    const userId = (req.user as any).id;
    return this.messagingService.getUserConversations(userId);
  }

  @Patch(':messageId/read')
  markRead(@Req() req: Request, @Param('messageId') messageId: string) {
    const userId = (req.user as any).id;
    return this.messagingService.markAsRead(userId, messageId);
  }
}