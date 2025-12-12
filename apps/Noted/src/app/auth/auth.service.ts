import { ConflictException, Injectable, NotFoundException, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { StringValue } from "jws";
import { PrismaService } from "../prisma.service";
import { LoginRequest } from "./dto/login.dto";
import { RegisterRequest } from "./dto/register.dto";
import { JwtPayload } from "./interfaces/jwt.interface";

import * as argon2 from "argon2";

@Injectable()
export class AuthService {
  private readonly JWT_SECRET: string;
  private readonly JWT_ACCESS_TOKEN_TTL: string;
  private readonly JWT_REFRESH_TOKEN_TTL: string;

  private readonly COOKIE_DOMAIN: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {
    this.JWT_SECRET = this.configService.getOrThrow<string>("JWT_SECRET");
    this.JWT_ACCESS_TOKEN_TTL = this.configService.getOrThrow<string>("JWT_ACCESS_TOKEN_TTL");
    this.JWT_REFRESH_TOKEN_TTL = this.configService.getOrThrow<string>("JWT_REFRESH_TOKEN_TTL");

    this.COOKIE_DOMAIN = configService.getOrThrow<string>("COOKIE_DOMAIN");
  }

  async register(dto: RegisterRequest) {
    const { name, email, password } = dto;

    const existUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existUser) {
      throw new ConflictException("Пользователь с таким email уже существует");
    }

    const hashPassword = await argon2.hash(password);

    const user = await this.prisma.user.create({
      data: {
        name,
        email,
        password: hashPassword,
      },
    });

    const tokens = this.generateTokens(user.id);

    return {
      ...tokens,
      userId: user.id,
    };
  }

  async login(dto: LoginRequest) {
    const { email, password } = dto;

    const user = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true, password: true },
    });

    if (!user) {
      throw new NotFoundException("Пользователь не найден");
    }

    const isPasswordValid = await argon2.verify(user.password, password);

    if (!isPasswordValid) {
      throw new NotFoundException("Пользователь не найден");
    }

    const tokens = this.generateTokens(user.id);

    return {
      ...tokens,
      userId: user.id,
    };
  }

  async refresh(refreshToken: string) {
    if (!refreshToken) {
      throw new UnauthorizedException("Токен не найден");
    }

    let payload: JwtPayload;
    try {
      payload = await this.jwtService.verifyAsync(refreshToken);
    } catch {
      // Обрабатываем ошибку верификации токена
      throw new UnauthorizedException("Невалидный токен");
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true },
    });

    if (!user) {
      throw new UnauthorizedException("Пользователь не найден");
    }

    const tokens = this.generateTokens(user.id);

    return {
      ...tokens,
      userId: user.id,
    };
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
}
