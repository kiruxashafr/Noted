import { Module } from "@nestjs/common";
import { UsersController } from "./users.controller";
import { UsersService } from "./users.service";
import { PrismaService } from "../prisma/prisma.service";
import { FilesModule } from "../files/files.module";
import { JwtModule } from "@nestjs/jwt";
import { PhotoQueueModule } from "../photo-queue/photo-queue.module";

@Module({
  imports: [FilesModule, JwtModule, PhotoQueueModule],
  controllers: [UsersController],
  providers: [UsersService, PrismaService],
})
export class UsersModule {}
