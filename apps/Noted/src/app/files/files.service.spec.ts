import { FileAccess } from "generated/prisma/enums";
import { FilesService } from "./files.service";
import { Test, TestingModule } from "@nestjs/testing";
import { PrismaService } from "../prisma/prisma.service";
import { ConfigService } from "@nestjs/config";
import { ApiException } from "@noted/common/errors/api-exception";
import { HttpStatus } from "@nestjs/common";
import { ErrorCodes } from "@noted/common/errors/error-codes.const";

const mockS3Send = jest.fn();
const mockUploadDone = jest.fn();

jest.mock("@aws-sdk/client-s3", () => {
  return {
    S3Client: jest.fn().mockImplementation(() => ({
      send: mockS3Send,
    })),
    CreateBucketCommand: jest.fn(),
    HeadBucketCommand: jest.fn(),
    PutBucketPolicyCommand: jest.fn(),
    GetObjectCommand: jest.fn(),
    DeleteObjectCommand: jest.fn(),
  };
});

jest.mock("@aws-sdk/lib-storage", () => {
  return {
    Upload: jest.fn().mockImplementation(() => ({
      done: mockUploadDone,
    })),
  };
});
describe("FilesService", () => {
  let fileService: FilesService;

  const mockUserId = "user-123";
  const mockAccess = FileAccess.PRIVATE;
  const mockFileId = "file-123";
  const mockFileKey = "user-123/uuid-123";

  const mockDbFile = {
    id: mockFileId,
    bucket: "test-bucket",
    key: mockFileKey,
    mimeType: "text/plain",
    originalName: "test.txt",
    size: 1024,
    ownerId: mockUserId,
    access: mockAccess,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
    },
    mediaFile: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
      aggregate: jest.fn(),
    },
  };

  const mockConfigService = {
    getOrThrow: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    mockConfigService.getOrThrow
      .mockReturnValueOnce("test-bucket")
      .mockReturnValueOnce("http://localhost")
      .mockReturnValueOnce("100")
      .mockReturnValueOnce("http://localhost")
      .mockReturnValueOnce("us-east-1")
      .mockReturnValueOnce("test-key")
      .mockReturnValueOnce("test-secret");

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FilesService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    fileService = module.get<FilesService>(FilesService);
  });

  describe("deleteFile", () => {
    it("should call prisma service, s3 command and delete file successfully", async () => {
      mockPrismaService.mediaFile.findUnique.mockResolvedValue(mockDbFile);
      mockS3Send.mockResolvedValue({});
      mockPrismaService.mediaFile.delete.mockResolvedValue(mockDbFile);

      await fileService.deleteFile(mockFileId, mockUserId);

      expect(mockPrismaService.mediaFile.findUnique).toHaveBeenCalledWith({
        where: { id: mockFileId },
      });

      expect(mockS3Send).toHaveBeenCalledTimes(1);

      expect(mockPrismaService.mediaFile.delete).toHaveBeenCalledWith({
        where: { id: mockFileId },
      });
    });

    it("should throw error if file not found", async () => {
      mockPrismaService.mediaFile.findUnique.mockResolvedValue(null);
      mockS3Send.mockResolvedValue({});
      mockPrismaService.mediaFile.delete.mockResolvedValue(mockDbFile);

      await expect(fileService.deleteFile(mockFileId, mockUserId)).rejects.toThrow(ApiException);

      await expect(fileService.deleteFile(mockFileId, mockUserId)).rejects.toMatchObject({
        errorCode: ErrorCodes.FILE_NOT_FOUND,
        status: HttpStatus.NOT_FOUND,
      });
    });

    it("should throw error if user is not correct", async () => {
      const notCorrectUserId = "notCorrect";
      mockPrismaService.mediaFile.findUnique.mockResolvedValue(mockDbFile);
      mockS3Send.mockResolvedValue({});
      mockPrismaService.mediaFile.delete.mockResolvedValue(mockDbFile);

      await expect(fileService.deleteFile(mockFileId, notCorrectUserId)).rejects.toThrow(ApiException);

      await expect(fileService.deleteFile(mockFileId, notCorrectUserId)).rejects.toMatchObject({
        errorCode: ErrorCodes.FILE_ACCESS_DENIED,
        status: HttpStatus.FORBIDDEN,
      });
    });
  });

  describe("checkAccess", () => {
    it("should return if access public", async () => {
      const mockPublicFile = {
        ...mockDbFile,
        access: FileAccess.PUBLIC,
      };
      expect(() => {
        (fileService as any).checkAccess(mockPublicFile, mockUserId);
      }).not.toThrow();
    });

    it("should  return if access private and userId correct", async () => {
      expect(() => {
        (fileService as any).checkAccess(mockDbFile, mockUserId).not.toThrow();
      });
    });

    it("should throw error if serId is not owner", async () => {
      const mockNotCorrectUserId = "notCorrect";
      expect(() => {
        (fileService as any).checkAccess(mockDbFile, mockUserId).toThrow(ApiException);
      });
    });
  });
});
