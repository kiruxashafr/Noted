import { HttpStatus, Logger } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { AuthService } from "./auth.service";
import { PrismaService } from "../prisma/prisma.service";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import * as argon2 from "argon2";

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

import { ReadAuthDto } from "./dto/read-auth.dto";
import { ReadRefreshDto } from "./dto/read-refresh.dto";
import {
  EmailAlreadyExistsException,
  InvalidCredentialsException,
  InvalidRefreshTokenException,
  RefreshFailedException,
  UserNotFoundException,
} from "@noted/common/errors/domain_exception/domain-exception";
import { Prisma } from "generated/prisma/client";

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

const mockLogger = {
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
  verbose: jest.fn(),
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
  Expose: jest.fn(() => () => {}),
  Transform: jest.fn(() => () => {}),
  Type: jest.fn(() => () => {}),
}));

describe("AuthService", () => {
  let authService: AuthService;

  beforeEach(async () => {
    jest.spyOn(Logger.prototype, "log").mockImplementation(() => {});
    jest.spyOn(Logger.prototype, "error").mockImplementation(() => {});
    jest.spyOn(Logger.prototype, "warn").mockImplementation(() => {});
    jest.spyOn(Logger.prototype, "debug").mockImplementation(() => {});
    jest.spyOn(Logger.prototype, "verbose").mockImplementation(() => {});
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: Logger.name, useValue: mockLogger },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
  });

  describe("register()", () => {
    it("should create new user and return tokens", async () => {
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

    it("should throw error when email already exists", async () => {
      const registerDto = {
        name: "Иван Иванов",
        email: "ivan@test.com",
        password: "password123",
      };

      // Создаем настоящий экземпляр PrismaClientKnownRequestError
      const prismaError = new Prisma.PrismaClientKnownRequestError(
        "Unique constraint failed on the fields: (`email`)",
        {
          code: "P2002",
          clientVersion: "5.0.0",
          meta: { target: ["email"], modelName: "User" },
        },
      );

      mockPrismaService.user.create.mockRejectedValue(prismaError);

      await expect(authService.register(registerDto)).rejects.toThrow(EmailAlreadyExistsException);
    });
  });

  describe("login()", () => {
    it("should authenticate user with valid credentials", async () => {
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

    it("should throw error when user not found", async () => {
      const loginDto = { email: "unknown@test.com", password: "pass" };

      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(authService.login(loginDto)).rejects.toThrow(InvalidCredentialsException);
    });

    it("should throw error when password is incorrect", async () => {
      const loginDto = { email: "ivan@test.com", password: "wrong" };
      const user = { id: "user-id-123", password: "hashed-password-123" };

      mockPrismaService.user.findUnique.mockResolvedValue(user);
      (argon2.verify as jest.Mock).mockResolvedValue(false);

      await expect(authService.login(loginDto)).rejects.toThrow(InvalidCredentialsException);
    });
  });

  describe("refresh()", () => {
    it("should return new access token for valid refresh token", async () => {
      const refreshToken = "valid-refresh-token";
      const payload = { sub: "user-id-123" };

      mockJwtService.verifyAsync.mockResolvedValue(payload);
      mockPrismaService.user.findUnique.mockResolvedValue({ id: "user-id-123" });
      mockJwtService.signAsync.mockResolvedValue("new-access-token");

      const result = await authService.refresh(refreshToken);

      expect(result).toBeInstanceOf(ReadRefreshDto);
      expect(result).toEqual({ accessToken: "new-access-token" });
    });

    it("should throw error when user not found during refresh", async () => {
      const refreshToken = "valid-token";
      mockJwtService.verifyAsync.mockResolvedValue({ sub: "unknown-id" });
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(authService.refresh(refreshToken)).rejects.toThrow(UserNotFoundException);
    });

    it("should throw error for invalid refresh token", async () => {
      const refreshToken = "invalid-token";
      mockJwtService.verifyAsync.mockRejectedValue(new Error("Invalid signature"));

      await expect(authService.refresh(refreshToken)).rejects.toThrow(RefreshFailedException);
    });
  });

  describe("generateAccessToken()", () => {
    it("should generate access token asynchronously", async () => {
      const userId = "test-user-id";
      mockJwtService.signAsync.mockResolvedValue("generated-access-token");

      const result = await authService.generateAccessToken(userId);

      expect(result).toBe("generated-access-token");
    });
  });

  describe("generateRefreshToken()", () => {
    it("should generate refresh token asynchronously", async () => {
      const userId = "test-user-id";
      mockJwtService.signAsync.mockResolvedValue("generated-refresh-token");

      const result = await authService.generateRefreshToken(userId);

      expect(result).toBe("generated-refresh-token");
    });
  });
});
