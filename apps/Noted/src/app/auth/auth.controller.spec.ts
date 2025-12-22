import { Test, TestingModule } from "@nestjs/testing";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { ConfigService } from "@nestjs/config";
import { LoginDto } from "./dto/login.dto";
import { RegisterRequest } from "./dto/register.dto";
import type { Request, Response } from "express";
import { JwtModule } from "@nestjs/jwt";
import { JwtAuthGuard } from "./guards/jwt.guards";

const mockAuthService = {
  register: jest.fn(),
  login: jest.fn(),
  refresh: jest.fn(),
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

      expect(response.cookie).toHaveBeenCalledWith(
        "refreshToken",
        "refresh-token-456",
        expect.objectContaining({
          httpOnly: true,
          domain: "localhost",
          secure: true,
          sameSite: "lax",
          maxAge: 604800000,
        }),
      );

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

      expect(response.cookie).toHaveBeenCalledWith(
        "refreshToken",
        "refresh-token-456",
        expect.objectContaining({
          httpOnly: true,
          domain: "localhost",
          secure: true,
          sameSite: "lax",
          maxAge: 604800000,
        }),
      );

      expect(result).toEqual({ accessToken: "access-token-123" });
    });
  });

  describe("POST /auth/refresh", () => {
    it("should return new access token using refresh token from cookies", async () => {
      const request = createMockRequest({ refreshToken: "valid-refresh-token" });
      const refreshDtoInstance = { accessToken: "new-access-token" };

      mockAuthService.refresh.mockResolvedValue(refreshDtoInstance);

      const result = await controller.refresh(request);

      expect(authService.refresh).toHaveBeenCalledWith("valid-refresh-token");
      expect(result).toEqual({
        accessToken: {
          accessToken: "new-access-token",
        },
      });
    });
  });

  describe("POST /auth/logout", () => {
    it("should clear refresh token cookie and return success message", async () => {
      const response = createMockResponse();

      const result = await controller.logout(response);

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

  describe("Helper methods", () => {
    it("setRefreshTokenCookie should set cookie with proper attributes", () => {
      const response = createMockResponse();
      const refreshToken = "test-refresh-token";

      (controller as any).setRefreshTokenCookie(response as Response, refreshToken);

      expect(response.cookie).toHaveBeenCalledWith(
        "refreshToken",
        refreshToken,
        expect.objectContaining({
          httpOnly: true,
          domain: "localhost",
          secure: true,
          sameSite: "lax",
          maxAge: expect.any(Number),
        }),
      );
    });

    it("clearRefreshTokenCookie should clear cookie with expired date", () => {
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

    it("should use insecure cookie settings in development environment", async () => {
      const mockConfigService = {
        getOrThrow: jest.fn((key: string) => {
          if (key === "COOKIE_DOMAIN") return "localhost";
          if (key === "NODE_ENV") return "development";
          if (key === "JWT_REFRESH_TTL_SECONDS") return "604800";
          if (key === "JWT_ACCESS_TTL_SECONDS") return "900";
          throw new Error(`Unknown config key: ${key}`);
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
            secret: "dummy-secret",
          }),
        ],
      })
        .overrideGuard(JwtAuthGuard)
        .useValue({ canActivate: () => true })
        .compile();

      const devController = module.get<AuthController>(AuthController);
      const response = createMockResponse();
      const refreshToken = "test-token";

      (devController as any).setRefreshTokenCookie(response as Response, refreshToken);

      expect(response.cookie).toHaveBeenCalledWith(
        "refreshToken",
        refreshToken,
        expect.objectContaining({
          secure: false,
          sameSite: "none",
        }),
      );
    });
  });
});