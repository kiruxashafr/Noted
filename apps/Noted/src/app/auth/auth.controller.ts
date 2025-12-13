import { Body, Controller, HttpCode, HttpStatus, Post, Req, Res } from "@nestjs/common";

import { AuthService } from "./auth.service";
import { LoginDto } from "./dto/login.dto";
import { RegisterRequest } from "./dto/register.dto";

import type { Request, Response } from "express";
import { ConfigService } from "@nestjs/config";
import { isDev } from "../utils/is-dev.utils";

@Controller("auth")
export class AuthController {
  private readonly COOKIE_DOMAIN: string;

  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {
    this.COOKIE_DOMAIN = configService.getOrThrow<string>("COOKIE_DOMAIN");
  }

  @Post("register")
  @HttpCode(HttpStatus.CREATED)
  async register(@Res({ passthrough: true }) res: Response, @Body() dto: RegisterRequest) {
    const authResult = await this.authService.register(dto);

    this.setRefreshTokenCookie(res, authResult.refreshToken);

    return { accessToken: authResult.accessToken };
  }

  @Post("login")
  @HttpCode(HttpStatus.OK)
  async login(@Res({ passthrough: true }) res: Response, @Body() dto: LoginDto) {
    const authResult = await this.authService.login(dto);

    this.setRefreshTokenCookie(res, authResult.refreshToken);

    return { accessToken: authResult.accessToken };
  }

  @Post("refresh")
  @HttpCode(HttpStatus.OK)
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req.cookies["refreshToken"];
    const authResult = await this.authService.refresh(refreshToken);

    this.setRefreshTokenCookie(res, authResult.refreshToken);

    return { accessToken: authResult.accessToken };
  }

  @Post("logout")
  @HttpCode(HttpStatus.OK)
  async logout(@Res({ passthrough: true }) res: Response) {
    this.clearRefreshTokenCookie(res);

    return { message: "Logged out successfully" };
  }

  private setRefreshTokenCookie(res: Response, refreshToken: string): void {
    const expires = new Date(Date.now() + 60 * 60 * 24 * 7 * 1000); // 7 дней

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      domain: this.COOKIE_DOMAIN,
      expires,
      secure: !isDev(this.configService),
      sameSite: isDev(this.configService) ? "none" : "lax",
    });
  }

  private clearRefreshTokenCookie(res: Response): void {
    res.cookie("refreshToken", "", {
      httpOnly: true,
      domain: this.COOKIE_DOMAIN,
      expires: new Date(0),
      secure: !isDev(this.configService),
      sameSite: isDev(this.configService) ? "none" : "lax",
    });
  }
}
