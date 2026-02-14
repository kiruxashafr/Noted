import { BadRequestException, Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { FilesService } from "../files/files.service";
import { PhotoQueueService } from "../photo-queue/photo-queue.service";
import { CreateBlockDto } from "./dto/create-block.dto";
import {
  BlockMeta,
  TextMetaContent,
  TextMetaKeys,
  ContainerMetaContent,
  ContainerMetaKeys,
  BlockWithPath,
} from "@noted/types";
import { BlockPermission, BlockType } from "generated/prisma/enums";
import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { ContainerBlockMetaDto, TextBlockMetaDto } from "./dto/content-payload.dto";
import { customAlphabet } from "nanoid";
import {
  BlockAccessDeniedException,
  BlockNotFoundException,
  FailedToCreateBlockException,
  FailedToFindBlockException,
} from "@noted/common/errors/domain_exception/domain-exception";

import { randomUUID } from "crypto";
import { BlockAccess } from "generated/prisma/client";
import { UpadateBlockDto } from "./dto/update-block.dto";
import { UpdateAccessDto } from "./dto/update-access.dto";

@Injectable()
export class BlocksService {
  private readonly logger = new Logger(BlocksService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly filesService: FilesService,
    private readonly queueService: PhotoQueueService,
  ) {}

  async createBlock(userId: string, dto: CreateBlockDto) {
    await this.validateBlockMeta(dto.blockType, dto.meta);
    if (dto.parentId) {
      await this.checkBlockAccess(userId, dto.parentId, BlockPermission.EDIT);
    }
    switch (dto.blockType) {
      case BlockType.TEXT:
        return await this.createTextBlock(userId, dto);
      case BlockType.CONTAINER:
        return await this.createContainerBlock(userId, dto);
      default:
        throw new BadRequestException(`Unsupported block type: ${dto.blockType}`);
    }
  }

  async upadateBlock(userId: string, dto: UpadateBlockDto) {
    try {
      await this.checkBlockAccess(userId, dto.blockId, BlockPermission.EDIT)

    const currentBlock = await this.prisma.block.findUnique({
      where: {id: dto.blockId}
    })
    if (!currentBlock) {
      throw new BlockNotFoundException();
    }

    const oldMeta = (currentBlock.meta as Record<string, unknown> || {})
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const newMeta = (dto.meta as Record<string, any> || {})
    const updatedMeta = {
      ...oldMeta,
      ...newMeta
    }

    await this.validateBlockMeta(dto.blockType, updatedMeta)

    const updatedBlock = await this.prisma.block.update({
      where: { id: dto.blockId },
      data: {
        meta: updatedMeta,
        order: dto.order ?? currentBlock.order,
        updatedAt: new Date(),
      },
    });

    this.logger.log(`updateBlock() | user ${userId} updated block ${dto.blockId}`);
      return updatedBlock;
    } catch (error) {
    if (error instanceof BadRequestException) {
      throw error;
    }
    this.logger.error(`updateBlock() | ${error.message}`, error.stack);
    throw new BadRequestException("Failed to update block");
  }
  }

  async createContainerBlock(userId: string, dto: CreateBlockDto) {
    try {
      const ContainerBlockMeta = dto.meta as ContainerMetaContent;

      const meta: ContainerMetaContent = {
        [ContainerMetaKeys.Title]: ContainerBlockMeta.title,
      };
      const createBlock: CreateBlockDto = {
        blockType: dto.blockType,
        meta: meta,
        order: dto.order,
        parentId: dto.parentId,
      };

      return await this.saveBlock(userId, createBlock);
    } catch (error) {
      this.logger.error(`createContainerBlock() | ${error.message}`, error.stack);
      throw new FailedToCreateBlockException();
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
    try {
    const newId = this.generateBlockId();
    const parentPath = dto.parentId ? await this.getPath(dto.parentId) : null;
    const fullPath = parentPath ? `${parentPath}.${newId}` : newId;

    const [block] = await this.prisma.$queryRawUnsafe<BlockWithPath[]>(
      `INSERT INTO "blocks" (id, type, meta, owner_id, path, "order", updated_at)
          VALUES ($1, $2, $3,$4, $5::ltree, $6, NOW())
          RETURNING *`,
      newId,
      dto.blockType,
      JSON.stringify(dto.meta),
      userId,
      fullPath,
      dto.order,
    );
    this.logger.log(`saveBlock() | user ${userId}, create block ${block.id}`);

      return block;
      } catch (error) {
      this.logger.error(`saveBlock() | ${error.message}`, error.stack);
      throw new FailedToCreateBlockException();
    }
  }
  private async checkBlockAccess(userId: string, blockId: string, permission: BlockPermission) {
    try {
      const block = await this.prisma.block.findUnique({
        where: { id: blockId },
        select: { ownerId: true }
      })

      if (block.ownerId == userId) { return }
      
      const blockPath = await this.getPath(blockId);
      if (!blockPath) {
        throw new BlockNotFoundException();
      }

      const result = await this.prisma.$queryRaw<{ exists: boolean }[]>`
    SELECT EXISTS (
      SELECT 1 FROM "block_accesses"
      WHERE "to_id" = ${userId}
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
    try {
      const [blockPath] = await this.prisma.$queryRaw<{ path: string }[]>`
    SELECT path::text FROM blocks
    WHERE id = ${blockId}
    `;
      return blockPath?.path || null;
    } catch (error) {
      this.logger.error(`getPath() | ${(error as Error).message}`, (error as Error).stack);
      throw new BadRequestException();
    }
  }

  async findPageTitle(userId: string) {
    try {
      const pages = await this.prisma.$queryRaw<{ id: string; title: string }[]>`
      SELECT b.id, 
      b.meta->>${ContainerMetaKeys.Title} as title
      FROM blocks b
      INNER JOIN block_accesses ba ON b.id = ba.block_id
      WHERE ba.user_id = ${userId}
      AND b.type = 'PAGE'
      AND "is_active" = true
      AND ("expires_at" IS NULL OR "expires_at" > NOW())
`;
      return pages;
    } catch (error) {
      if (error instanceof FailedToFindBlockException) throw error;
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
      if (error instanceof FailedToFindBlockException) throw error;
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
    toId: string,
    blockId: string,
    permission: BlockPermission,
    expiresAt?: Date,
  ) {
    try {
      await this.checkBlockAccess(ownerId, blockId, BlockPermission.OWNER);
      const rootPath = await this.getPath(blockId);
      const id = randomUUID();
      const [blockAccess] = await this.prisma.$queryRaw<unknown[]>`
      INSERT INTO "block_accesses" ( id, from_id, to_id, block_id, root_path, permission, expires_at, updated_at, is_active)
      VALUES (
        ${id}, 
        ${ownerId}, 
        ${toId},
        ${blockId}, 
        ${rootPath}::ltree, 
        ${permission}::"BlockPermission", 
        ${expiresAt}, 
        NOW(),
        true
      )
      ON CONFLICT (to_id, block_id) 
      DO UPDATE SET 
      permission = EXCLUDED.permission,
      expires_at = EXCLUDED.expires_at,
      updated_at = NOW(),
      is_active = true
        RETURNING *
    `;
      return blockAccess;
    } catch (error) {
      this.logger.error(`createAccessForUser() | ${(error as Error).message}`, (error as Error).stack);
      throw new BadRequestException();
    }
  }

  async updateAccessForUser(userId: string, dto: UpdateAccessDto) {
    try {
      const access = await this.prisma.blockAccess.findUnique({ where:{ id: dto.accessId}})
          await this.checkBlockAccess(userId, access.blockId, BlockPermission.OWNER)
          const updateData: Partial<UpdateAccessDto> = {};
          if (dto.permission) {
            updateData.permission = dto.permission;
          }
          if (dto.isActive !== undefined) {
            updateData.isActive = dto.isActive;
          }
          if (dto.expiresAt) {
            updateData.expiresAt = dto.expiresAt;
          }
    
          const updatedAccess = await this.prisma.blockAccess.update({
            where: { id: dto.accessId },
            data: updateData,
          });
          this.logger.log(`updateAccessForUser | User ${userId} update access`);
          return updatedAccess;
        } catch (error) {
      this.logger.error(`updateAccessForUser() | ${(error as Error).message}`, (error as Error).stack);
      throw new BadRequestException();
        }
  }

  async getAccessFromUser(userId: string) {
    try {
      const accessFrom = await this.prisma.$queryRaw<BlockAccess[]>`
    SELECT ba.* 
    FROM block_accesses ba
    WHERE ba.from_id = ${userId}`;

      return accessFrom;
    } catch (error) {
      if (error instanceof BlockNotFoundException) {
        throw error;
      }
      this.logger.error(`getAccessFromUser() | ${(error as Error).message}`, (error as Error).stack);
      throw new BadRequestException();
    }
  }

  private generateBlockId(): string {
    const blockId = customAlphabet("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789", 12);
    return blockId();
  }

  private async validateBlockMeta(type: BlockType, content: BlockMeta | object): Promise<void> {
    let dtoInstance: object;
    if (!content) {
      this.logger.debug("Empty meta, skipping validation");
      return;
    }
    switch (type) {
      case BlockType.TEXT:
        dtoInstance = plainToInstance(TextBlockMetaDto, content);
        break;
      case BlockType.CONTAINER:
        dtoInstance = plainToInstance(ContainerBlockMetaDto, content);
        break
      default:
        return;
    }

    const errors = await validate(dtoInstance, {
      whitelist: true,
      forbidNonWhitelisted: true
    });

    if (errors.length > 0) {
      const messages = errors.map(err => Object.values(err.constraints || {}).join(", ")).join("; ");

      this.logger.warn(`Validation failed for block type ${type}: ${messages}`);
      throw new BadRequestException(`Validation failed for block type ${type}: ${messages}`);
    }
    return;
  }
}
