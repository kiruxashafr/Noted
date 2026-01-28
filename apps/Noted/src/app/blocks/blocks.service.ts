import { BadRequestException, Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { FilesService } from "../files/files.service";
import { PhotoQueueService } from "../photo-queue/photo-queue.service";
import { CreateBlockDto } from "./dto/create-block.dto";
import { PageBlockContent, TextBlockContent } from "@noted/types";
import { BlockType } from "generated/prisma/enums";
import { Prisma } from "generated/prisma/client";

@Injectable()
export class BlocksService {
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
}
