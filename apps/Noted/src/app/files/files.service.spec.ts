import { FileAccess } from "generated/prisma/enums";
import { FilesService } from "./files.service";
import { Test, TestingModule } from "@nestjs/testing";
import { PrismaService } from "../prisma/prisma.service";
import { ConfigService } from "@nestjs/config";

const mockS3Send = jest.fn();
const mockUploadDone = jest.fn();


function MockDeleteObjectCommand(params: any) {
  return { input: params };
}

function MockGetObjectCommand(params: any) {
  return { input: params };
}

function MockCreateBucketCommand(params: any) {
  return { input: params };
}

function MockHeadBucketCommand(params: any) {
  return { input: params };
}

function MockPutBucketPolicyCommand(params: any) {
  return { input: params };
}

jest.mock("@aws-sdk/client-s3", () => {
  return {
    S3Client: jest.fn(() => ({
      send: mockS3Send,
    })),
    CreateBucketCommand: MockCreateBucketCommand,
    HeadBucketCommand: MockHeadBucketCommand,
    PutBucketPolicyCommand: MockPutBucketPolicyCommand,
    GetObjectCommand: MockGetObjectCommand,
    DeleteObjectCommand: MockDeleteObjectCommand,
  };
});

jest.mock("@aws-sdk/lib-storage", () => {
  return {
    Upload: jest.fn(() => ({
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
    updatedAt: new Date()
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
      aggregate: jest.fn()
    }
  };

  const mockConfigService = {
    getOrThrow: jest.fn()
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
          useValue: mockPrismaService
        },
        {
          provide: ConfigService,
          useValue: mockConfigService
        }
      ]
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
        where: { id: mockFileId }
      });
      
      expect(mockS3Send).toHaveBeenCalledTimes(1);
      
      expect(mockPrismaService.mediaFile.delete).toHaveBeenCalledWith({
        where: { id: mockFileId }
      });
    });
  });
});