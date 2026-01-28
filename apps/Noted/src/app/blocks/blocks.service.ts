import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { FilesService } from "../files/files.service";
import { PhotoQueueService } from "../photo-queue/photo-queue.service";

@Injectable()
export class BlocksService { 
      constructor(
        private readonly prisma: PrismaService,
        private readonly filesService: FilesService,
        private readonly queueService: PhotoQueueService,
      ) {}
}