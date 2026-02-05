import { BadRequestException, Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { FilesService } from "../files/files.service";
import { PhotoQueueService } from "../photo-queue/photo-queue.service";
import { CreateBlockDto } from "./dto/create-block.dto";
import { BlockMeta, BlockNesting, TextMetaContent, TextPageKeys } from "@noted/types";
import { BlockPermission, BlockType } from "generated/prisma/enums";
import { Prisma } from "generated/prisma/client";

import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { TextBlockMetaDto } from "./dto/content-payload.dto";
import { CreatePageDto } from "./dto/create-page.dto";
import {
  BlockAccessDeniedException,
  BlockNotFoundException,
  FailedToCreateBlockException,
  FailedToFindBlockException,
  FailedToFindPageException,
} from "@noted/common/errors/domain-exception";

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
    await this.validateBlockMeta(dto.blockType, dto.meta);
    await this.checkAccess(userId, blockNesting, BlockPermission.EDIT, dto.parentId, dto.pageId);
    switch (dto.blockType) {
      case BlockType.TEXT:
        return await this.createTextBlock(userId, dto, blockNesting);
      default:
        throw new BadRequestException(`Unsupported block type: ${dto.blockType}`);
    }
  }
  async createPage(userId: string, dto: CreatePageDto) {
    const page = await this.prisma.page.create({
      data: {
        ownerId: userId,
        title: dto.title,
      },
    });
    this.logger.log(`createPageBlock() | user ${userId} create page ${page.id}`);
    return page;
  }

  async createTextBlock(userId: string, dto: CreateBlockDto, blockNesting: BlockNesting) {
    const textBlockMeta = dto.meta as TextMetaContent;

    const meta: TextMetaContent = {
      [TextPageKeys.Json]: textBlockMeta.json,
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
    try {
      const pages = await this.prisma.page.findMany({
        where: {
          ownerId: userId,
        },
        select: {
          id: true,
          title: true,
        },
      });
      if (!pages) {
        throw new FailedToFindPageException();
      }

      const pageTitles = pages.map(page => {
        return {
          id: page.id,
          title: page.title,
        };
      });

      return { pageTitles };
    } catch (error) {
      if (error instanceof FailedToFindPageException) throw error;
      this.logger.error(`applyChildAccessCheck() | ${(error as Error).message}`, (error as Error).stack);
      throw new BadRequestException();
    }
  }

  private async saveBlockByNesting(userId: string, blockNesting: BlockNesting, dto: CreateBlockDto) {
    try {
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
          this.logger.log(`saveBlockByNesting() | user: ${userId} create block: ${block.id}`);
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
          this.logger.log(`saveBlockByNesting() | user: ${userId} create ${blockNesting} block: ${block.id}`);
          return block;
        }
      }
    } catch (error) {
      this.logger.error(`saveBlockByNesting() | ${(error as Error).message}`, (error as Error).stack);
      throw new FailedToCreateBlockException();
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
        await this.applyChildAccessCheck(userId, permission, blockId);
        break;
      }
      case BlockNesting.TOP: {
        await this.applyTopAccessCheck(userId, permission, pageId);
        break;
      }
      default:
        return;
    }
  }

  private async applyChildAccessCheck(userId: string, permission: BlockPermission, blockId?: string) {
    try {
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
        throw new BlockAccessDeniedException();
      }
      return;
    } catch (error) {
      if (error instanceof BlockAccessDeniedException) throw error;
      this.logger.error(`applyChildAccessCheck() | ${(error as Error).message}`, (error as Error).stack);
      throw new FailedToCreateBlockException();
    }
  }
  private async applyTopAccessCheck(userId: string, permission: BlockPermission, pageId: string) {
    try {
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
        throw new BlockAccessDeniedException();
      }
      return;
    } catch (error) {
      if (error instanceof BlockAccessDeniedException) throw error;
      this.logger.error(`applyTopAccessCheck() | ${(error as Error).message}`, (error as Error).stack);
      throw new FailedToCreateBlockException();
    }
  }

  private async findParentPage(blockId: string) {
    try {
      const topBlock = await this.findTopBlock(blockId);

      const parentPage = await this.prisma.page.findUnique({
        where: { id: topBlock.pageId },
      });

      return parentPage;
    } catch (error) {
      this.logger.error(`findParentPage() | find parent page error ${error}`);
    }
  }

  private async findTopBlock(blockId: string) {
    try {
      const block = await this.prisma.block.findUnique({
        where: { id: blockId },
      });

      if (!block) {
        throw new BlockNotFoundException();
      }

      if (block.pageId) {
        return block;
      }

      const result = await this.prisma.$queryRaw<Array<{ id: string }>>`
    WITH RECURSIVE block_hierarchy AS (
      SELECT 
        b.id,
        b.page_id as "pageId",
        br.from_id as "parentId",
        1 as depth
      FROM blocks b
      LEFT JOIN block_relations br ON br.to_id = b.id
      WHERE b.id = ${blockId}
      
      UNION ALL
      
      SELECT 
        b.id,
        b.page_id as "pageId",
        br.from_id as "parentId",
        bh.depth + 1
      FROM blocks b
      INNER JOIN block_relations br ON br.to_id = b.id
      INNER JOIN block_hierarchy bh ON b.id = bh."parentId"
      WHERE bh."pageId" IS NULL 
      AND bh.depth < 100 
    )

    SELECT id
    FROM block_hierarchy
    WHERE "pageId" IS NOT NULL
    LIMIT 1;
  `;

      if (!result || result.length === 0) {
        this.logger.error(`findTopBlock: No parent block with page found for block ${blockId}`);
        throw new BadRequestException();
      }

      return this.prisma.block.findUnique({
        where: { id: result[0].id },
      });
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      this.logger.error(`findTopBlock() | ${(error as Error).message}`, (error as Error).stack);
      throw new FailedToFindBlockException();
    }
  }

  private async validateBlockMeta(type: BlockType, content: BlockMeta): Promise<void> {
    let dtoInstance: object;
    if (!content) {
      this.logger.debug("Empty meta, skipping validation");
      return;
    }
    switch (type) {
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
      throw new BadRequestException();
    }
    return;
  }

  private async validateReqBlockNesting(dto: CreateBlockDto): Promise<BlockNesting> {
    if (!dto.parentId && !dto.pageId) {
      this.logger.error(`validateReqBlockNesting() | create block error request hasnt parentId or pageId`);
      throw new BadRequestException();
    }
    if (dto.parentId && dto.pageId) {
      this.logger.error(
        `validateReqBlockNesting() | create block error request should has parentId or pageId not together`,
      );
      throw new BadRequestException();
    }
    if (dto.pageId) {
      return BlockNesting.TOP;
    }
    if (dto.parentId) {
      return BlockNesting.CHILD;
    }
    throw new BadRequestException();
  }
}
