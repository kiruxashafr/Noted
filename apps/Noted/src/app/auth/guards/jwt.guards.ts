import { AccessTokenPayload } from "../interfaces/jwt.interface";
import { CanActivate, ExecutionContext, HttpStatus, Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { ApiException } from "@noted/common/errors/api-exception";
import { ErrorCodes } from "@noted/common/errors/error-codes.const";
import type { Request } from "express";

@Injectable()
export class JwtAuthGuard implements CanActivate {
  private readonly logger = new Logger(JwtAuthGuard.name);
  private readonly accessSecret: string;

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    this.accessSecret = this.configService.get<string>("JWT_ACCESS_SECRET", "");
  }

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      this.logger.warn("JwtGuard canActivate() | Missing Authorization header");
      throw new ApiException(ErrorCodes.MISSING_TOKEN, HttpStatus.UNAUTHORIZED);
    }

    const [scheme, token] = authHeader.split(" ");
    if (scheme !== "Bearer") {
      throw new ApiException(ErrorCodes.INVALID_AUTH_SCHEME, HttpStatus.UNAUTHORIZED);
    }

    if (!token) {
      throw new ApiException(ErrorCodes.INVALID_TOKEN, HttpStatus.UNAUTHORIZED);
    }

    try {
      const payload = this.jwtService.verify<AccessTokenPayload>(token, { secret: this.accessSecret });
      request.user = payload;
      return true;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "unknown error";
      this.logger.warn(`JwtGuard canActivate() | Token verification failed: ${message}`);
      throw new ApiException(ErrorCodes.INVALID_TOKEN, HttpStatus.UNAUTHORIZED);
    }
  }
}
