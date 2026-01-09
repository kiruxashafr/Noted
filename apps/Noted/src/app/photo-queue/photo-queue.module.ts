import { BullModule } from "@nestjs/bullmq";
import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { PhotoConvertProcessor } from "./convert-photo.processor";
import { PrismaModule } from "../prisma/prisma.module";
import { FilesModule } from "../files/files.module";
import { PhotoQueueService } from "./photo-queue.service";
import { PhotoResizeProcessor } from "./resize-photo.processor";

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    FilesModule,
    BullModule.registerQueueAsync({
      name: "photo-conversion",
      useFactory: (config: ConfigService) => ({
        name: config.getOrThrow("CONVERSION_QUEUE_NAME")
      }),
      inject: [ConfigService],
    }),
    BullModule.registerQueueAsync({
      name: "photo-resize",
      useFactory: (config: ConfigService) => ({
        name: config.getOrThrow("RESIZE_QUEUE_NAME")
      }),
      inject: [ConfigService],
    })
  ],
  providers: [
    PhotoResizeProcessor,
    PhotoConvertProcessor,
    PhotoQueueService
  ],
  exports: [BullModule, PhotoQueueService],
})
export class PhotoQueueModule {}
