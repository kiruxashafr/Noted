import { Test, TestingModule } from "@nestjs/testing";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { ConfigService } from "@nestjs/config";
import { LoginDto } from "./dto/login.dto";
import { RegisterRequest } from "./dto/register.dto";
import type { Request, Response } from "express";
import { JwtModule } from "@nestjs/jwt";

const mockAuthService = {
  register: jest.fn(),
  login: jest.fn(),
  refresh: jest.fn(),
  setRefreshTokenCookie: jest.fn(),
  clearRefreshTokenCookie: jest.fn(),
};

jest.mock("@noted/common/utils/is-dev", () => ({
  isDev: jest.fn(configService => {
    const env = configService.getOrThrow("NODE_ENV");
    return env === "development";
  }),
}));

describe("AuthController", () => {
  let controller: AuthController;
  let authService: AuthService;

  const createMockResponse = () => {
    const res: Partial<Response> = {};
    res.cookie = jest.fn().mockReturnValue(res);
    return res as Response;
  };

  const createMockRequest = (cookies = {}) =>
    ({
      cookies,
    }) as Request;

  beforeEach(async () => {
    const mockConfigService = {
      getOrThrow: jest.fn((key: string) => {
        const config: Record<string, any> = {
          COOKIE_DOMAIN: "localhost",
          NODE_ENV: "test",
          JWT_ACCESS_TTL_SECONDS: "900",
          JWT_REFRESH_TTL_SECONDS: "604800",
        };

        if (key === "JWT_ACCESS_SECRET") return "test-access-secret";
        if (key === "JWT_REFRESH_SECRET") return "test-refresh-secret";

        if (key in config) return config[key];

        throw new Error(`Unknown config key in test: ${key}`);
      }),
      get: jest.fn((key: string, defaultValue?: any) => {
        try {
          return mockConfigService.getOrThrow(key);
        } catch {
          return defaultValue;
        }
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
      imports: [
        JwtModule.register({
          secret: "dummy",
        }),
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
  });

  describe("POST /auth/register", () => {
    it("should register user and set refresh token cookie", async () => {
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

      const result = await controller.register(response, registerDto);

      expect(authService.setRefreshTokenCookie).toHaveBeenCalledWith(response, "refresh-token-456");

      expect(result).toEqual({ accessToken: "access-token-123" });
    });
  });

  describe("POST /auth/login", () => {
    it("should authenticate user and set refresh token cookie", async () => {
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

      const result = await controller.login(response, loginDto);

      expect(authService.setRefreshTokenCookie).toHaveBeenCalledWith(response, "refresh-token-456");

      expect(result).toEqual({ accessToken: "access-token-123" });
    });
  });

  describe("POST /auth/refresh", () => {
    it("should return new access token using refresh token from cookies", async () => {
      const request = createMockRequest({ refreshToken: "valid-refresh-token" });
      const refreshResult = { accessToken: "new-access-token" };

      mockAuthService.refresh.mockResolvedValue(refreshResult);

      const result = await controller.refresh(request);

      expect(authService.refresh).toHaveBeenCalledWith("valid-refresh-token");
      expect(result).toEqual({ accessToken: "new-access-token" });
    });
  });

  describe("POST /auth/logout", () => {
    it("should clear refresh token cookie and return success message", async () => {
      const response = createMockResponse();

      const result = await controller.logout(response);

      expect(authService.clearRefreshTokenCookie).toHaveBeenCalledWith(response);
      expect(result).toEqual({ message: "Logged out successfully" });
    });
  });
});
