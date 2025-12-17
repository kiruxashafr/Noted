// apps/Noted/src/app/auth/auth.controller.spec.ts
import { Test, TestingModule } from "@nestjs/testing";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { ConfigService } from "@nestjs/config";
import { LoginDto } from "./dto/login.dto";
import { RegisterRequest } from "./dto/register.dto";
import type { Request, Response } from "express";

// Мок AuthService
const mockAuthService = {
  register: jest.fn(),
  login: jest.fn(),
  refresh: jest.fn(),
};

describe("AuthController", () => {
  let controller: AuthController;
  let authService: AuthService;

  // Мок Response
  const createMockResponse = () => {
    const res: Partial<Response> = {};
    res.cookie = jest.fn().mockReturnValue(res);
    return res;
  };

  // Мок Request
  const createMockRequest = (cookies = {}) =>
    ({
      cookies,
    }) as Request;

  beforeEach(async () => {
    // Создаем мок ConfigService для каждого теста
    const mockConfigService = {
      getOrThrow: jest.fn((key: string) => {
        const config: Record<string, string> = {
          COOKIE_DOMAIN: "localhost",
          NODE_ENV: "test", // ← Возвращаем "test" (не "development")
        };

        if (key in config) {
          return config[key];
        }
        throw new Error(`Unknown config key: ${key}`);
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);

    jest.clearAllMocks();
  });

  describe("POST /auth/register", () => {
    it("должен регистрировать пользователя и устанавливать cookie", async () => {
      const registerDto: RegisterRequest = {
        name: "Иван",
        email: "ivan@test.com",
        password: "password123",
      };

      const authResult = {
        accessToken: "access-token-123",
        refreshToken: "refresh-token-456",
        userId: "user-id-123",
      };

      const response = createMockResponse();
      mockAuthService.register.mockResolvedValue(authResult);

      const result = await controller.register(response as Response, registerDto);

      expect(authService.register).toHaveBeenCalledWith(registerDto);

      // Для NODE_ENV="test" (не "development"):
      // isDev() вернет false (потому что "test" !== "development")
      // secure: !isDev() → true
      // sameSite: isDev() ? "none" : "lax" → "lax"
      expect(response.cookie).toHaveBeenCalledWith(
        "refreshToken",
        "refresh-token-456",
        expect.objectContaining({
          httpOnly: true,
          domain: "localhost",
          secure: true, // !isDev() = true
          sameSite: "lax", // isDev() ? "none" : "lax" = "lax"
          expires: expect.any(Date),
        }),
      );

      expect(result).toEqual({ accessToken: "access-token-123" });
    });

    it("должен возвращать ошибку если сервис выбрасывает исключение", async () => {
      const registerDto: RegisterRequest = {
        name: "Иван",
        email: "ivan@test.com",
        password: "password123",
      };

      const response = createMockResponse();
      mockAuthService.register.mockRejectedValue(new Error("Email already exists"));

      await expect(controller.register(response as Response, registerDto)).rejects.toThrow("Email already exists");
    });
  });

  describe("POST /auth/login", () => {
    it("должен авторизовывать пользователя и устанавливать cookie", async () => {
      const loginDto: LoginDto = {
        email: "ivan@test.com",
        password: "password123",
      };

      const authResult = {
        accessToken: "access-token-123",
        refreshToken: "refresh-token-456",
        userId: "user-id-123",
      };

      const response = createMockResponse();
      mockAuthService.login.mockResolvedValue(authResult);

      const result = await controller.login(response as Response, loginDto);

      expect(authService.login).toHaveBeenCalledWith(loginDto);

      expect(response.cookie).toHaveBeenCalledWith(
        "refreshToken",
        "refresh-token-456",
        expect.objectContaining({
          httpOnly: true,
          domain: "localhost",
          secure: true,
          sameSite: "lax",
        }),
      );

      expect(result).toEqual({ accessToken: "access-token-123" });
    });
  });

  describe("POST /auth/refresh", () => {
    it("должен возвращать новый access token", async () => {
      const request = createMockRequest({ refreshToken: "valid-refresh-token" });
      mockAuthService.refresh.mockResolvedValue("new-access-token");

      const result = await controller.refresh(request);

      expect(authService.refresh).toHaveBeenCalledWith("valid-refresh-token");
      expect(result).toEqual({ accessToken: "new-access-token" });
    });

    it("должен обрабатывать отсутствие refresh token", async () => {
      const request = createMockRequest({});
      mockAuthService.refresh.mockRejectedValue(new Error("REFRESH_TOKEN_MISSING"));

      await expect(controller.refresh(request)).rejects.toThrow("REFRESH_TOKEN_MISSING");
    });
  });

  describe("POST /auth/logout", () => {
    it("должен очищать cookie и возвращать сообщение", async () => {
      const response = createMockResponse();

      const result = await controller.logout(response as Response);

      expect(response.cookie).toHaveBeenCalledWith(
        "refreshToken",
        "",
        expect.objectContaining({
          expires: new Date(0),
          httpOnly: true,
          domain: "localhost",
          secure: true,
          sameSite: "lax",
        }),
      );

      expect(result).toEqual({ message: "Logged out successfully" });
    });
  });

  describe("Вспомогательные методы", () => {
    it("setRefreshTokenCookie должен устанавливать cookie", () => {
      const response = createMockResponse();
      const refreshToken = "test-refresh-token";

      // Вызываем приватный метод
      (controller as any).setRefreshTokenCookie(response as Response, refreshToken);

      expect(response.cookie).toHaveBeenCalledWith(
        "refreshToken",
        refreshToken,
        expect.objectContaining({
          httpOnly: true,
          domain: "localhost",
          secure: true, // !isDev() = true
          sameSite: "lax", // isDev() ? "none" : "lax" = "lax"
          expires: expect.any(Date),
        }),
      );
    });

    it("clearRefreshTokenCookie должен очищать cookie", () => {
      const response = createMockResponse();

      (controller as any).clearRefreshTokenCookie(response as Response);

      expect(response.cookie).toHaveBeenCalledWith(
        "refreshToken",
        "",
        expect.objectContaining({
          expires: new Date(0),
          httpOnly: true,
          domain: "localhost",
          secure: true,
          sameSite: "lax",
        }),
      );
    });

    it("должен работать с NODE_ENV=development для isDev=true", async () => {
      // Пересоздаем модуль с другим моком ConfigService
      const mockConfigService = {
        getOrThrow: jest.fn((key: string) => {
          if (key === "COOKIE_DOMAIN") return "localhost";
          if (key === "NODE_ENV") return "development"; // ← Теперь "development"
          throw new Error(`Unknown config key: ${key}`);
        }),
      };

      const module: TestingModule = await Test.createTestingModule({
        controllers: [AuthController],
        providers: [
          { provide: AuthService, useValue: mockAuthService },
          { provide: ConfigService, useValue: mockConfigService },
        ],
      }).compile();

      const devController = module.get<AuthController>(AuthController);
      const response = createMockResponse();
      const refreshToken = "test-token";

      // Вызываем приватный метод
      (devController as any).setRefreshTokenCookie(response as Response, refreshToken);

      // Для NODE_ENV="development":
      // isDev() вернет true
      // secure: !isDev() → false
      // sameSite: isDev() ? "none" : "lax" → "none"
      expect(response.cookie).toHaveBeenCalledWith(
        "refreshToken",
        refreshToken,
        expect.objectContaining({
          secure: false, // !isDev() = false
          sameSite: "none", // isDev() ? "none" : "lax" = "none"
        }),
      );
    });
  });
});
