import { BadRequestException, Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { FilesService } from "../files/files.service";
import { PhotoQueueService } from "../photo-queue/photo-queue.service";
import { CreateBlockDto } from "./dto/create-block.dto";
import { BlockMeta, TextMetaContent, TextMetaKeys, PageMetaContent, PageMetaKeys, BlockWithPath } from "@noted/types";
import { BlockPermission, BlockType } from "generated/prisma/enums";
import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { TextBlockMetaDto } from "./dto/content-payload.dto";
import { customAlphabet } from "nanoid";
import {
  BlockAccessDeniedException,
  BlockNotFoundException,
  FailedToCreateBlockException,
  FailedToFindPageException,
} from "@noted/common/errors/domain-exception";

import { CreatePageDto } from "./dto/create-page.dto";
import { randomUUID } from "crypto";

@Injectable()
export class BlocksService {
  private readonly logger = new Logger(BlocksService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly filesService: FilesService,
    private readonly queueService: PhotoQueueService,
  ) {}
  async createPage(userId: string, dto: CreatePageDto) {
    try {
      const newId = this.generateBlockId();
      const path = newId;

      const meta: PageMetaContent = {
        [PageMetaKeys.Title]: dto.title,
      };

      const [page] = await this.prisma.$queryRawUnsafe<BlockWithPath[]>(
        `INSERT INTO "blocks" (id, type, meta, path, "order", updated_at)
       VALUES ($1, $2, $3::jsonb, $4::ltree, $5, NOW())
       RETURNING *`,
        newId,
        BlockType.PAGE,
        JSON.stringify(meta),
        path,
        dto.order ?? 0,
      );
      await this.prisma.$executeRawUnsafe(
        `INSERT INTO block_accesses (id, user_id, block_id, root_path, permission, updated_at)
       VALUES ($1, $2, $3, $4::ltree, $5, NOW())`,
        randomUUID(),
        userId,
        newId,
        newId,
        "OWNER",
      );
      this.logger.log(`createPage() | user ${userId}, create page ${page.id}`);
      return page;
    } catch (error) {
      this.logger.error(`createPage() | ${error.message}`, error.stack);
      throw new FailedToCreateBlockException();
    }
  }
  async createBlock(userId: string, dto: CreateBlockDto) {
    await this.validateBlockMeta(dto.blockType, dto.meta);
    await this.checkBlockAccess(userId, dto.parentId, BlockPermission.EDIT);
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
      parentId: dto.parentId,
    };
    return await this.saveBlock(userId, createBlock);
  }

  async saveBlock(userId: string, dto: CreateBlockDto) {
    const newId = this.generateBlockId();
    const parentPath = await this.getPath(dto.parentId);
    if (!parentPath) {
      throw new BlockNotFoundException("parent block not found");
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
      dto.order ?? 0,
    );
    this.logger.log(`saveBlock() | user ${userId}, create block ${block.id}`);

    return block;
  }
  private async checkBlockAccess(userId: string, blockId: string, permission: BlockPermission) {
    try {
      const blockPath = await this.getPath(blockId);
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
      if (result[0].exists) {
        return;
      } else {
        throw new BlockAccessDeniedException();
      }
    } catch (error) {
      if (error instanceof BlockAccessDeniedException) {
        throw error;
      }
      this.logger.error(`checkBlockAccess() | ${error.message}`, error.stack);
      throw new FailedToCreateBlockException();
    }
  }
  private async getPath(blockId: string): Promise<string | null> {
    const [blockPath] = await this.prisma.$queryRaw<{ path: string }[]>`
    SELECT path::text FROM blocks
    WHERE id = ${blockId}
    `;
    return blockPath?.path || null;
  }

  async findPageTitle(userId: string) {
    try {
      const pages = await this.prisma.$queryRaw<{ id: string; title: string }[]>`
      SELECT b.id, 
      b.meta->>${PageMetaKeys.Title} as title
      FROM blocks b
      INNER JOIN block_accesses ba ON b.id = ba.block_id
      WHERE ba.user_id = ${userId}
      AND b.type = 'PAGE'
      AND "is_active" = true
      AND ("expires_at" IS NULL OR "expires_at" > NOW())
`;
      return pages;
    } catch (error) {
      if (error instanceof FailedToFindPageException) throw error;
      this.logger.error(`applyChildAccessCheck() | ${(error as Error).message}`, (error as Error).stack);
      throw new BadRequestException();
    }
  }

  async getUserPages(userId: string) {
    try {
      const pages = await this.prisma.$queryRaw<BlockWithPath[]>`
        SELECT b.*
        FROM blocks b
        INNER JOIN block_accesses ba ON b.id = ba.block_id
        WHERE ba.user_id = ${userId}
        AND b.type = 'PAGE'
        AND "is_active" = true
        AND ("expires_at" IS NULL OR "expires_at" > NOW())
    `;
      return pages;
    } catch (error) {
      if (error instanceof FailedToFindPageException) throw error;
      this.logger.error(`applyChildAccessCheck() | ${(error as Error).message}`, (error as Error).stack);
      throw new BadRequestException();
    }
  }

  async getChildBlocks(userId: string, blockId: string) {
    try {
      await this.checkBlockAccess(userId, blockId, BlockPermission.VIEW);

      const parentPath = await this.getPath(blockId);
      const pages = await this.prisma.$queryRaw<BlockWithPath[]>`
    SELECT *, path::text
    FROM blocks
    WHERE path <@ ${parentPath}::ltree
    AND nlevel(path) = nlevel(${parentPath}::ltree) + 1
    `;

      return pages;
    } catch (error) {
      this.logger.error(`getChildBlocks() | ${(error as Error).message}`, (error as Error).stack);
      throw new BadRequestException();
    }
  }

  async deleteBlock(userId: string, blockId: string) {
    try {
      await this.checkBlockAccess(userId, blockId, BlockPermission.EDIT);

      const parentPath = await this.getPath(blockId);
      if (!parentPath) {
        throw new BlockNotFoundException();
      }
      await this.prisma.$transaction(async tx => {
        await tx.$executeRaw`
            DELETE FROM blocks 
            WHERE path <@ ${parentPath}::ltree`;

        await tx.$executeRaw`
            DELETE FROM block_accesses
            WHERE block_id = ${blockId} OR root_path <@ ${parentPath}::ltree`;
      });
      this.logger.log(`user ${userId} deleted block: ${blockId} and his child`);
      return;
    } catch (error) {
      if (error instanceof BlockNotFoundException) {
        throw error;
      }
      this.logger.error(`getChildBlocks() | ${(error as Error).message}`, (error as Error).stack);
      throw new BadRequestException();
    }
  }

  async createAccessForUser(
    ownerId: string,
    granteeId: string,
    blockId: string,
    permission: BlockPermission,
    expiresAt?: Date,
  ) {
    try {
      await this.checkBlockAccess(ownerId, blockId, BlockPermission.OWNER);
      const rootPath = await this.getPath(blockId);
      const id = randomUUID();
      const [blockAccess] = await this.prisma.$queryRaw<unknown[]>`
      INSERT INTO "block_accesses" (
        id, 
        user_id, 
        block_id, 
        root_path, 
        permission, 
        expires_at, 
        updated_at,
        is_active
      )
      VALUES (
        ${id}, 
        ${granteeId}, 
        ${blockId}, 
        ${rootPath}::ltree, 
        ${permission}::"BlockPermission", 
        ${expiresAt}, 
        NOW(),
        true
      )
      RETURNING *
    `;
      return blockAccess;
    } catch (error) {
      this.logger.error(`createAccessForUser() | ${(error as Error).message}`, (error as Error).stack);
      throw new BadRequestException();
    }
  }

  private generateBlockId(): string {
    const blockId = customAlphabet("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789", 12);
    return blockId();
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
}
