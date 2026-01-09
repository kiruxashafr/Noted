import { BullModule } from "@nestjs/bullmq";
import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { PhotoProcessor } from "./convert-photo.processor";
import { PrismaModule } from "../prisma/prisma.module";
import { FilesModule } from "../files/files.module";
import { PhotoQueueService } from "./convert-photo.service";

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    FilesModule,
    BullModule.registerQueueAsync({
      name: "photo-conversion",
      useFactory: (config: ConfigService) => ({
        name: config.getOrThrow("EXECUTION_QUEUE_NAME")
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [
    PhotoProcessor,
    PhotoQueueService
  ],
  exports: [BullModule, PhotoQueueService],
})
export class PhotoQueueModule {}
