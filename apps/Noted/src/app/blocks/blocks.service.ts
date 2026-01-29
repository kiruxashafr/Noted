import { BadRequestException,  HttpStatus, Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { FilesService } from "../files/files.service";
import { PhotoQueueService } from "../photo-queue/photo-queue.service";
import { CreateBlockDto } from "./dto/create-block.dto";
import { PageBlockContent, TextBlockContent } from "@noted/types";
import { BlockType } from "generated/prisma/enums";
import { Prisma } from "generated/prisma/client";
import { ApiException } from "@noted/common/errors/api-exception";
import { ErrorCodes } from "@noted/common/errors/error-codes.const";

@Injectable()
export class BlocksService {
  private readonly logger = new Logger(BlocksService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly filesService: FilesService,
    private readonly queueService: PhotoQueueService,
  ) { }
  
  async createBlock(userId: string, dto: CreateBlockDto) {
    switch (dto.blockType) {
      case BlockType.PAGE:
        return await this.createPageBlock(userId, dto);
      case BlockType.TEXT:
        return await this.createTextBlock(userId, dto);
      default:
        throw new BadRequestException(`Unsupported block type: ${dto.blockType}`);
    }
  }
  
  async createPageBlock(userId: string, dto: CreateBlockDto) {
    const pageContent = dto.blockContent as unknown as PageBlockContent;
    this.prisma.block.create({
      data: {
        title: pageContent.title,
        type: BlockType.PAGE,
        ownerId: userId,
        meta: pageContent.meta as Prisma.InputJsonValue,
      },
    });
  }

  async createTextBlock(userId: string, dto: CreateBlockDto) {
    const blockContent = dto.blockContent as unknown as TextBlockContent;
    const block = await this.prisma.block.create({
      data: {
        type: BlockType.TEXT,
        meta: blockContent.json as Prisma.InputJsonValue,
      },
    });
    this.prisma.blockRelation.create({
      data: {
        fromId: dto.parrentId,
        toId: block.id,
        order: dto.order,
      },
    });
  }

  async checkAccess(blockId: string, userId) {
    const parentPage = await this.findParentPage(blockId)
    if (parentPage.ownerId == userId) { return }
    const accessBlock = await this.prisma.blockAccess.findUnique({
      where: {
        blockId_userId: {
          blockId: parentPage.id,
          userId: userId,
        }
      }
    })

    if (!accessBlock || !accessBlock.isActive || 
      (accessBlock.expiresAt && accessBlock.expiresAt < new Date())) {
      this.logger.log(`checkAccess() | access denied: user ${userId} to block ${blockId} `)
      throw new ApiException(ErrorCodes.BLOCK_ACCESS_DENIED, HttpStatus.FORBIDDEN);
    }
    return
  }

  async findParentPage(blockId: string) {
    let currentBlockId = blockId;
    const startBlock = await this.prisma.block.findUnique({
      where: { id: blockId }
    })
    if (!startBlock) {
      throw new ApiException(ErrorCodes.BLOCK_NOT_FOUND, HttpStatus.NOT_FOUND)
    }
    if (startBlock.ownerId !== null && startBlock.type == 'PAGE') {
      return(startBlock)
    }
    while (true) {
      const parentRelation = await this.prisma.blockRelation.findFirst({
        where: { toId: currentBlockId },
        include: {
          parent: true
        }
      });
    
      if (!parentRelation) {
        this.logger.error(`findParentPage | block without parent`)
        throw new ApiException(ErrorCodes.BAD_REQUEST, HttpStatus.BAD_REQUEST)
      }
    
      const parentBlock = parentRelation.parent;
    
      if (parentBlock.ownerId !== null && parentBlock.type === 'PAGE') {
        return (parentBlock)
      }
      currentBlockId = parentBlock.id;
    }
  }
}