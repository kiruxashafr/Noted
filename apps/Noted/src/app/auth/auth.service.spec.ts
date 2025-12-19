import { HttpStatus } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { AuthService } from "./auth.service";
import { PrismaService } from "../prisma.service";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import * as argon2 from "argon2";

// 🔹 Мокаем DTO прямо внутри jest.mock — без внешних переменных!
// Это полностью обходит проблему hoisting в Jest
jest.mock("./dto/read-auth.dto", () => ({
  ReadAuthDto: function () {
    this.accessToken = "";
    this.refreshToken = "";
    this.userId = "";
  } as any,
}));

jest.mock("./dto/read-refresh.dto", () => ({
  ReadRefreshDto: function () {
    this.accessToken = "";
  } as any,
}));

// 🔹 Теперь можно безопасно импортировать (после моков)
import { ReadAuthDto } from "./dto/read-auth.dto";
import { ReadRefreshDto } from "./dto/read-refresh.dto";

// 🔹 Моки зависимостей
const mockPrismaService = {
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
  },
};

const mockJwtService = {
  signAsync: jest.fn(),
  verifyAsync: jest.fn(),
};

const mockConfigService = {
  getOrThrow: jest.fn((key: string) => {
    const config: Record<string, any> = {
      JWT_ACCESS_SECRET: "test-access-secret",
      JWT_REFRESH_SECRET: "test-refresh-secret",
      JWT_ACCESS_TTL_SECONDS: "900",
      JWT_REFRESH_TTL_SECONDS: "604800",
      COOKIE_DOMAIN: "localhost",
    };

    if (!(key in config)) {
      throw new Error(`Config key ${key} not found`);
    }

    return config[key];
  }),
};

jest.mock("argon2", () => ({
  hash: jest.fn().mockResolvedValue("hashed-password-123"),
  verify: jest.fn(),
}));

jest.mock("class-transformer", () => ({
  plainToInstance: jest.fn((dtoClass: any, data: any) => {
    const instance = Object.create(dtoClass.prototype);
    Object.assign(instance, data);
    return instance;
  }),
  Expose: jest.fn(() => () => {}), // ← добавляем мок декоратора
  Transform: jest.fn(() => () => {}), // на всякий случай, если где-то используется
  Type: jest.fn(() => () => {}),
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

      const createdUser = { id: "user-id-123" };

      mockPrismaService.user.create.mockResolvedValue(createdUser);
      mockJwtService.signAsync.mockResolvedValueOnce("access-token-123").mockResolvedValueOnce("refresh-token-456");

      const result = await authService.register(registerDto);

      expect(mockPrismaService.user.create).toHaveBeenCalledWith({
        data: {
          name: "Иван Иванов",
          email: "ivan@test.com",
          password: "hashed-password-123",
        },
      });

      expect(result).toBeInstanceOf(ReadAuthDto);
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
        status: HttpStatus.CONFLICT,
      });
    });
  });

  describe("login()", () => {
    it("должен успешно авторизовать пользователя", async () => {
      const loginDto = { email: "ivan@test.com", password: "password123" };
      const user = { id: "user-id-123", password: "hashed-password-123" };

      mockPrismaService.user.findUnique.mockResolvedValue(user);
      (argon2.verify as jest.Mock).mockResolvedValue(true);
      mockJwtService.signAsync.mockResolvedValueOnce("access-token-123").mockResolvedValueOnce("refresh-token-456");

      const result = await authService.login(loginDto);

      expect(result).toBeInstanceOf(ReadAuthDto);
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
        status: HttpStatus.UNAUTHORIZED,
      });
    });

    it("должен выбросить ошибку при неверном пароле", async () => {
      const loginDto = { email: "ivan@test.com", password: "wrong" };
      const user = { id: "user-id-123", password: "hashed-password-123" };

      mockPrismaService.user.findUnique.mockResolvedValue(user);
      (argon2.verify as jest.Mock).mockResolvedValue(false);

      await expect(authService.login(loginDto)).rejects.toMatchObject({
        errorCode: "INVALID_CREDENTIALS",
        status: HttpStatus.UNAUTHORIZED,
      });
    });
  });

  describe("refresh()", () => {
    it("должен успешно вернуть новый access token по валидному refresh token", async () => {
      const refreshToken = "valid-refresh-token";
      const payload = { sub: "user-id-123" };

      mockJwtService.verifyAsync.mockResolvedValue(payload);
      mockPrismaService.user.findUnique.mockResolvedValue({ id: "user-id-123" });
      mockJwtService.signAsync.mockResolvedValue("new-access-token");

      const result = await authService.refresh(refreshToken);

      expect(result).toBeInstanceOf(ReadRefreshDto);
      expect(result).toEqual({ accessToken: "new-access-token" });
    });

    it("должен выбросить ошибку если пользователь не найден", async () => {
      const refreshToken = "valid-token";
      mockJwtService.verifyAsync.mockResolvedValue({ sub: "unknown-id" });
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(authService.refresh(refreshToken)).rejects.toMatchObject({
        errorCode: "USER_NOT_FOUND",
        status: HttpStatus.UNAUTHORIZED,
      });
    });

    it("должен выбросить ошибку при невалидном refresh token", async () => {
      const refreshToken = "invalid-token";
      mockJwtService.verifyAsync.mockRejectedValue(new Error("Invalid signature"));

      await expect(authService.refresh(refreshToken)).rejects.toMatchObject({
        errorCode: "INVALID_REFRESH_TOKEN",
        status: HttpStatus.UNAUTHORIZED,
      });
    });
  });

  describe("generateAccessToken()", () => {
    it("должен генерировать access token асинхронно", async () => {
      const userId = "test-user-id";
      mockJwtService.signAsync.mockResolvedValue("generated-access-token");

      const result = await authService.generateAccessToken(userId);

      expect(result).toBe("generated-access-token");
    });
  });

  describe("generateRefreshToken()", () => {
    it("должен генерировать refresh token асинхронно", async () => {
      const userId = "test-user-id";
      mockJwtService.signAsync.mockResolvedValue("generated-refresh-token");

      const result = await authService.generateRefreshToken(userId);

      expect(result).toBe("generated-refresh-token");
    });
  });
});
