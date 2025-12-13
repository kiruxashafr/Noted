import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { StringValue } from "jws";
import { PrismaService } from "../prisma.service";
import { LoginDto } from "./dto/login.dto";
import { RegisterRequest } from "./dto/register.dto";
import { JwtPayload } from "./interfaces/jwt.interface";

import * as argon2 from "argon2";
import { isPrismaConstraintError } from "@noted/common/db/prisma-error.utils";
import { PrismaErrorCode } from "@noted/common/db/database-error-codes";
import { ReadAuthDto } from "./dto/readAuth.dto";
import { plainToInstance } from "class-transformer";

@Injectable()
export class AuthService {
  private readonly jwtSecret: string;
  private readonly jwtAccessTokenTTL: string;
  private readonly jwtRefreshTokenTTL: string;

  private readonly COOKIE_DOMAIN: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {
    this.jwtSecret = this.configService.getOrThrow<string>("JWT_SECRET");
    this.jwtAccessTokenTTL = this.configService.getOrThrow<string>("JWT_ACCESS_TOKEN_TTL");
    this.jwtRefreshTokenTTL = this.configService.getOrThrow<string>("JWT_REFRESH_TOKEN_TTL");

    this.COOKIE_DOMAIN = configService.getOrThrow<string>("COOKIE_DOMAIN");
  }

  async register(dto: RegisterRequest) {
    const { name, email, password } = dto;

    const hashPassword = await argon2.hash(password);

    try {
      const user = await this.prisma.user.create({
        data: {
          name,
          email,
          password: hashPassword,
        },
      });

      const tokens = this.generateTokens(user.id);

      const registerData = {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        userId: user.id,
      };

      return plainToInstance(ReadAuthDto, registerData, {
        excludeExtraneousValues: true,
      });
    } catch (error) {
      this.handleAccountConstraintError(error);
    }
  }

  async login(dto: LoginDto): Promise<ReadAuthDto> {
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

    const authData = {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      userId: user.id,
    };

    return plainToInstance(ReadAuthDto, authData, {
      excludeExtraneousValues: true,
    });
  }

  async refresh(refreshToken: string) {
    if (!refreshToken) {
      throw new UnauthorizedException("Токен не найден");
    }

    let payload: JwtPayload;
    try {
      payload = await this.jwtService.verifyAsync(refreshToken);
    } catch {
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

    const authData = {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      userId: user.id,
    };

    return plainToInstance(ReadAuthDto, authData, {
      excludeExtraneousValues: true,
    });
  }

  private generateTokens(userId: string) {
    const payload = { sub: userId };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: this.jwtAccessTokenTTL as StringValue,
    });

    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: this.jwtRefreshTokenTTL as StringValue,
    });

    return { accessToken, refreshToken };
  }

  private handleAccountConstraintError(error: unknown): never {
    if (!isPrismaConstraintError(error)) {
      throw new BadRequestException("Failed to persist user");
    }

    if (error.code === PrismaErrorCode.UNIQUE_CONSTRAINT_FAILED && error.meta?.modelName === "User") {
      throw new ConflictException("Email already in use");
    }

    throw new ConflictException("Duplicate value not allowed");
  }
}
