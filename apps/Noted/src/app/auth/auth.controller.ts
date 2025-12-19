import { Body, Controller, HttpCode, HttpStatus, Post, Req, Res } from "@nestjs/common";

import { AuthService } from "./auth.service";
import { LoginDto } from "./dto/login.dto";
import { RegisterRequest } from "./dto/register.dto";

import type { Request, Response } from "express";
import { ConfigService } from "@nestjs/config";
import { isDev } from "@noted/common/utils/is-dev";
import { ApiException } from "@noted/common/errors/api-exception";
import { ApiBody, ApiCookieAuth, ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { ReadAuthDto } from "./dto/readAuth.dto";
import { ReadRefreshDto } from "./dto/readRefresh.dto";

@ApiTags('Authentication')
@Controller("auth")
export class AuthController {
  private readonly cookieDomain: string;
  private readonly refreshTtl: number;
  private readonly accessTtl: number;

  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {
    this.cookieDomain = configService.getOrThrow<string>("COOKIE_DOMAIN");
    this.refreshTtl = configService.getOrThrow<number>("JWT_REFRESH_TTL_SECONDS", 604800);
    this.accessTtl = configService.getOrThrow<number>("JWT_ACCESS_TTL_SECONDS", 900);
  }

  @Post("register")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register new user' })
  @ApiBody({ type: RegisterRequest })
  @ApiResponse({ 
    status: 201, 
    description: 'User registered successfully',
    type: ReadAuthDto 
  })
  @ApiResponse({ 
    status: 409, 
    description: 'Email already exists' 
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Validation error' 
  })
  async register(@Res({ passthrough: true }) res: Response, @Body() dto: RegisterRequest) {
    const authResult = await this.authService.register(dto);

    this.setRefreshTokenCookie(res, authResult.refreshToken);

    return { accessToken: authResult.accessToken };
  }

  @Post("login")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login user' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({ 
    status: 200, 
    description: 'Login successful',
    type: ReadAuthDto 
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Invalid credentials' 
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Validation error' 
  })
  async login(@Res({ passthrough: true }) res: Response, @Body() dto: LoginDto) {
    const authResult = await this.authService.login(dto);

    this.setRefreshTokenCookie(res, authResult.refreshToken);

    return { accessToken: authResult.accessToken };
  }

  @Post("refresh")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({ 
    status: 200, 
    description: 'Token refreshed successfully',
    type: ReadRefreshDto
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Invalid or missing refresh token' 
  })
  @ApiCookieAuth('refreshToken') 
  async refresh(@Req() req: Request) {
    const refreshToken = req.cookies["refreshToken"];

    if (!refreshToken) {
      throw new ApiException("REFRESH_TOKEN_MISSING", HttpStatus.UNAUTHORIZED);
    }

    const accessToken = await this.authService.refresh(refreshToken);

    return { accessToken };
  }

  @Post("logout")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout user' })
  @ApiResponse({ 
    status: 200, 
    description: 'Logout successful',
    schema: {
      example: {
        message: "Logged out successfully"
      }
    }
  })
  @ApiCookieAuth('refreshToken')
  async logout(@Res({ passthrough: true }) res: Response) {
    this.clearRefreshTokenCookie(res);

    return { message: "Logged out successfully" };
  }

  private setRefreshTokenCookie(res: Response, refreshToken: string): void {
    const refreshMaxAge = this.refreshTtl * 1000;

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      domain: this.cookieDomain,
      maxAge: refreshMaxAge,
      secure: !isDev(this.configService),
      sameSite: isDev(this.configService) ? "none" : "lax",
    });
  }

  private clearRefreshTokenCookie(res: Response): void {
    res.cookie("refreshToken", "", {
      httpOnly: true,
      domain: this.cookieDomain,
      expires: new Date(0),
      secure: !isDev(this.configService),
      sameSite: isDev(this.configService) ? "none" : "lax",
    });
  }
}
