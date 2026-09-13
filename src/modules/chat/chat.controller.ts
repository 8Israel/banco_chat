import { Body, Controller, Get, Param, ParseIntPipe, Post } from '@nestjs/common';
import { ChatService } from './chat.service.js';
import { SendMessageDto } from './dto/send-message.dto.js';
import { CurrentUser, type AuthenticatedUser } from '../../core/decorators/current-user.decorator.js';
import { ResponseMessage } from '../../core/decorators/response-message.decorator.js';

@Controller('chat/sessions')
export class ChatController {
    constructor(private readonly chatService: ChatService) { }

    @Post()
    @ResponseMessage('Sesión de chat creada')
    createSession(@CurrentUser() user: AuthenticatedUser) {
        return this.chatService.createSession(user.id);
    }

    @Get()
    @ResponseMessage('Sesiones obtenidas')
    listSessions(@CurrentUser() user: AuthenticatedUser) {
        return this.chatService.listSessions(user.id);
    }

    @Get(':id/messages')
    @ResponseMessage('Mensajes obtenidos')
    getMessages(
        @CurrentUser() user: AuthenticatedUser,
        @Param('id', ParseIntPipe) id: number,
    ) {
        return this.chatService.getMessages(user.id, id);
    }

    @Post(':id/messages')
    @ResponseMessage('Mensaje enviado')
    sendMessage(
        @CurrentUser() user: AuthenticatedUser,
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: SendMessageDto,
    ) {
        return this.chatService.sendMessage(user.id, id, dto.content);
    }
}
