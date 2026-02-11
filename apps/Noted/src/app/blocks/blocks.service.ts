import { BadRequestException, Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { FilesService } from "../files/files.service";
import { PhotoQueueService } from "../photo-queue/photo-queue.service";
import { CreateBlockDto } from "./dto/create-block.dto";
import { BlockMeta, PageOrBlock, TextMetaContent, BlockWithOrder, TextMetaKeys, PageMetaContent, PageMetaKeys, BlockWithPath } from "@noted/types";
import { BlockPermission, BlockType } from "generated/prisma/enums";
import { Block, Prisma } from "generated/prisma/client";
import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { TextBlockMetaDto } from "./dto/content-payload.dto";
import { customAlphabet } from 'nanoid';
import {
  BlockAccessDeniedException,
  BlockNotFoundException,
  FailedToCheckBlockAccessException,
  FailedToCheckPageAccessException,
  FailedToCreateBlockException,
  FailedToFindBlockException,
  FailedToFindPageException,
  InternalErrorException,
} from "@noted/common/errors/domain-exception";
import { toDto } from "../utils/to-dto";
import { ReadBlockDto } from "./dto/read-top-block.dto";
import { CreatePageDto } from "./dto/create-page.dto";
import { randomUUID } from "crypto";

@Injectable()
export class BlocksService {
  private readonly logger = new Logger(BlocksService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly filesService: FilesService,
    private readonly queueService: PhotoQueueService,
  ) { }
async createPage(userId: string, dto: CreatePageDto) {
  try {
    const newId = this.generateBlockId();
    const path = newId; 

    const meta: PageMetaContent = {
      [PageMetaKeys.Title]: dto.title
    };

    const [page] = await this.prisma.$queryRawUnsafe<BlockWithPath[]>(
      `INSERT INTO "blocks" (id, type, meta, path, "order", updated_at)
       VALUES ($1, $2, $3::jsonb, $4::ltree, $5, NOW())
       RETURNING *`,
      newId,
      BlockType.PAGE,
      JSON.stringify(meta),
      path,
      dto.order ?? 0
    );
    await this.prisma.$executeRawUnsafe(
      `INSERT INTO block_accesses (id, user_id, block_id, root_path, permission, updated_at)
       VALUES ($1, $2, $3, $4::ltree, $5, NOW())`,
      randomUUID(), userId, newId, newId, 'OWNER'
    );
    this.logger.log(`createPage() | user ${userId}, create page ${page.id}`)
    return page;
  } catch (error) {
    this.logger.error(`createPage() | ${error.message}`, error.stack);
    throw new FailedToCreateBlockException();
  }
}
  async createBlock(userId: string, dto: CreateBlockDto) {
    await this.validateBlockMeta(dto.blockType, dto.meta);
    await this.checkBlockAccess(userId, dto.parentId, BlockPermission.EDIT)
    switch (dto.blockType) {
      case BlockType.TEXT:
        return await this.createTextBlock(userId, dto);
      default:
        throw new BadRequestException(`Unsupported block type: ${dto.blockType}`);
    }
  }

  async createTextBlock(userId: string, dto: CreateBlockDto) {
    const textBlockMeta = dto.meta as TextMetaContent;

    const meta: TextMetaContent = {
      [TextMetaKeys.Json]: textBlockMeta.json,
    };
    const createBlock: CreateBlockDto = {
      blockType: dto.blockType,
      meta: meta,
      order: dto.order,
      parentId: dto.parentId
    };
    return await this.saveBlock(userId, createBlock);
  }


  async saveBlock(userId: string, dto: CreateBlockDto) {
    const newId = this.generateBlockId();
    const parentPath = await this.getPath(dto.parentId)
    if (!parentPath) {
      throw new BlockNotFoundException('parent block not found')
    }
    const fullPath = `${parentPath}.${newId}`;
    const [block] = await this.prisma.$queryRawUnsafe<BlockWithPath[]>(
          `INSERT INTO "blocks" (id, type, meta, path, "order", updated_at)
          VALUES ($1, $2, $3, $4::ltree, $5, NOW())
          RETURNING *`,
          newId,
          dto.blockType,
          JSON.stringify(dto.meta),
          fullPath,
          dto.order ?? 0
    );
    this.logger.log(`saveBlock() | user ${userId}, create block ${block.id}`)

    return block
  }
  private async checkBlockAccess(userId: string, blockId: string, permission: BlockPermission) {
    try{
    const blockPath = await this.getPath(blockId)
    if (!blockPath) {
    throw new BlockNotFoundException();
    }
    
    const result = await this.prisma.$queryRaw<{ exists: boolean }[]>`
    SELECT EXISTS (
      SELECT 1 FROM "block_accesses"
      WHERE "user_id" = ${userId}
        AND "is_active" = true
        AND ("expires_at" IS NULL OR "expires_at" > NOW())
        AND "root_path" @> ${blockPath}::ltree
        AND (
          CASE "permission"
            WHEN 'OWNER' THEN 3
            WHEN 'EDIT'  THEN 2
            WHEN 'VIEW'  THEN 1
            ELSE 0
          END
        ) >= (
          CASE ${permission}::text
            WHEN 'OWNER' THEN 3
            WHEN 'EDIT'  THEN 2
            WHEN 'VIEW'  THEN 1
            ELSE 0
          END
        )
    )
  `;

      this.logger.log(JSON.stringify(result))
      if (result[0].exists) { return }
      else {throw new BlockAccessDeniedException}
    } catch (error) {
      if (error instanceof BlockAccessDeniedException){throw error}
    this.logger.error(`checkBlockAccess() | ${error.message}`, error.stack);
    throw new FailedToCreateBlockException();
  }
  }
  private async getPath(blockId: string): Promise<string | null>{
    const [blockPath] = await this.prisma.$queryRaw<{ path: string }[]>`
    SELECT path::text FROM blocks
    WHERE id = ${blockId}
    `
    return blockPath?.path || null
  }


  async findPageTitle(userId: string) {
    try {
      const pages = await this.prisma.$queryRaw<{ id: string, title: string }[]>`
      SELECT b.id, 
      b.meta->>${PageMetaKeys.Title} as title
      FROM blocks b
      INNER JOIN block_accesses ba ON b.id = ba.block_id
      WHERE ba.user_id = ${userId}
      AND b.type = 'PAGE'
      AND "is_active" = true
      AND ("expires_at" IS NULL OR "expires_at" > NOW())
`
      return pages;
    } catch (error) {
      if (error instanceof FailedToFindPageException) throw error;
      this.logger.error(`applyChildAccessCheck() | ${(error as Error).message}`, (error as Error).stack);
      throw new BadRequestException();
    }
  }

  private  generateBlockId():string {
    const blockId= customAlphabet('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789', 12);
    return blockId()
  }

//   private async findParentPage(blockId: string) {
//     try {
//       const topBlock = await this.findTopBlockForBlock(blockId);

//       const parentPage = await this.prisma.page.findUnique({
//         where: { id: topBlock.pageId },
//       });

//       return parentPage;
//     } catch (error) {
//       this.logger.error(`findParentPage() | find parent page error ${error}`);
//     }
//   }

//   private async findTopBlockForBlock(blockId: string) {
//     try {
//       const block = await this.prisma.block.findUnique({
//         where: { id: blockId },
//       });

//       if (!block) {
//         throw new BlockNotFoundException();
//       }

//       if (block.pageId) {
//         return block;
//       }

//       const topBlock = await this.prisma.$queryRaw<Array<{ id: string }>>`
//     WITH RECURSIVE block_hierarchy AS (
//       SELECT 
//         b.id,
//         b.page_id as "pageId",
//         br.from as "parentId",
//         1 as depth
//       FROM blocks b
//       LEFT JOIN block_relations br ON br.to = b.id
//       WHERE b.id = ${blockId}
      
//       UNION ALL
      
//       SELECT 
//         b.id,
//         b.page_id as "pageId",
//         br.from as "parentId",
//         bh.depth + 1
//       FROM blocks b
//       INNER JOIN block_relations br ON br.to = b.id
//       INNER JOIN block_hierarchy bh ON b.id = bh."parentId"
//       WHERE bh."pageId" IS NULL 
//       AND bh.depth < 100 
//     )

//     SELECT id
//     FROM block_hierarchy
//     WHERE "pageId" IS NOT NULL
//     LIMIT 1;
//   `;

//       if (!topBlock || topBlock.length === 0) {
//         this.logger.error(`findTopBlockForBlock: No parent block with page found for block ${blockId}`);
//         throw new BadRequestException();
//       }

//       return this.prisma.block.findUnique({
//         where: { id: topBlock[0].id },
//       });
//     } catch (error) {
//       if (error instanceof BadRequestException) throw error;
//       this.logger.error(`findTopBlockForBlock() | ${(error as Error).message}`, (error as Error).stack);
//       throw new FailedToFindBlockException();
//     }
//   }

//   async findAllChildForBlock(userId: string, blockId: string) {
//     await this.applyBlockAccessCheck(userId, BlockPermission.VIEW, blockId)
//     try {
//       const childBlocks = await this.prisma.$queryRaw<Array<{ id: string }>>`
//     WITH RECURSIVE child_hierarchy AS (
//       SELECT 
//         b.id as "parent_id",
//         br.to as "child_id",
//         1 as depth
//       FROM blocks b
//       INNER JOIN block_relations br ON br.from = b.id
//       WHERE b.id = ${blockId}
      
//       UNION ALL
      
//       SELECT 
//         b.id as "parent_id",
//         br.to as "child_id",
//         ch.depth + 1
//       FROM blocks b
//       INNER JOIN block_relations br ON br.from = b.id
//       INNER JOIN child_hierarchy ch ON b.id = ch."child_id"
//       WHERE ch.depth < 100
//     )

//     SELECT DISTINCT child_id as id
//     FROM child_hierarchy
//     WHERE "child_id" IS NOT NULL
// `;
//       const childBlocksArray = childBlocks.map(item => item.id);
//       return childBlocksArray;
//     } catch (error) {
//       this.logger.error(`findAllChildBlock() | ${(error as Error).message}`, (error as Error).stack);
//       throw new FailedToFindBlockException();
//     }
//   }

// async findAllChildForPage(userId: string, pageId: string): Promise<string[]> {
//   await this.applyPageAccessCheck(userId, BlockPermission.VIEW, pageId);
  
//   try {
//     const topBlocks = await this.getTopBlocksForPage(userId, pageId);
    
//     if (!topBlocks || topBlocks.length === 0) {
//       return [];
//     }
    
//     const allIds = new Set<string>();
    
//     topBlocks.forEach(block => allIds.add(block.id));
    

//     for (const topBlock of topBlocks) {
//       const childIds = await this.findAllChildForBlock(userId, topBlock.id);
//       childIds.forEach(id => allIds.add(id));
//     }
    
//     const result = Array.from(allIds);
    
//     return result;
    
//   } catch (error) {
//     this.logger.error(`findAllChildBlockForPage() | ${(error as Error).message}`, (error as Error).stack);
//     throw new InternalErrorException();
//   }
// }

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

  private async validateReqBlockNesting(parentId?: string, pageId?: string): Promise<PageOrBlock> {
    if (!parentId && !pageId) {
      this.logger.error(`validateReqBlockNesting() | create block error request hasnt parentId or pageId`);
      throw new BadRequestException("request hasnt parentId or pageId");
    }
    if (parentId && pageId) {
      this.logger.error(
        `validateReqBlockNesting() | create block error request should has parentId or pageId not together`,
      );
      throw new BadRequestException("request should has parentId or pageId not together");
    }
    if (pageId) {
      return PageOrBlock.PAGE;
    }
    if (parentId) {
      return PageOrBlock.BLOCK;
    }
    throw new BadRequestException();
  }
}
