import { ConflictException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { RegisterRequest } from './dto/register.dto';
import { ConfigService } from '@nestjs/config';
import bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { StringValue } from 'jws';







@Injectable()
export class AuthService {
    private readonly JWT_SECRET:string;
    private readonly JWT_ACCESS_TOKEN_TTL:string;
    private readonly JWT_REFRESH_TOKEN_TTL:string;

    constructor(
        private readonly prisma: PrismaService,
        private readonly configService: ConfigService,
        private readonly jwtService: JwtService,
    ) {
        this.JWT_SECRET = this.configService.getOrThrow<string>('JWT_SECRET');
        this.JWT_ACCESS_TOKEN_TTL = this.configService.getOrThrow<string>('JWT_ACCESS_TOKEN_TTL');
        this.JWT_REFRESH_TOKEN_TTL = this.configService.getOrThrow<string>('JWT_REFRESH_TOKEN_TTL');
    }

    async register(dto: RegisterRequest) {
        const { name, email, password } = dto;

        const existUser = await this.prisma.user.findUnique({
            where: { email },
        });

        if (existUser) {
            throw new ConflictException('Пользователь с таким email уже существует');
        }

        const user = await this.prisma.user.create({
            data: {
                name,
                email,
                password: await bcrypt.hash(password, 10),
            },
        });

        return this.generateTokens(user.id);
        
}
private generateTokens(userId: string) {
    const payload = { sub: userId };

    const accessToken = this.jwtService.sign(payload, {
        expiresIn: this.JWT_ACCESS_TOKEN_TTL as StringValue, // импортируй из jws
    });

    const refreshToken = this.jwtService.sign(payload, {
        expiresIn: this.JWT_REFRESH_TOKEN_TTL as StringValue,
    });

    return { accessToken, refreshToken };
}}