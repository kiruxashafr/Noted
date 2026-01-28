jest.mock("argon2", () => ({
  verify: jest.fn(),
  hash: jest.fn(),
}));

import { PrismaService } from "../prisma/prisma.service";
import { FilesService } from "../files/files.service";
import { PhotoQueueService } from "../photo-queue/photo-queue.service";
import { FileAccess, UserPlan } from "generated/prisma/enums";
import { UsersService } from "../users/users.service";
import { Test, TestingModule } from "@nestjs/testing";
import { UpdateUserDto } from "./dto/user-update.dto";
import { toDto } from "@noted/common/utils/to-dto";
import { ReadUserDto } from "./dto/read-user.dto";
import * as argon2 from "argon2";
import { ApiException } from "@noted/common/errors/api-exception";
import { ErrorCodes } from "@noted/common/errors/error-codes.const";
import { ReadFileDto } from "../files/dto/read-file.dto";
import { PHOTO_PROFILES } from "../shared/photo-profiles";
import { PhotoJobData } from "../photo-queue/interface/photo-job-data.interface";
import { PhotoConvertedEvent } from "../shared/events/photo-event.types";
import { UserAvatarKeys } from "@noted/types";
describe("UserService", () => {
  let userService: UsersService;
  let mockPrisma: {
    user: {
      findUnique: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
  };
  let mockFilesService: jest.Mocked<FilesService>;
  let mockQueueService: jest.Mocked<PhotoQueueService>;

  const mockUser = {
    id: "user-123",
    name: "user",
    email: "kirill@gmail.com",
    password: "hash_password",
    avatars: { original: "photo", mini_avatar: "photo2" },
    plan: UserPlan.FREE,
    createdAt: new Date(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const prismaMock = {
      user: {
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };

    const photoQueueMock = {
      sendToPhotoEditor: jest.fn(),
    };

    const filesServiceMock = {
      uploadFile: jest.fn(),
      deleteAllUserFiles: jest.fn(),
      deleteFile: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
        {
          provide: PhotoQueueService,
          useValue: photoQueueMock,
        },
        {
          provide: FilesService,
          useValue: filesServiceMock,
        },
      ],
    }).compile();

    userService = module.get<UsersService>(UsersService);
    mockPrisma = module.get(PrismaService) as any;
    mockFilesService = module.get(FilesService) as any;
    mockQueueService = module.get(PhotoQueueService) as any;
  });

  describe("updateUser", () => {
    const userId = "user-123";

    it("should update user name", async () => {
      const dto: UpdateUserDto = {
        name: "newUser",
      };

      const updatedUserMock = {
        ...mockUser,
        name: dto.name,
      };

      mockPrisma.user.update.mockResolvedValue(updatedUserMock);
      const result = await userService.updateUser(userId, dto);

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: dto,
      });
      expect(result).toEqual(toDto(updatedUserMock, ReadUserDto));
    });
    it("should update user mail", async () => {
      const dto: UpdateUserDto = {
        email: "NewEmail@mail.com",
      };

      const updatedUserMock = {
        ...mockUser,
        email: dto.email,
      };

      mockPrisma.user.update.mockResolvedValue(updatedUserMock);
      const result = await userService.updateUser(userId, dto);

      expect(result).toEqual(toDto(updatedUserMock, ReadUserDto));
    });

    it("should call hash function", async () => {
      const dto: UpdateUserDto = {
        password: "User123456.",
      };
      const hashedPassword = "hashed_password_123";
      const updatedUserMock = {
        ...mockUser,
        password: hashedPassword,
      };

      (argon2.hash as jest.Mock).mockResolvedValue(hashedPassword);

      mockPrisma.user.update.mockResolvedValue(updatedUserMock);
      const result = await userService.updateUser(userId, dto);

      expect(argon2.hash).toHaveBeenCalledWith(dto.password);

      expect(argon2.hash).toHaveBeenCalledTimes(1);
    });
    it("should update user all", async () => {
      const dto: UpdateUserDto = {
        password: "User123456.",
        name: "newUser",
        email: "newUser@mail.ru",
      };
      const hashedPassword = "hashed_password_123";
      const updatedUserMock = {
        ...mockUser,
        password: hashedPassword,
        name: dto.name,
        email: dto.email,
      };

      (argon2.hash as jest.Mock).mockResolvedValue(hashedPassword);

      mockPrisma.user.update.mockResolvedValue(updatedUserMock);
      const result = await userService.updateUser(userId, dto);

      expect(argon2.hash).toHaveBeenCalledWith(dto.password);
      expect(argon2.hash).toHaveBeenCalledTimes(1);
      expect(result).toEqual(toDto(updatedUserMock, ReadUserDto));
    });
    it("should not update anything when dto is empty", async () => {
      const dto: UpdateUserDto = {};
      mockPrisma.user.update.mockResolvedValue(mockUser);
      const result = await userService.updateUser(userId, dto);

      expect(result).toEqual(toDto(mockUser, ReadUserDto));
    });
  });
  describe("deleteUser", () => {
    const userId = "user-123";

    it("should throw error if user not found", async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(userService.deleteUser(userId)).rejects.toThrow(ApiException);

      await expect(userService.deleteUser(userId)).rejects.toMatchObject({
        errorCode: ErrorCodes.USER_NOT_FOUND,
      });
    });

    it("should call delete all user files", async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockFilesService.deleteAllUserFiles.mockResolvedValue({ deletedCount: 5 });
      await userService.deleteUser(userId);
      expect(mockFilesService.deleteAllUserFiles).toHaveBeenCalledWith(userId);

      expect(mockPrisma.user.delete).toHaveBeenCalledWith({
        where: { id: userId },
      });
    });
  });
  describe("updateAvatar", () => {
    it("should call uploadFile and sendToPhotoEditor", async () => {
      const mockFile = {
        buffer: Buffer.from("test"),
        originalName: "avatar.heif",
        mimeType: "image/heif",
        size: 10000,
      };
      const mockUserId = "user-123";

      const mockSavedFile: ReadFileDto = {
        id: "file-456",
        url: "https://storage.example.com/file.jpg",
        originalName: "avatar_uploaded.jpg",
        mimeType: "image/jpeg",
        access: FileAccess.PUBLIC,
        size: 1024,
        key: "users/user-123/avatar.jpg",
        ownerId: mockUserId,
        createdAt: new Date(),
      };

      const mockJobData: PhotoJobData = {
        fileId: mockSavedFile.id,
        userId: mockUserId,
        access: FileAccess.PUBLIC,
        profile: PHOTO_PROFILES.AVATAR_MINI,
        socketId: "user-socket-123",
      };

      mockFilesService.uploadFile.mockResolvedValue(mockSavedFile);
      await userService.updateAvatar(mockFile, mockUserId, mockJobData.socketId);

      expect(mockFilesService.uploadFile).toHaveBeenCalledWith(mockUserId, FileAccess.PUBLIC, mockFile);
      expect(mockFilesService.uploadFile).toHaveBeenCalledTimes(1);
      expect(mockQueueService.sendToPhotoEditor).toHaveBeenCalledWith(mockJobData);
    });
  });
  describe("handleAvatarConverted", () => {
    it("should call find user, delete old photo and update user for user without photo", async () => {
      const mockEvent: PhotoConvertedEvent = {
        userId: mockUser.id,
        originalFileId: "original_avatar_file_id",
        newFileId: "new_avatar_file_id",
        socketId: "user-socket-123",
      };

      const userWithoutPhoto = { ...mockUser, avatar: {} };

      mockPrisma.user.findUnique.mockResolvedValue(userWithoutPhoto);
      mockFilesService.deleteFile.mockResolvedValue();
      await userService.handleAvatarConverted(mockEvent);
      const currentAvatars = (mockUser?.avatars as object) || {};

      const updatedAvatar = {
        ...currentAvatars,
        [UserAvatarKeys.ORIGINAL]: mockEvent.originalFileId,
        [UserAvatarKeys.MINI_AVATAR]: mockEvent.newFileId,
      };
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: mockEvent.userId },
        select: { avatars: true },
      });
      expect(mockPrisma.user.findUnique).toHaveBeenCalledTimes(1);
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: mockEvent.userId },
        data: { avatars: updatedAvatar },
      });
      expect(mockPrisma.user.update).toHaveBeenCalledTimes(1);
      expect(mockFilesService.deleteFile).toHaveBeenCalledTimes(2);
    });
    it("should call find user, delete old photo and update user for user with photo", async () => {
      const mockEvent: PhotoConvertedEvent = {
        userId: mockUser.id,
        originalFileId: "original_avatar_file_id",
        newFileId: "new_avatar_file_id",
        socketId: "user-socket-123",
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockFilesService.deleteFile.mockResolvedValue();
      await userService.handleAvatarConverted(mockEvent);
      const currentAvatars = (mockUser?.avatars as object) || {};

      const updatedAvatar = {
        ...currentAvatars,
        [UserAvatarKeys.ORIGINAL]: mockEvent.originalFileId,
        [UserAvatarKeys.MINI_AVATAR]: mockEvent.newFileId,
      };
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: mockEvent.userId },
        select: { avatars: true },
      });
      expect(mockPrisma.user.findUnique).toHaveBeenCalledTimes(1);
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: mockEvent.userId },
        data: { avatars: updatedAvatar },
      });
      expect(mockPrisma.user.update).toHaveBeenCalledTimes(1);
      expect(mockFilesService.deleteFile).toHaveBeenCalledTimes(2);
    });
  });
});
