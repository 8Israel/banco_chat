import { registerAs } from '@nestjs/config';

export default registerAs('jwt', () => ({
    secret: process.env.JWT_SECRET,
    // en segundos, para calzar con el tipo `number` que espera @nestjs/jwt
    expiresIn: Number(process.env.JWT_EXPIRES_IN ?? 28800),
}));
