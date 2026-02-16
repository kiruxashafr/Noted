import { Test, TestingModule } from "@nestjs/testing";
import { BlocksController } from "./blocks.controller";
import { BlocksService } from "./blocks.service";
import { JwtAuthGuard } from "../auth/guards/jwt.guards";
import { BlockType, BlockPermission } from "generated/prisma/enums";
import { Request } from "express";
import { CreateBlockDto } from "./dto/create-block.dto";
import { UpdateBlockDto } from "./dto/update-block.dto";

describe("BlocksController", () => {
  let controller: BlocksController;
  let service: BlocksService;

  const mockBlocksService = {
    createBlock: jest.fn(),
    upadateBlock: jest.fn(),
    createAccessForUser: jest.fn(),
    updateAccessForUser: jest.fn(),
    getUserPages: jest.fn(),
    getChildBlocks: jest.fn(),
    getAccessFromUser: jest.fn(),
    findPageTitle: jest.fn(),
    deleteBlock: jest.fn(),
    deleteAccess: jest.fn(),
  };

  const mockRequest = {
    user: { sub: "user-uuid-123" },
  } as unknown as Request;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BlocksController],
      providers: [
        {
          provide: BlocksService,
          useValue: mockBlocksService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<BlocksController>(BlocksController);
    service = module.get<BlocksService>(BlocksService);

    jest.clearAllMocks();
  });

  describe("Block Operations", () => {
    it("should call createBlock with correct params", async () => {
      const dto: CreateBlockDto = {
        blockType: BlockType.TEXT,
        meta: { json: {} },
        order: 1,
      };
      await controller.createBlock(mockRequest, dto);

      expect(service.createBlock).toHaveBeenCalledWith("user-uuid-123", dto);
    });

    it("should call updateBlock with correct params", async () => {
      const dto: UpdateBlockDto = {
        blockId: "123",
        blockType: BlockType.TEXT,
        meta: { json: {} },
        order: 1,
      };
      await controller.updateBlock(mockRequest, dto);

      expect(service.upadateBlock).toHaveBeenCalledWith("user-uuid-123", dto);
    });

    it("should call deleteBlock with blockId from dto", async () => {
      const dto = { blockId: "block-to-delete" };
      await controller.deleteBlock(mockRequest, dto);

      expect(service.deleteBlock).toHaveBeenCalledWith("user-uuid-123", "block-to-delete");
    });
  });

  describe("Access Operations", () => {
    it("should call createAccessForUser with exploded dto fields", async () => {
      const dto = {
        toId: "target-user",
        blockId: "block-1",
        permission: BlockPermission.VIEW,
        expiresAt: new Date(),
      };

      await controller.createAccess(mockRequest, dto);

      expect(service.createAccessForUser).toHaveBeenCalledWith(
        "user-uuid-123",
        dto.toId,
        dto.blockId,
        dto.permission,
        dto.expiresAt,
      );
    });

    it("should call deleteAccess with accessId", async () => {
      const dto = { accessId: "access-123" };
      await controller.deleteAccess(mockRequest, dto);

      expect(service.deleteAccess).toHaveBeenCalledWith("user-uuid-123", "access-123");
    });
  });

  describe("Read Operations (Getters)", () => {
    it("should call getUserPages for current user", async () => {
      await controller.getUserPages(mockRequest);
      expect(service.getUserPages).toHaveBeenCalledWith("user-uuid-123");
    });

    it("should call getChildBlocks with blockId from body", async () => {
      const dto = { blockId: "parent-1" };
      await controller.getChildBlocks(mockRequest, dto);
      expect(service.getChildBlocks).toHaveBeenCalledWith("user-uuid-123", "parent-1");
    });

    it("should call findPageTitle for current user", async () => {
      await controller.findPageTitle(mockRequest);
      expect(service.findPageTitle).toHaveBeenCalledWith("user-uuid-123");
    });
  });
});
