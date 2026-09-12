import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service.js';
import { AuthController } from './auth.controller.js';
import { JwtStrategy } from './strategies/jwt.strategy.js';

@Module({
    imports: [
        PassportModule,
        JwtModule.registerAsync({
            inject: [ConfigService],
            useFactory: (config: ConfigService) => ({
                secret: config.getOrThrow<string>('jwt.secret'),
                signOptions: { expiresIn: config.get<number>('jwt.expiresIn') },
            }),
        }),
    ],
    controllers: [AuthController],
    providers: [AuthService, JwtStrategy],
})
export class AuthModule { }
