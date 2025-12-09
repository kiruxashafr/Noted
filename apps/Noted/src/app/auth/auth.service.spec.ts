// apps/Noted/src/app/auth/auth.service.spec.ts
import { Test, TestingModule } from "@nestjs/testing";
import { AuthService } from "./auth.service";
import { PrismaService } from "../prisma.service";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { ConflictException, NotFoundException } from "@nestjs/common";

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

// 🔹 МОК bcrypt - ДОЛЖЕН БЫТЬ ПЕРЕД describe!
jest.mock("bcrypt", () => ({
  hash: jest.fn().mockResolvedValue("hashed-password-123"),
  compare: jest.fn().mockResolvedValue(true),
}));

// 🔹 МОК PrismaService - САМОЕ ВАЖНОЕ!
jest.mock("../prisma.service", () => ({
  PrismaService: jest.fn().mockImplementation(() => mockPrismaService),
}));

describe("AuthService", () => {
  let authService: AuthService;
  let prismaService: typeof mockPrismaService;
  let jwtService: typeof mockJwtService;

  beforeEach(async () => {
    // 🔹 СОЗДАЁМ ТЕСТОВЫЙ МОДУЛЬ БЕЗ РЕАЛЬНЫХ ЗАВИСИМОСТЕЙ
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

    jest.clearAllMocks();
  });

  describe("register()", () => {
    it("должен создать нового пользователя", async () => {
      const registerDto = {
        name: "Иван Иванов",
        email: "ivan@test.com",
        password: "password123",
      };

      const mockResponse = {
        cookie: jest.fn(),
      };

      const createdUser = {
        id: "user-id-123",
        name: "Иван Иванов",
        email: "ivan@test.com",
        password: "hashed-password-123",
      };

      // 🔹 НАСТРАИВАЕМ МОКИ
      // 1. Email свободен
      prismaService.user.findUnique.mockResolvedValue(null);

      // 2. Возвращаем созданного пользователя
      prismaService.user.create.mockResolvedValue(createdUser);

      // 3. JWT возвращает токены
      jwtService.sign.mockReturnValueOnce("access-token-123").mockReturnValueOnce("refresh-token-456");

      // 🔹 ВЫЗЫВАЕМ МЕТОД
      const result = await authService.register(mockResponse as any, registerDto);

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

      expect(mockResponse.cookie).toHaveBeenCalled();
      expect(result).toHaveProperty("accessToken");
    });

    // 🔹 ТЕСТ 2: ОШИБКА ПРИ СУЩЕСТВУЮЩЕМ EMAIL
    it("должен выбросить ошибку если email уже занят", async () => {
      const registerDto = {
        name: "Иван Иванов",
        email: "existing@test.com",
        password: "password123",
      };

      const mockResponse = {
        cookie: jest.fn(),
      };

      const existingUser = {
        id: "existing-id",
        email: "existing@test.com",
      };

      // 🔹 НАСТРАИВАЕМ: пользователь уже существует
      prismaService.user.findUnique.mockResolvedValue(existingUser);

      // 🔹 ВЫЗЫВАЕМ И ОЖИДАЕМ ОШИБКУ
      await expect(authService.register(mockResponse as any, registerDto)).rejects.toThrow(ConflictException);

      await expect(authService.register(mockResponse as any, registerDto)).rejects.toThrow(
        "Пользователь с таким email уже существует",
      );
    });
  });

  // 🔹 ТЕСТ 3: ЛОГИН
  describe("login()", () => {
    it("должен успешно авторизовать пользователя", async () => {
      const loginDto = {
        email: "ivan@test.com",
        password: "password123",
      };

      const mockResponse = {
        cookie: jest.fn(),
      };

      const existingUser = {
        id: "user-id-123",
        password: "hashed-password-123",
      };

      // 🔹 НАСТРАИВАЕМ
      prismaService.user.findUnique.mockResolvedValue(existingUser);
      // bcrypt.compare уже замокан наверху

      // 🔹 ВЫЗЫВАЕМ
      const result = await authService.login(mockResponse as any, loginDto);

      // 🔹 ПРОВЕРЯЕМ
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: "ivan@test.com" },
        select: { id: true, password: true },
      });

      expect(result).toHaveProperty("accessToken");
    });
  });
});
