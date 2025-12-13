// apps/Noted/src/app/auth/auth.service.spec.ts
import { Test, TestingModule } from "@nestjs/testing";
import { AuthService } from "./auth.service";
import { PrismaService } from "../prisma.service";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { HttpStatus } from "@nestjs/common";

// 🔹 МОКИ ЗАВИСИМОСТЕЙ
const mockPrismaService = {
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
  },
};

const mockJwtService = {
  sign: jest.fn(() => "fake-jwt-token"),
  verifyAsync: jest.fn(),
};

const mockConfigService = {
  getOrThrow: jest.fn((key: string) => {
    const config: Record<string, string> = {
      JWT_SECRET: "test-secret-123",
      JWT_ACCESS_TOKEN_TTL: "15m",
      JWT_REFRESH_TOKEN_TTL: "7d",
      COOKIE_DOMAIN: "localhost",
    };
    return config[key];
  }),
};

// 🔹 Мок argon2
jest.mock("argon2", () => ({
  hash: jest.fn().mockResolvedValue("hashed-password-123"),
  verify: jest.fn(),
}));

describe("AuthService", () => {
  let authService: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);

    jest.clearAllMocks();
  });

  describe("register()", () => {
    it("должен создать нового пользователя и вернуть токены", async () => {
      const registerDto = {
        name: "Иван Иванов",
        email: "ivan@test.com",
        password: "password123",
      };

      const createdUser = {
        id: "user-id-123",
      };

      mockPrismaService.user.create.mockResolvedValue(createdUser);
      mockJwtService.sign.mockReturnValueOnce("access-token-123").mockReturnValueOnce("refresh-token-456");

      const result = await authService.register(registerDto);

      expect(mockPrismaService.user.create).toHaveBeenCalledWith({
        data: {
          name: "Иван Иванов",
          email: "ivan@test.com",
          password: "hashed-password-123",
        },
      });

      // findUnique НЕ вызывается — это особенность текущей реализации
      expect(mockPrismaService.user.findUnique).not.toHaveBeenCalled();

      expect(result).toEqual({
        accessToken: "access-token-123",
        refreshToken: "refresh-token-456",
        userId: "user-id-123",
      });
    });

    it("должен выбросить ошибку при нарушении уникальности email", async () => {
      const registerDto = {
        name: "Иван Иванов",
        email: "ivan@test.com",
        password: "password123",
      };

      const prismaError = {
        code: "P2002",
        meta: { target: ["email"], modelName: "User" },
      };

      mockPrismaService.user.create.mockRejectedValue(prismaError);

      await expect(authService.register(registerDto)).rejects.toMatchObject({
        errorCode: "EMAIL_ALREADY_EXISTS",
        status: HttpStatus.CONFLICT, // Изменено с statusCode на status
      });
    });
  });

  describe("login()", () => {
    it("должен успешно авторизовать пользователя", async () => {
      const loginDto = { email: "ivan@test.com", password: "password123" };

      const user = { id: "user-id-123", password: "hashed-password-123" };

      mockPrismaService.user.findUnique.mockResolvedValue(user);
      require("argon2").verify.mockResolvedValue(true);
      mockJwtService.sign.mockReturnValueOnce("access-token-123").mockReturnValueOnce("refresh-token-456");

      const result = await authService.login(loginDto);

      expect(result).toEqual({
        accessToken: "access-token-123",
        refreshToken: "refresh-token-456",
        userId: "user-id-123",
      });
    });

    it("должен выбросить ошибку при неверных учётных данных (пользователь не найден)", async () => {
      const loginDto = { email: "unknown@test.com", password: "pass" };

      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(authService.login(loginDto)).rejects.toMatchObject({
        errorCode: "INVALID_CREDENTIALS",
        status: HttpStatus.UNAUTHORIZED, // Изменено с statusCode на status
      });
    });

    it("должен выбросить ошибку при неверном пароле", async () => {
      const loginDto = { email: "ivan@test.com", password: "wrong" };

      const user = { id: "user-id-123", password: "hashed-password-123" };

      mockPrismaService.user.findUnique.mockResolvedValue(user);
      require("argon2").verify.mockResolvedValue(false);

      await expect(authService.login(loginDto)).rejects.toMatchObject({
        errorCode: "INVALID_CREDENTIALS",
        status: HttpStatus.UNAUTHORIZED, // Изменено с statusCode на status
      });
    });
  });

  describe("refresh()", () => {
    it("должен успешно обновить токены по валидному refresh token", async () => {
      const refreshToken = "valid-refresh-token";
      const payload = { sub: "user-id-123" };

      mockJwtService.verifyAsync.mockResolvedValue(payload);
      mockPrismaService.user.findUnique.mockResolvedValue({ id: "user-id-123" });
      mockJwtService.sign.mockReturnValueOnce("new-access").mockReturnValueOnce("new-refresh");

      const result = await authService.refresh(refreshToken);

      expect(result).toEqual({
        accessToken: "new-access",
        refreshToken: "new-refresh",
        userId: "user-id-123",
      });
    });

    it("должен выбросить ошибку если refresh token отсутствует", async () => {
      await expect(authService.refresh("")).rejects.toMatchObject({
        errorCode: "REFRESH_TOKEN_MISSING",
        status: HttpStatus.UNAUTHORIZED, // Изменено с statusCode на status
      });
    });

    it("должен выбросить ошибку если пользователь не найден", async () => {
      const refreshToken = "valid-token";
      mockJwtService.verifyAsync.mockResolvedValue({ sub: "unknown-id" });
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(authService.refresh(refreshToken)).rejects.toMatchObject({
        errorCode: "USER_NOT_FOUND",
        status: HttpStatus.UNAUTHORIZED, // Изменено с statusCode на status
      });
    });

    it("должен выбросить ошибку при невалидном refresh token", async () => {
      const refreshToken = "invalid-token";
      mockJwtService.verifyAsync.mockRejectedValue(new Error("Invalid signature"));

      await expect(authService.refresh(refreshToken)).rejects.toMatchObject({
        errorCode: "INVALID_REFRESH_TOKEN",
        status: HttpStatus.UNAUTHORIZED, // Изменено с statusCode на status
      });
    });
  });

  describe("generateTokens()", () => {
    it("должен генерировать access и refresh токены", () => {
      const userId = "test-user-id";

      mockJwtService.sign.mockReturnValueOnce("access-token").mockReturnValueOnce("refresh-token");

      const tokens = (authService as any).generateTokens(userId);

      expect(tokens).toEqual({
        accessToken: "access-token",
        refreshToken: "refresh-token",
      });

      expect(mockJwtService.sign).toHaveBeenCalledTimes(2);
      expect(mockJwtService.sign).toHaveBeenCalledWith({ sub: userId }, { expiresIn: "15m" });
      expect(mockJwtService.sign).toHaveBeenCalledWith({ sub: userId }, { expiresIn: "7d" });
    });
  });
});
