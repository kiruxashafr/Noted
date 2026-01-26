import { FileAccess } from "generated/prisma/enums";
import { FilesService } from "./files.service";
import { Test, TestingModule } from "@nestjs/testing";
import { PrismaService } from "../prisma/prisma.service";
import { ConfigService } from "@nestjs/config";

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
    let mockPrisma: jest.Mocked<PrismaService>; 

    const mockUserId = "user-123"
    const mockAccess = FileAccess.PRIVATE

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
            aggregate:jest.fn()
        }
    }

    const mockConfigService = {
        getOrThrow: jest.fn()
    }

    beforeEach(async () => {
        jest.clearAllMocks();

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
        }).compile()
        fileService = module.get<FilesService>(FilesService)
        mockPrisma = module.get(PrismaService) as any;
    })
})