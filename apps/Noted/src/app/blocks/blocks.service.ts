import { BadRequestException,  HttpStatus, Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { FilesService } from "../files/files.service";
import { PhotoQueueService } from "../photo-queue/photo-queue.service";
import { CreateBlockDto, CreatePageDto } from "./dto/create-block.dto";
import { BlockMeta,  BlockPageKeys,  PageMetaContent,  requestBlockType,  TextMetaContent, TextPageKeys } from "@noted/types";
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
  ) { }
  async createBlock(userId: string, dto: CreateBlockDto) {
    this.validateBlockMeta(dto.blockType, dto.meta)
    switch (dto.blockType) {
      case BlockType.TEXT:
        return await this.createTextBlock(userId, dto);
      default:
        throw new BadRequestException(`Unsupported block type: ${dto.blockType}`);
    }
  }
    async createPage(userId: string, dto: CreatePageDto) {
        const pageBlockMeta = dto.meta as PageMetaContent;
    const meta: PageMetaContent = {
      [BlockPageKeys.JSON]: pageBlockMeta.json
    }
    const page = await this.prisma.page.create({
      data: {
        ownerId: userId,
        meta: meta as unknown as Prisma.InputJsonValue,

      },
    });
    this.logger.log(`createPageBlock() | user ${userId} create page ${page.id}`)
  }


  async createTextBlock(userId: string, dto: CreateBlockDto) {

    const textBlockMeta = dto.meta as TextMetaContent

    const parent = await this.findParentPage(dto.parentId)
    this.checkAccess(userId, parent.id, BlockPermission.EDIT)

    const meta: TextMetaContent = {
      [TextPageKeys.JSON]: textBlockMeta.json
    }
    const block = await this.prisma.block.create({
      data: {
        type: BlockType.TEXT,
        meta: meta as unknown as Prisma.InputJsonValue,
      },
    });
    this.prisma.blockRelation.create({
      data: {
        fromId: dto.parentId,
        toId: block.id,
        order: dto.order,
      },
    });
  }

  async findPageTitle(userId: string) {
    const pages = await this.prisma.page.findMany({
      where: {
        ownerId: userId, 
      },
      select: {
        id: true,
        title: true
      }
    })

 const pageTitles = pages.map(page => {
    return {
      id: page.id,
      title: page.title
    };
  });

  return { pageTitles };
  }
  //сделать функцию поиска топ блока и родительской страницы или сделать отдельно найти родительскую страницу но должно быть просто
  //проверка доступа должна быть не от ролительского блока а от любого пусть check access сам ищет
  async checkAccess(userId: string, blockId: string, permission?: BlockPermission) {
    const topBlock = await this.findTopBlock(blockId)
    if (parentPage.ownerId == userId) { return }
    const accessBlock = await this.prisma.blockAccess.findUnique({
      where: {
        blockId_userId: {
          blockId: parentPage.id,
          userId: userId,
        }
      }
    })

    if (!accessBlock || !accessBlock.isActive || permission !== accessBlock.permission || 
      (accessBlock.expiresAt && accessBlock.expiresAt < new Date())) {
      this.logger.log(`checkAccess() | access denied: user ${userId} to block ${blockId} `)
      throw new ApiException(ErrorCodes.BLOCK_ACCESS_DENIED, HttpStatus.FORBIDDEN);
    }
    return
  }

  async findTopBlock(blockId: string) {
    let currentBlockId = blockId;
    const startBlock = await this.prisma.block.findUnique({
      where: { id: blockId }
    })
    if (!startBlock) {
      throw new ApiException(ErrorCodes.BLOCK_NOT_FOUND, HttpStatus.NOT_FOUND)
    }
    if (startBlock.pageId !== null) {
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
    
      if (parentBlock.pageId !== null ) {
        return (parentBlock)
      }
      currentBlockId = parentBlock.id;
    }
  }

    private async validateBlockMeta(type: BlockType, content: BlockMeta): Promise<void> {
    let dtoInstance: object;

    switch (type) {
      case BlockType.PAGE:
        dtoInstance = plainToInstance(TextBlockMetaDto, content);
        break;
      case BlockType.TEXT:
        dtoInstance = plainToInstance(PageBlockMetaDto, content);
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
  
  private async validateReqBlockRype(dto: CreateBlockDto) {
    if (!dto.parentId && !dto.pageId) {
      this.logger.error(`create block error | request hasnt parentId or pageId`)
      throw new ApiException(ErrorCodes.BAD_REQUEST, HttpStatus.BAD_REQUEST)
    }
    if (dto.parentId && dto.pageId) {
      this.logger.error(`create block error | request should has parentId or pageId not together`)
      throw new ApiException(ErrorCodes.BAD_REQUEST, HttpStatus.BAD_REQUEST )
    }
    if (dto.pageId) { return requestBlockType.TOP }
    if (dto.parentId) { return requestBlockType.CHILD }
  }
}