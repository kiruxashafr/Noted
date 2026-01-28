import { FileAccess } from "generated/prisma/enums";
import { FilesService } from "./files.service";
import { Test, TestingModule } from "@nestjs/testing";
import { PrismaService } from "../prisma/prisma.service";
import { ConfigService } from "@nestjs/config";
import { ApiException } from "@noted/common/errors/api-exception";
import { HttpStatus } from "@nestjs/common";
import { ErrorCodes } from "@noted/common/errors/error-codes.const";
import { Readable } from "stream";

// Создаем моки для команд
const mockHeadBucketCommand = jest.fn();
const mockCreateBucketCommand = jest.fn();
const mockPutBucketPolicyCommand = jest.fn();
const mockGetObjectCommand = jest.fn();
const mockDeleteObjectCommand = jest.fn();
const mockDeleteObjectsCommand = jest.fn();

const mockS3Send = jest.fn();
const mockUploadDone = jest.fn();

jest.mock("@aws-sdk/client-s3", () => {
  return {
    S3Client: jest.fn().mockImplementation(() => ({
      send: mockS3Send,
    })),
    CreateBucketCommand: jest.fn().mockImplementation(input => {
      mockCreateBucketCommand(input);
      return { input };
    }),
    HeadBucketCommand: jest.fn().mockImplementation(input => {
      mockHeadBucketCommand(input);
      return { input };
    }),
    PutBucketPolicyCommand: jest.fn().mockImplementation(input => {
      mockPutBucketPolicyCommand(input);
      return { input };
    }),
    GetObjectCommand: jest.fn().mockImplementation(input => {
      mockGetObjectCommand(input);
      return { input };
    }),
    DeleteObjectCommand: jest.fn().mockImplementation(input => {
      mockDeleteObjectCommand(input);
      return { input };
    }),
    DeleteObjectsCommand: jest.fn().mockImplementation(input => {
      mockDeleteObjectsCommand(input);
      return { input };
    }),
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

  describe("uploadFile", () => {
    const mockFile = {
      buffer: Buffer.from("test content"),
      originalName: "test.txt",
      mimeType: "text/plain",
      size: 1024,
    };

    it("should upload file successfully", async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: mockUserId,
        plan: "FREE",
      });
      mockPrismaService.mediaFile.aggregate.mockResolvedValue({
        _sum: { size: 0 },
      });
      mockUploadDone.mockResolvedValue({});
      mockPrismaService.mediaFile.create.mockResolvedValue(mockDbFile);

      const result = await fileService.uploadFile(mockUserId, mockAccess, mockFile);

      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: mockUserId },
      });
      expect(mockPrismaService.mediaFile.aggregate).toHaveBeenCalled();
      expect(mockUploadDone).toHaveBeenCalled();
      expect(mockPrismaService.mediaFile.create).toHaveBeenCalled();
      expect(result.url).toBeDefined();
    });

    it("should throw error when quota is exceeded", async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: mockUserId,
        plan: "FREE",
      });
      mockPrismaService.mediaFile.aggregate.mockResolvedValue({
        _sum: { size: 100 * 1024 * 1024 },
      });

      await expect(fileService.uploadFile(mockUserId, mockAccess, mockFile)).rejects.toThrow(ApiException);
      await expect(fileService.uploadFile(mockUserId, mockAccess, mockFile)).rejects.toMatchObject({
        errorCode: ErrorCodes.PAILOAD_TOO_LARGE,
        status: HttpStatus.PAYLOAD_TOO_LARGE,
      });
    });

    it("should clean up S3 file when database save fails", async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: mockUserId,
        plan: "FREE",
      });
      mockPrismaService.mediaFile.aggregate.mockResolvedValue({
        _sum: { size: 0 },
      });
      mockUploadDone.mockResolvedValue({});
      mockPrismaService.mediaFile.create.mockRejectedValue(new Error("DB error"));

      await expect(fileService.uploadFile(mockUserId, mockAccess, mockFile)).rejects.toThrow(ApiException);
      expect(mockS3Send).toHaveBeenCalledWith(
        expect.objectContaining({
          input: expect.objectContaining({
            Bucket: "test-bucket",
            Key: expect.stringContaining(`${mockUserId}/`),
          }),
        }),
      );
    });
  });

  describe("findOne", () => {
    it("should return file with public URL", async () => {
      mockPrismaService.mediaFile.findUnique.mockResolvedValue(mockDbFile);

      const result = await fileService.findOne(mockFileId, mockUserId);

      expect(mockPrismaService.mediaFile.findUnique).toHaveBeenCalledWith({
        where: { id: mockFileId },
      });
      expect(result.url).toBe(`/api/media/${mockFileId}/download`);
    });

    it("should return file with public URL when access is PUBLIC", async () => {
      const publicFile = { ...mockDbFile, access: FileAccess.PUBLIC };
      mockPrismaService.mediaFile.findUnique.mockResolvedValue(publicFile);

      const result = await fileService.findOne(mockFileId, "different-user");

      expect(result.url).toBe(`http://localhost/test-bucket/${mockFileKey}`);
    });

    it("should throw error if file not found", async () => {
      mockPrismaService.mediaFile.findUnique.mockResolvedValue(null);

      await expect(fileService.findOne(mockFileId, mockUserId)).rejects.toThrow(ApiException);
      await expect(fileService.findOne(mockFileId, mockUserId)).rejects.toMatchObject({
        errorCode: ErrorCodes.FILE_NOT_FOUND,
        status: HttpStatus.NOT_FOUND,
      });
    });

    it("should throw error if user has no access to private file", async () => {
      mockPrismaService.mediaFile.findUnique.mockResolvedValue(mockDbFile);

      await expect(fileService.findOne(mockFileId, "different-user")).rejects.toThrow(ApiException);
      await expect(fileService.findOne(mockFileId, "different-user")).rejects.toMatchObject({
        errorCode: ErrorCodes.FILE_ACCESS_DENIED,
        status: HttpStatus.FORBIDDEN,
      });
    });
  });

  describe("getFileStream", () => {
    const mockStream = {
      pipe: jest.fn(),
    };

    it("should return file stream", async () => {
      mockPrismaService.mediaFile.findUnique.mockResolvedValue(mockDbFile);
      mockS3Send.mockResolvedValue({ Body: mockStream });

      const result = await fileService.getFileStream(mockFileId, mockUserId);

      expect(mockPrismaService.mediaFile.findUnique).toHaveBeenCalledWith({
        where: { id: mockFileId },
      });
      expect(mockS3Send).toHaveBeenCalledWith(
        expect.objectContaining({
          input: expect.objectContaining({
            Bucket: mockDbFile.bucket,
            Key: mockDbFile.key,
          }),
        }),
      );
      expect(result.stream).toBe(mockStream);
      expect(result.mimeType).toBe(mockDbFile.mimeType);
      expect(result.fileName).toBe(mockDbFile.originalName);
    });

    it("should throw error if S3 fails", async () => {
      mockPrismaService.mediaFile.findUnique.mockResolvedValue(mockDbFile);
      mockS3Send.mockRejectedValue(new Error("S3 error"));

      await expect(fileService.getFileStream(mockFileId, mockUserId)).rejects.toThrow(ApiException);
      await expect(fileService.getFileStream(mockFileId, mockUserId)).rejects.toMatchObject({
        errorCode: ErrorCodes.FILE_RETRIEVAL_FAILED,
        status: HttpStatus.BAD_REQUEST,
      });
    });
  });

  describe("getFileBuffer", () => {
    const mockBuffer = Buffer.from("test content");

    it("should return file buffer", async () => {
      const mockReadable = {
        [Symbol.asyncIterator]: async function* () {
          yield mockBuffer;
        },
      };

      mockPrismaService.mediaFile.findUnique.mockResolvedValue(mockDbFile);
      mockS3Send.mockResolvedValue({ Body: mockReadable });

      const result = await fileService.getFileBuffer(mockFileId, mockUserId);

      expect(result).toBeInstanceOf(Buffer);
      expect(result.toString()).toBe(mockBuffer.toString());
    });

    it("should throw error if file is too large", async () => {
      const largeFile = { ...mockDbFile, size: 21 * 1024 * 1024 };
      mockPrismaService.mediaFile.findUnique.mockResolvedValue(largeFile);

      await expect(fileService.getFileBuffer(mockFileId, mockUserId)).rejects.toThrow(ApiException);
      await expect(fileService.getFileBuffer(mockFileId, mockUserId)).rejects.toMatchObject({
        errorCode: ErrorCodes.FILE_TOO_LARGE,
        status: HttpStatus.PAYLOAD_TOO_LARGE,
      });
    });
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

    it("should throw error if S3 deletion fails", async () => {
      mockPrismaService.mediaFile.findUnique.mockResolvedValue(mockDbFile);
      mockS3Send.mockRejectedValue(new Error("S3 error"));

      await expect(fileService.deleteFile(mockFileId, mockUserId)).rejects.toThrow(ApiException);
      await expect(fileService.deleteFile(mockFileId, mockUserId)).rejects.toMatchObject({
        errorCode: ErrorCodes.FILE_DELETE_FAILED,
        status: HttpStatus.BAD_REQUEST,
      });
    });
  });

  describe("deleteAllUserFiles", () => {
    it("should delete all user files successfully", async () => {
      const userFiles = [{ key: "user-123/file1.txt" }, { key: "user-123/file2.txt" }];

      mockPrismaService.mediaFile.findMany.mockResolvedValue(userFiles);
      mockS3Send.mockResolvedValue({ Deleted: [{ Key: "user-123/file1.txt" }, { Key: "user-123/file2.txt" }] });
      mockPrismaService.mediaFile.deleteMany.mockResolvedValue({ count: 2 });

      const result = await fileService.deleteAllUserFiles(mockUserId);

      expect(mockPrismaService.mediaFile.findMany).toHaveBeenCalledWith({
        where: { ownerId: mockUserId },
        select: { key: true },
      });
      expect(mockS3Send).toHaveBeenCalledWith(
        expect.objectContaining({
          input: expect.objectContaining({
            Bucket: "test-bucket",
            Delete: expect.objectContaining({
              Objects: expect.arrayContaining([{ Key: "user-123/file1.txt" }, { Key: "user-123/file2.txt" }]),
            }),
          }),
        }),
      );
      expect(mockPrismaService.mediaFile.deleteMany).toHaveBeenCalledWith({
        where: { ownerId: mockUserId },
      });
      expect(result.deletedCount).toBe(2);
    });

    it("should handle empty file list", async () => {
      mockPrismaService.mediaFile.findMany.mockResolvedValue([]);

      const result = await fileService.deleteAllUserFiles(mockUserId);

      expect(mockS3Send).not.toHaveBeenCalled();
      expect(mockPrismaService.mediaFile.deleteMany).not.toHaveBeenCalled();
      expect(result.deletedCount).toBe(0);
    });

    it("should handle S3 errors gracefully", async () => {
      const userFiles = [{ key: "user-123/file1.txt" }];

      mockPrismaService.mediaFile.findMany.mockResolvedValue(userFiles);
      mockS3Send.mockRejectedValue(new Error("S3 error"));

      await expect(fileService.deleteAllUserFiles(mockUserId)).rejects.toThrow();
    });
  });

  describe("getUsage", () => {
    it("should return storage usage", async () => {
      const mockUser = { id: mockUserId, plan: "FREE" };
      const mockAggregate = { _sum: { size: 1024 * 1024 } };

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.mediaFile.aggregate.mockResolvedValue(mockAggregate);

      const result = await fileService.getUsage(mockUserId);

      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: mockUserId },
      });
      expect(mockPrismaService.mediaFile.aggregate).toHaveBeenCalledWith({
        where: { ownerId: mockUserId },
        _sum: { size: true },
      });
      expect(result.usedBytes).toBe(1024 * 1024);
      expect(result.limitBytes).toBeDefined();
      expect(result.percentage).toBeDefined();
    });

    it("should handle zero usage", async () => {
      const mockUser = { id: mockUserId, plan: "FREE" };
      const mockAggregate = { _sum: { size: null } };

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.mediaFile.aggregate.mockResolvedValue(mockAggregate);

      const result = await fileService.getUsage(mockUserId);

      expect(result.usedBytes).toBe(0);
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

    it("should return if access private and userId correct", () => {
      expect(() => {
        (fileService as any).checkAccess(mockDbFile, mockUserId);
      }).not.toThrow();
    });

    it("should throw error if userId is not owner", () => {
      const mockNotCorrectUserId = "notCorrect";

      expect(() => {
        (fileService as any).checkAccess(mockDbFile, mockNotCorrectUserId);
      }).toThrow(ApiException);

      expect(() => {
        (fileService as any).checkAccess(mockDbFile, mockNotCorrectUserId);
      }).toThrow(new ApiException(ErrorCodes.FILE_ACCESS_DENIED, HttpStatus.FORBIDDEN));
    });
  });

  describe("generatePublicUrl", () => {
    it("should generate public URL for public files", () => {
      const publicFile = { ...mockDbFile, access: FileAccess.PUBLIC };
      const url = (fileService as any).generatePublicUrl(publicFile);
      expect(url).toBe(`http://localhost/test-bucket/${mockFileKey}`);
    });

    it("should generate download URL for private files", () => {
      const url = (fileService as any).generatePublicUrl(mockDbFile);
      expect(url).toBe(`/api/media/${mockFileId}/download`);
    });
  });

  describe("ensureBucketExists", () => {
    it("should not create bucket if it already exists", async () => {
      mockS3Send.mockResolvedValue({});

      await (fileService as any).ensureBucketExists();

      expect(mockS3Send).toHaveBeenCalledWith(
        expect.objectContaining({
          input: expect.objectContaining({
            Bucket: "test-bucket",
          }),
        }),
      );
    });

    it("should create bucket and set policy if it does not exist", async () => {
      const notFoundError = {
        $metadata: { httpStatusCode: 404 },
      };

      mockS3Send.mockRejectedValueOnce(notFoundError).mockResolvedValueOnce({}).mockResolvedValueOnce({});

      await (fileService as any).ensureBucketExists();

      expect(mockS3Send).toHaveBeenCalledTimes(3);
    });
  });
});
