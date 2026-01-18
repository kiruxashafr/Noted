jest.mock("argon2", () => ({
  verify: jest.fn(),
  hash: jest.fn(),
}));

jest.mock("@noted/common/utils/to-dto", () => ({
  toDto: jest.fn(),
}));

import { PrismaService } from "../prisma/prisma.service";
import { FilesService } from "../files/files.service";
import { PhotoQueueService } from "../photo-queue/photo-queue.service";
import { UserPlan } from "generated/prisma/enums";
import { UsersService } from "../users/users.service";
import { Test, TestingModule } from "@nestjs/testing";
describe("UserService", () => {
  let userService: UsersService;
  let mockPrisma: jest.Mocked<PrismaService>;
  let mockFilesService: jest.Mocked<FilesService>;
  let mockQueueService: jest.Mocked<PhotoQueueService>;

  const mockUser = {
    id: "123",
    name: "user",
    email: "kirill@gmail.com",
    password: "hash_password",
    avatars: { original: "photo", mini_avatar: "photo2" },
    plan: UserPlan.FREE,
    createdAt: new Date(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findUnique: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
            },
          },
        },
        {
          provide: PhotoQueueService,
          useValue: {
            sendToPhotoEditor: jest.fn(),
          },
        },
        {
          provide: FilesService,
          useValue: {
            uploadFile: jest.fn(),
            deleteAllUserFiles: jest.fn(),
          },
        },
      ],
    }).compile();
    userService = module.get(UsersService);
    mockPrisma = module.get(PrismaService) as jest.Mocked<PrismaService>;
    mockFilesService = module.get(FilesService) as jest.Mocked<FilesService>;
    mockQueueService = module.get(PhotoQueueService) as jest.Mocked<PhotoQueueService>;
  });
});
