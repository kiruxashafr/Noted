import { ConflictException, Injectable, NotFoundException, UnauthorizedException, } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { RegisterRequest } from './dto/register.dto';
import { ConfigService } from '@nestjs/config';
import bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { StringValue } from 'jws';
import { LoginRequest } from './dto/login.dto';
import  type { Request, Response } from 'express';
import { isDev } from '../utils/is-dev.utils';
import { JwtPayload } from './interfaces/jwt.interface';









@Injectable()
export class AuthService {
    private readonly JWT_SECRET:string;
    private readonly JWT_ACCESS_TOKEN_TTL:string;
    private readonly JWT_REFRESH_TOKEN_TTL:string;

    private readonly COOKIE_DOMAIN:string;

    constructor(
        private readonly prisma: PrismaService,
        private readonly configService: ConfigService,
        private readonly jwtService: JwtService,
    ) {
        this.JWT_SECRET = this.configService.getOrThrow<string>('JWT_SECRET');
        this.JWT_ACCESS_TOKEN_TTL = this.configService.getOrThrow<string>('JWT_ACCESS_TOKEN_TTL');
        this.JWT_REFRESH_TOKEN_TTL = this.configService.getOrThrow<string>('JWT_REFRESH_TOKEN_TTL');

        this.COOKIE_DOMAIN = configService.getOrThrow<string>('COOKIE_DOMAIN');
    }

    async register(res:Response, dto: RegisterRequest) {
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

        return this.auth(res, user.id);
    }

    async login( res:Response, dto: LoginRequest) {
        const { email, password } = dto;

        const user = await this.prisma.user.findUnique({
            where: { email },
            select: { id: true, password: true },
        });

        if (!user) {
            throw new NotFoundException('Пользователь не найден');
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            throw new NotFoundException('Пользователь не найден');
        }
        return this.auth(res, user.id);
    }

async refresh(req: Request, res: Response) {
    const refreshToken = req.cookies['refreshToken'];

    if (!refreshToken) {
        throw new UnauthorizedException('Токен не найден');
    }

    const payload: JwtPayload = await this.jwtService.verifyAsync(refreshToken);

    if (payload) {
        const user = await this.prisma.user.findUnique({
            where: { id: payload.id },
            select: { id: true },
            }
    );
    if (!user) {
        throw new UnauthorizedException('Пользователь не найден');
    }
    
    return this.auth(res, user.id);
    }
}

async logout(res: Response) {
    this.setCookie(res, 'refreshToken', new Date(0));
}

private auth(res: Response, userId: string) {
    const { accessToken, refreshToken } = this.generateTokens(userId);

    this.setCookie(res, refreshToken, new Date(60*60*24*7));

    return { accessToken };
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
}

private setCookie(res: Response, value: string, expires: Date) {
    res.cookie('refreshToken', value, {
        httpOnly: true,
        domain: this.COOKIE_DOMAIN,
        expires,
        secure: !isDev(this.configService),
        sameSite: isDev(this.configService) ? 'none' : 'lax',
    });
    }
}