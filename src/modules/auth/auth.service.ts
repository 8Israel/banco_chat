import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../infrastructure/prisma/prisma.service.js';
import { comparePassword } from '../../common/utils/password.util.js';
import {
    InvalidCredentialsError,
    AccountInactiveError,
    UserNotFoundError,
} from '../../common/errors/app-errors.js';

@Injectable()
export class AuthService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly jwtService: JwtService,
    ) { }

    async login(userName: string, password: string) {
        const user = await this.prisma.user.findUnique({ where: { userName } });
        if (!user) {
            throw new InvalidCredentialsError();
        }

        const passwordMatches = await comparePassword(password, user.password);
        if (!passwordMatches) {
            throw new InvalidCredentialsError();
        }

        if (!user.isActive) {
            throw new AccountInactiveError();
        }

        const accessToken = await this.jwtService.signAsync({
            sub: user.id,
            userName: user.userName,
        });

        return {
            accessToken,
            user: {
                id: user.id,
                name: user.name,
                userName: user.userName,
            },
        };
    }

    async getProfile(userId: number) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                name: true,
                userName: true,
                phone: true,
                isActive: true,
                createdAt: true,
            },
        });

        if (!user) {
            throw new UserNotFoundError();
        }

        return user;
    }
}
