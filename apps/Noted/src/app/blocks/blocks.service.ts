import { BadRequestException, HttpStatus, Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { FilesService } from "../files/files.service";
import { PhotoQueueService } from "../photo-queue/photo-queue.service";
import { CreateBlockDto, CreatePageDto } from "./dto/create-block.dto";
import { BlockMeta, BlockPageKeys, PageMetaContent, BlockNesting, TextMetaContent, TextPageKeys } from "@noted/types";
import { BlockPermission, BlockType } from "generated/prisma/enums";
import { Prisma } from "generated/prisma/client";
import { ApiException } from "@noted/common/errors/api-exception";
import { ErrorCodes } from "@noted/common/errors/error-codes.const";

import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { PageBlockMetaDto, TextBlockMetaDto } from "./dto/content-payload.dto";

@Injectable()
export class BlocksService {
  private readonly logger = new Logger(BlocksService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly filesService: FilesService,
    private readonly queueService: PhotoQueueService,
  ) {}
  async createBlock(userId: string, dto: CreateBlockDto) {
    const blockNesting = await this.validateReqBlockNesting(dto);
    this.validateBlockMeta(dto.blockType, dto.meta);
    this.checkAccess(userId, blockNesting, BlockPermission.EDIT, dto.parentId, dto.pageId);
    switch (dto.blockType) {
      case BlockType.TEXT:
        return await this.createTextBlock(userId, dto, blockNesting);
      default:
        throw new BadRequestException(`Unsupported block type: ${dto.blockType}`);
    }
  }
  async createPage(userId: string, dto: CreatePageDto) {
    const pageBlockMeta = dto.meta as PageMetaContent;
    const meta: PageMetaContent = {
      [BlockPageKeys.JSON]: pageBlockMeta.json,
    };
    const page = await this.prisma.page.create({
      data: {
        ownerId: userId,
        meta: meta as unknown as Prisma.InputJsonValue,
      },
    });
    this.logger.log(`createPageBlock() | user ${userId} create page ${page.id}`);
  }

  async createTextBlock(userId: string, dto: CreateBlockDto, blockNesting: BlockNesting) {
    const textBlockMeta = dto.meta as TextMetaContent;

    const meta: TextMetaContent = {
      [TextPageKeys.JSON]: textBlockMeta.json,
    };
    const createBlock: CreateBlockDto = {
      blockType: dto.blockType,
      meta: meta,
      order: dto.order,
      pageId: dto.pageId,
      parentId: dto.parentId,
    };
    return await this.saveBlockByNesting(userId, blockNesting, createBlock);
  }

  async findPageTitle(userId: string) {
    const pages = await this.prisma.page.findMany({
      where: {
        ownerId: userId,
      },
      select: {
        id: true,
        title: true,
      },
    });

    const pageTitles = pages.map(page => {
      return {
        id: page.id,
        title: page.title,
      };
    });

    return { pageTitles };
  }

  private async saveBlockByNesting(userId: string, blockNesting: BlockNesting, dto: CreateBlockDto) {
    switch (blockNesting) {
      case BlockNesting.CHILD: {
        const block = await this.prisma.block.create({
          data: {
            type: dto.blockType,
            meta: dto.meta as unknown as Prisma.InputJsonValue,
          },
        });
        await this.prisma.blockRelation.create({
          data: {
            fromId: dto.parentId,
            toId: block.id,
            order: dto.order,
          },
        });
        return block;
      }
      case BlockNesting.TOP: {
        const block = await this.prisma.block.create({
          data: {
            type: dto.blockType,
            meta: dto.meta as unknown as Prisma.InputJsonValue,
            pageId: dto.pageId,
          },
        });
        return block;
      }
    }
  }

  private async checkAccess(
    userId: string,
    blockNesting: BlockNesting,
    permission: BlockPermission,
    blockId?: string,
    pageId?: string,
  ) {
    switch (blockNesting) {
      case BlockNesting.CHILD: {
        const parentPage = await this.findParentPage(blockId);

        if (parentPage.ownerId == userId) {
          return;
        }

        const accessBlock = await this.prisma.pageAccess.findUnique({
          where: {
            pageId_userId: {
              pageId: parentPage.id,
              userId: userId,
            },
          },
        });

        if (
          !accessBlock ||
          !accessBlock.isActive ||
          permission !== accessBlock.permission ||
          (accessBlock.expiresAt && accessBlock.expiresAt < new Date())
        ) {
          this.logger.log(`checkAccess() | access denied: user ${userId} to block ${blockId} `);
          throw new ApiException(ErrorCodes.BLOCK_ACCESS_DENIED, HttpStatus.FORBIDDEN);
        }
        return;
      }

      case BlockNesting.TOP: {
        const parentPageForTop = await this.prisma.page.findUnique({
          where: { id: pageId },
        });
        if (parentPageForTop.ownerId == userId) {
          return;
        }
        const accessBlockForTop = await this.prisma.pageAccess.findUnique({
          where: {
            pageId_userId: {
              pageId: pageId,
              userId: userId,
            },
          },
        });
        if (
          !accessBlockForTop ||
          !accessBlockForTop.isActive ||
          permission !== accessBlockForTop.permission ||
          (accessBlockForTop.expiresAt && accessBlockForTop.expiresAt < new Date())
        ) {
          this.logger.log(`checkAccess() | access denied: user ${userId} to page ${pageId} `);
          throw new ApiException(ErrorCodes.BLOCK_ACCESS_DENIED, HttpStatus.FORBIDDEN);
        }
        return;
      }
      default:
        return;
    }
  }

  private async findParentPage(blockId: string) {
    const topBlock = await this.findTopBlock(blockId);

    const parentPage = await this.prisma.page.findUnique({
      where: { id: topBlock.pageId },
    });

    return parentPage;
  }

  private async findTopBlock(blockId: string) {
    let currentBlockId = blockId;
    const startBlock = await this.prisma.block.findUnique({
      where: { id: blockId },
    });
    if (!startBlock) {
      throw new ApiException(ErrorCodes.BLOCK_NOT_FOUND, HttpStatus.NOT_FOUND);
    }
    if (startBlock.pageId !== null) {
      return startBlock;
    }
    while (true) {
      const parentRelation = await this.prisma.blockRelation.findFirst({
        where: { toId: currentBlockId },
        include: {
          parent: true,
        },
      });

      if (!parentRelation) {
        this.logger.error(`findParentPage | block without parent`);
        throw new ApiException(ErrorCodes.BAD_REQUEST, HttpStatus.BAD_REQUEST);
      }

      const topBlock = parentRelation.parent;

      if (topBlock.pageId !== null) {
        return topBlock;
      }
      currentBlockId = topBlock.id;
    }
  }

  private async validateBlockMeta(type: BlockType, content: BlockMeta): Promise<void> {
    let dtoInstance: object;

    switch (type) {
      case BlockType.PAGE:
        dtoInstance = plainToInstance(PageBlockMetaDto, content);
        break;
      case BlockType.TEXT:
        dtoInstance = plainToInstance(TextBlockMetaDto, content);
        break;
      default:
        return;
    }

    const errors = await validate(dtoInstance);

    if (errors.length > 0) {
      const messages = errors.map(err => Object.values(err.constraints || {}).join(", ")).join("; ");

      this.logger.warn(`Validation failed for block type ${type}: ${messages}`);
      throw new ApiException(ErrorCodes.BAD_REQUEST, HttpStatus.BAD_REQUEST);
    }
  }

  private async validateReqBlockNesting(dto: CreateBlockDto) {
    if (!dto.parentId && !dto.pageId) {
      this.logger.error(`create block error | request hasnt parentId or pageId`);
      throw new ApiException(ErrorCodes.BAD_REQUEST, HttpStatus.BAD_REQUEST);
    }
    if (dto.parentId && dto.pageId) {
      this.logger.error(`create block error | request should has parentId or pageId not together`);
      throw new ApiException(ErrorCodes.BAD_REQUEST, HttpStatus.BAD_REQUEST);
    }
    if (dto.pageId) {
      return BlockNesting.TOP;
    }
    if (dto.parentId) {
      return BlockNesting.CHILD;
    }
  }
}
