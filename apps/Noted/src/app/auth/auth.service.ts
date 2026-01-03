import { HttpStatus, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { PrismaService } from "../prisma.service";
import { LoginDto } from "./dto/login.dto";
import { RegisterRequest } from "./dto/register.dto";
import { AccessTokenPayload, RefreshTokenPayload } from "./interfaces/jwt.interface";
import * as argon2 from "argon2";
import { isPrismaConstraintError } from "@noted/common/db/prisma-error.utils";
import { PrismaErrorCode } from "@noted/common/db/database-error-codes";
import { ReadAuthDto } from "./dto/read-auth.dto";
import { plainToInstance } from "class-transformer";
import { ApiException } from "@noted/common/errors/api-exception";
import { ReadRefreshDto } from "./dto/read-refresh.dto";
import { ReadUserProfileDto } from "./dto/read-user-profile.dto";
import { isDev } from "@noted/common/utils/is-dev";
import type { Response } from "express";
import { ErrorCodes } from "@noted/common/errors/error-codes.const";

@Injectable()
export class AuthService {
  private readonly accessSecret: string;
  private readonly refreshSecret: string;
  private readonly jwtAccessTokenTTL: number;
  private readonly jwtRefreshTokenTTL: number;
  private readonly cookieDomain: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {
    this.accessSecret = this.configService.getOrThrow<string>("JWT_ACCESS_SECRET");
    this.refreshSecret = this.configService.getOrThrow<string>("JWT_REFRESH_SECRET");
    this.jwtAccessTokenTTL = +this.configService.getOrThrow<number>("JWT_ACCESS_TTL_SECONDS");
    this.jwtRefreshTokenTTL = +this.configService.getOrThrow<number>("JWT_REFRESH_TTL_SECONDS");
    this.cookieDomain = configService.getOrThrow<string>("COOKIE_DOMAIN");
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

      const tokens = {
        accessToken: await this.generateAccessToken(user.id),
        refreshToken: await this.generateRefreshToken(user.id),
      };

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
      throw new ApiException(ErrorCodes.INVALID_CREDENTIALS, HttpStatus.UNAUTHORIZED);
    }

    const isPasswordValid = await argon2.verify(user.password, password);

    if (!isPasswordValid) {
      throw new ApiException(ErrorCodes.INVALID_CREDENTIALS, HttpStatus.UNAUTHORIZED);
    }

    const tokens = {
      accessToken: await this.generateAccessToken(user.id),
      refreshToken: await this.generateRefreshToken(user.id),
    };

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
    let payload: RefreshTokenPayload;
    try {
      payload = await this.jwtService.verifyAsync(refreshToken, { secret: this.refreshSecret });
    } catch {
      throw new ApiException(ErrorCodes.INVALID_CREDENTIALS, HttpStatus.UNAUTHORIZED);
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true },
    });

    if (!user) {
      throw new ApiException(ErrorCodes.USER_NOT_FOUND, HttpStatus.UNAUTHORIZED);
    }

    const accessToken = await this.generateAccessToken(user.id);

    return plainToInstance(
      ReadRefreshDto,
      { accessToken },
      {
        excludeExtraneousValues: true,
      },
    );
  }

  async getUserProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new ApiException(ErrorCodes.USER_NOT_FOUND, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    return plainToInstance(ReadUserProfileDto, user, {
      excludeExtraneousValues: true,
    });
  }
  async generateRefreshToken(userId: string): Promise<string> {
    const payload: RefreshTokenPayload = {
      sub: userId,
    };

    return this.jwtService.signAsync(payload, {
      expiresIn: this.jwtRefreshTokenTTL,
      secret: this.refreshSecret,
    });
  }

  async generateAccessToken(userId: string): Promise<string> {
    const payload: AccessTokenPayload = {
      sub: userId,
    };

    return this.jwtService.signAsync(payload, {
      expiresIn: this.jwtAccessTokenTTL,
      secret: this.accessSecret,
    });
  }

  setRefreshTokenCookie(res: Response, refreshToken: string): void {
    const refreshMaxAge = this.jwtRefreshTokenTTL;

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      domain: this.cookieDomain,
      maxAge: refreshMaxAge,
      secure: !isDev(this.configService),
      sameSite: isDev(this.configService) ? "none" : "lax",
    });
  }

  clearRefreshTokenCookie(res: Response): void {
    res.cookie("refreshToken", "", {
      httpOnly: true,
      domain: this.cookieDomain,
      expires: new Date(0),
      secure: !isDev(this.configService),
      sameSite: isDev(this.configService) ? "none" : "lax",
    });
  }

  private handleAccountConstraintError(error: unknown): never {
    if (!isPrismaConstraintError(error)) {
      throw new ApiException(ErrorCodes.REGISTRATION_FAILED, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    if (error.code === PrismaErrorCode.UNIQUE_CONSTRAINT_FAILED && error.meta?.modelName === "User") {
      throw new ApiException(ErrorCodes.EMAIL_ALREADY_EXISTS, HttpStatus.CONFLICT);
    }

    throw new ApiException(ErrorCodes.DUPLICATE_VALUE, HttpStatus.CONFLICT);
  }
}
