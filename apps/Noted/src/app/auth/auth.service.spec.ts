// apps/Noted/src/app/auth/auth.service.spec.ts
import { Test, TestingModule } from "@nestjs/testing";
import { AuthService } from "./auth.service";
import { PrismaService } from "../prisma.service";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { ConflictException, NotFoundException, UnauthorizedException } from "@nestjs/common";

// 🔹 СОЗДАЁМ ПОЛНЫЙ МОК ДЛЯ ВСЕХ ЗАВИСИМОСТЕЙ
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

// 🔹 МОК argon2 - ДОЛЖЕН БЫТЬ ПЕРЕД describe!
jest.mock("argon2", () => ({
  hash: jest.fn().mockResolvedValue("hashed-password-123"),
  verify: jest.fn(),
}));

// 🔹 МОК PrismaService
jest.mock("../prisma.service", () => ({
  PrismaService: jest.fn().mockImplementation(() => mockPrismaService),
}));

describe("AuthService", () => {
  let authService: AuthService;
  let prismaService: typeof mockPrismaService;
  let jwtService: typeof mockJwtService;
  let argon2: { verify: jest.Mock };

  beforeEach(async () => {
    // 🔹 СОЗДАЁМ ТЕСТОВЫЙ МОДУЛЬ
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    prismaService = module.get(PrismaService);
    jwtService = module.get(JwtService);

    // 🔹 Получаем мок argon2
    argon2 = require("argon2");

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
        name: "Иван Иванов",
        email: "ivan@test.com",
        password: "hashed-password-123",
      };

      // 🔹 НАСТРАИВАЕМ МОКИ
      prismaService.user.findUnique.mockResolvedValue(null);
      prismaService.user.create.mockResolvedValue(createdUser);

      jwtService.sign.mockReturnValueOnce("access-token-123").mockReturnValueOnce("refresh-token-456");

      // 🔹 ВЫЗЫВАЕМ МЕТОД
      const result = await authService.register(registerDto);

      // 🔹 ПРОВЕРКИ
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: "ivan@test.com" },
      });

      expect(prismaService.user.create).toHaveBeenCalledWith({
        data: {
          name: "Иван Иванов",
          email: "ivan@test.com",
          password: "hashed-password-123",
        },
      });

      expect(result).toEqual({
        accessToken: "access-token-123",
        refreshToken: "refresh-token-456",
        userId: "user-id-123",
      });
    });

    it("должен выбросить ошибку если email уже занят", async () => {
      const registerDto = {
        name: "Иван Иванов",
        email: "existing@test.com",
        password: "password123",
      };

      const existingUser = {
        id: "existing-id",
        email: "existing@test.com",
      };

      prismaService.user.findUnique.mockResolvedValue(existingUser);

      await expect(authService.register(registerDto)).rejects.toThrow(ConflictException);

      await expect(authService.register(registerDto)).rejects.toThrow("Пользователь с таким email уже существует");
    });
  });

  describe("login()", () => {
    it("должен успешно авторизовать пользователя", async () => {
      const loginDto = {
        email: "ivan@test.com",
        password: "password123",
      };

      const existingUser = {
        id: "user-id-123",
        password: "hashed-password-123",
      };

      prismaService.user.findUnique.mockResolvedValue(existingUser);
      argon2.verify.mockResolvedValue(true);

      jwtService.sign.mockReturnValueOnce("access-token-123").mockReturnValueOnce("refresh-token-456");

      const result = await authService.login(loginDto);

      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: "ivan@test.com" },
        select: { id: true, password: true },
      });

      expect(result).toEqual({
        accessToken: "access-token-123",
        refreshToken: "refresh-token-456",
        userId: "user-id-123",
      });
    });

    it("должен выбросить NotFoundException если пользователь не найден", async () => {
      const loginDto = {
        email: "nonexistent@test.com",
        password: "password123",
      };

      prismaService.user.findUnique.mockResolvedValue(null);

      await expect(authService.login(loginDto)).rejects.toThrow(NotFoundException);

      await expect(authService.login(loginDto)).rejects.toThrow("Пользователь не найден");
    });

    it("должен выбросить NotFoundException если пароль неверный", async () => {
      const loginDto = {
        email: "ivan@test.com",
        password: "wrong-password",
      };

      const existingUser = {
        id: "user-id-123",
        password: "hashed-password-123",
      };

      prismaService.user.findUnique.mockResolvedValue(existingUser);
      argon2.verify.mockReset();
      argon2.verify.mockResolvedValue(false);

      await expect(authService.login(loginDto)).rejects.toThrow(NotFoundException);
      await expect(authService.login(loginDto)).rejects.toThrow("Пользователь не найден");

      expect(argon2.verify).toHaveBeenCalledWith("hashed-password-123", "wrong-password");
    });
  });

  describe("refresh()", () => {
    it("должен успешно обновить токены по валидному refresh token", async () => {
      const refreshToken = "valid-refresh-token";
      const mockPayload = { sub: "user-id-123" };

      jwtService.verifyAsync.mockResolvedValue(mockPayload);
      prismaService.user.findUnique.mockResolvedValue({ id: "user-id-123" });

      jwtService.sign.mockReturnValueOnce("new-access-token").mockReturnValueOnce("new-refresh-token");

      const result = await authService.refresh(refreshToken);

      expect(jwtService.verifyAsync).toHaveBeenCalledWith(refreshToken);
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: "user-id-123" },
        select: { id: true },
      });

      expect(result).toEqual({
        accessToken: "new-access-token",
        refreshToken: "new-refresh-token",
        userId: "user-id-123",
      });
    });

    it("должен выбросить UnauthorizedException если refresh token отсутствует", async () => {
      await expect(authService.refresh("")).rejects.toThrow(UnauthorizedException);

      await expect(authService.refresh("")).rejects.toThrow("Токен не найден");
    });

    it("должен выбросить UnauthorizedException если пользователь не найден", async () => {
      const refreshToken = "valid-refresh-token";
      const mockPayload = { sub: "non-existent-user-id" };

      jwtService.verifyAsync.mockResolvedValue(mockPayload);
      prismaService.user.findUnique.mockResolvedValue(null);

      await expect(authService.refresh(refreshToken)).rejects.toThrow(UnauthorizedException);

      await expect(authService.refresh(refreshToken)).rejects.toThrow("Пользователь не найден");
    });

    it("должен выбросить UnauthorizedException если токен невалидный", async () => {
      const refreshToken = "invalid-token";

      // Мокаем что verifyAsync выбрасывает ошибку
      // Сервис должен обернуть ее в UnauthorizedException
      jwtService.verifyAsync.mockRejectedValue(new Error("Invalid token"));

      // Проверяем что выброшена UnauthorizedException
      await expect(authService.refresh(refreshToken)).rejects.toThrow(UnauthorizedException);
    });

    // Упрощенный тест - проверяем только что ошибка оборачивается
    it("должен обрабатывать ошибки верификации токена", async () => {
      const refreshToken = "invalid-token";

      // Мокаем любую ошибку от verifyAsync
      jwtService.verifyAsync.mockRejectedValue(new Error("Любая ошибка"));

      // Должна быть выброшена UnauthorizedException
      await expect(authService.refresh(refreshToken)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe("generateTokens()", () => {
    it("должен генерировать access и refresh токены", () => {
      const userId = "test-user-id";

      jwtService.sign.mockReset();
      jwtService.sign.mockReturnValueOnce("access-token").mockReturnValueOnce("refresh-token");

      const tokens = (authService as any).generateTokens(userId);

      expect(tokens).toEqual({
        accessToken: "access-token",
        refreshToken: "refresh-token",
      });

      expect(jwtService.sign).toHaveBeenCalledTimes(2);
    });
  });
});
