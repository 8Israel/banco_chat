import { Body, Controller, Get, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { LoginDto } from './dto/login.dto.js';
import { Public } from '../../core/decorators/public.decorator.js';
import { ResponseMessage } from '../../core/decorators/response-message.decorator.js';
import { CurrentUser, type AuthenticatedUser } from '../../core/decorators/current-user.decorator.js';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Public()
    @Post('login')
    @HttpCode(HttpStatus.OK)
    @ResponseMessage('Inicio de sesión exitoso')
    login(@Body() dto: LoginDto) {
        return this.authService.login(dto.userName, dto.password);
    }

    @Get('me')
    @ResponseMessage('Perfil obtenido')
    me(@CurrentUser() user: AuthenticatedUser) {
        return this.authService.getProfile(user.id);
    }
}
