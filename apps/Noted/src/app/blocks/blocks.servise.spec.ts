import { Test, TestingModule } from "@nestjs/testing";
import { BlocksService } from "./blocks.service";
import { PrismaService } from "../prisma/prisma.service";
import { FilesService } from "../files/files.service";
import { PhotoQueueService } from "../photo-queue/photo-queue.service";
import { BlockPermission, BlockType } from "generated/prisma/enums";
import {
  DuplicateValueException,
  NotFoundException,
  InternalErrorException,
  BadRequestException,
  BlockAccessDeniedException,
} from "@noted/common/errors/domain_exception/domain-exception";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/client";
import { CreateBlockDto } from "./dto/create-block.dto";

describe("BlocksService", () => {
  let service: BlocksService;

  const mockPrisma = {
    block: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    $queryRaw: jest.fn(),
    $queryRawUnsafe: jest.fn(),
    $transaction: jest.fn(async cb => await cb(mockPrisma)),
    $executeRaw: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BlocksService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: FilesService, useValue: {} },
        { provide: PhotoQueueService, useValue: {} },
      ],
    }).compile();

    service = module.get<BlocksService>(BlocksService);
    jest.clearAllMocks();
  });

  describe("createBlock", () => {
    it("should call createTextBlock when type is TEXT", async () => {
      const dto: CreateBlockDto = {
        blockType: BlockType.TEXT,
        meta: { json: {} },
        order: 1,
      };

      const saveSpy = jest.spyOn(service, "createTextBlock" as any).mockResolvedValue({ id: "1" });

      await service.createBlock("user-1", dto);

      expect(saveSpy).toHaveBeenCalledWith("user-1", dto);
    });

    it("should throw BadRequestException for unsupported block types", async () => {
      const dto: any = {
        blockType: "INVALID_TYPE",
        meta: {},
        order: 1,
      };

      await expect(service.createBlock("user-1", dto)).rejects.toThrow(BadRequestException);
    });
  });
  describe("saveBlock (Raw SQL Insert)", () => {
    it("should successfully create a block and return it", async () => {
      const mockResult = [{ id: "nanoid-123", type: BlockType.TEXT, path: "nanoid-123" }];
      mockPrisma.$queryRawUnsafe.mockResolvedValue(mockResult);
      jest.spyOn(service as any, "getPath").mockResolvedValue(null);

      const dto: CreateBlockDto = {
        blockType: BlockType.TEXT,
        meta: { json: { some: "data" } },
        order: 1,
      };

      const result = await service.saveBlock("user-1", dto);

      expect(result).toEqual(mockResult[0]);
      expect(mockPrisma.$queryRawUnsafe).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        BlockType.TEXT,
        '{"json":{"some":"data"}}',
        "user-1",
        expect.any(String),
        1,
      );
    });
  });
  describe("checkBlockAccess (Security)", () => {
    it("should allow access if user is the owner", async () => {
      mockPrisma.block.findUnique.mockResolvedValue({ ownerId: "user-1" });

      await expect((service as any).checkBlockAccess("user-1", "block-1", BlockPermission.EDIT)).resolves.not.toThrow();
    });

    it("should throw BlockAccessDeniedException if no access found in DB", async () => {
      mockPrisma.block.findUnique.mockResolvedValue({ ownerId: "other-user" });
      jest.spyOn(service as any, "getPath").mockResolvedValue("root.path");

      mockPrisma.$queryRaw.mockResolvedValue([{ exists: false }]);

      await expect((service as any).checkBlockAccess("user-1", "block-1", BlockPermission.EDIT)).rejects.toThrow(
        BlockAccessDeniedException,
      );
    });
  });
  describe("validateBlockMeta (Private)", () => {
    it("should throw BadRequestException if meta validation fails", async () => {
      const invalidMeta = { not_json: 123 };

      await expect((service as any).validateBlockMeta(BlockType.TEXT, invalidMeta)).rejects.toThrow(
        BadRequestException,
      );
    });

    it("should pass if meta is valid for CONTAINER", async () => {
      const validMeta = { title: "My Page" };

      await expect((service as any).validateBlockMeta(BlockType.CONTAINER, validMeta)).resolves.not.toThrow();
    });
  });

  describe("handleBlockError (Internal logic)", () => {
    it("should throw NotFoundException when Postgres returns 23503 (Foreign Key)", () => {
      const foreignKeyError = new PrismaClientKnownRequestError("FK fail", {
        code: "P2010",
        clientVersion: "5.x",
        meta: { driverAdapterError: { cause: { originalCode: "23503" } } },
      });

      expect(() => (service as any).handleBlockError(foreignKeyError)).toThrow(NotFoundException);
    });

    it("should throw DuplicateValueException on unique constraint failure", () => {
      const uniqueError = new PrismaClientKnownRequestError("Unique fail", {
        code: "P2002",
        clientVersion: "5.x",
      });

      expect(() => (service as any).handleBlockError(uniqueError)).toThrow(DuplicateValueException);
    });

    it("should throw InternalErrorException for unknown errors", () => {
      const unknownError = new Error("Unknown");
      expect(() => (service as any).handleBlockError(unknownError)).toThrow(InternalErrorException);
    });
  });

  describe("deleteBlock (Transaction)", () => {
    it("should call executeRaw inside a transaction", async () => {
      const blockId = "block-1";
      const userId = "user-1";

      jest.spyOn(service as any, "checkBlockAccess").mockResolvedValue(undefined);
      jest.spyOn(service as any, "getPath").mockResolvedValue("some.path");

      await service.deleteBlock(userId, blockId);

      expect(mockPrisma.$transaction).toHaveBeenCalled();
      expect(mockPrisma.$executeRaw).toHaveBeenCalled();
    });
  });
});
