import { Module } from "@nestjs/common";

import { PrismaService } from "../prisma/prisma.service";
import { FilesModule } from "../files/files.module";
import { JwtModule } from "@nestjs/jwt";
import { PhotoQueueModule } from "../photo-queue/photo-queue.module";
import { BlocksService } from "./blocks.service";
import { BlocksController } from "./blocks.controller";

@Module({
  imports: [FilesModule, JwtModule, PhotoQueueModule],
  controllers: [BlocksController],
  providers: [BlocksService, PrismaService],
})
export class BlocksModule {}
