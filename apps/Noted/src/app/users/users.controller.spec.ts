import { Test, TestingModule } from "@nestjs/testing";
import { UsersController } from "./users.controller";
import { UsersService } from "./users.service";
import { Prisma } from "generated/prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { PhotoQueueService } from "../photo-queue/photo-queue.service";
import { FilesService } from "../files/files.service";
import { UploadAvatarDto, UploadAvatarPhotoDto } from "./dto/upload-avatar.dto";
import { Request } from "express";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { HttpStatus } from "@nestjs/common";
import { ErrorCodes } from "@noted/common/errors/error-codes.const";
import { ImageValidationPipe } from "../pipes/image-validation.pipe";
import { UpdateUserDto } from "./dto/user-update.dto";
describe("UsersController", () => {
  let controller: UsersController;
  let service: jest.Mocked<UsersService>;

  const mockFile = {
    buffer: Buffer.from("test"),
    originalname: "test.png",
    mimetype: "image/png",
    size: 1024,
  } as Express.Multer.File;

  const mockReq = {
    user: {
      sub: "user-id-123",
    },
  } as any;
  const mockDto: UploadAvatarPhotoDto = { socketId: "socket-123" };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: {
            updateAvatar: jest.fn(),
            deleteUser: jest.fn(),
            updateUser: jest.fn(),
          },
        },
        {
          provide: PrismaService,
          useValue: jest.fn(),
        },
        {
          provide: PhotoQueueService,
          useValue: jest.fn(),
        },
        {
          provide: FilesService,
          useValue: jest.fn(),
        },
        { provide: JwtService, useValue: { signAsync: jest.fn() } },
        { provide: ConfigService, useValue: { get: jest.fn() } },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    service = module.get(UsersService);
  });

  describe("uploadAvatar", () => {
    it("should call updateAvatar", async () => {
      const uploadData = {
        buffer: mockFile.buffer,
        originalName: mockFile.originalname,
        mimeType: mockFile.mimetype,
        size: mockFile.size,
      };
      service.updateAvatar.mockResolvedValue();
      await controller.uploadAvatar(mockReq, mockFile, mockDto);
      expect(service.updateAvatar).toHaveBeenCalledWith(uploadData, mockReq.user.sub, mockDto.socketId);
      expect(service.updateAvatar).toHaveBeenCalledTimes(1);
    });
  });
  describe("deleteUser", () => {
    it("should call deleteUser service", async () => {
      service.deleteUser.mockResolvedValue();
      await controller.deleteUser(mockReq);
      expect(service.deleteUser).toHaveBeenCalledWith(mockReq.user.sub);
    });
  });

  describe("updateUser", () => {
    it("should call updateUser ", async () => {
      const mockUserUpdateDto: UpdateUserDto = {
        name: "tst",
        email: "test@mail.com",
      };
      await controller.updateMe(mockReq, mockUserUpdateDto);
      expect(service.updateUser).toHaveBeenCalledWith(mockReq.user.sub, mockUserUpdateDto);
    });
  });
});
