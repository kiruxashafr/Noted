import { BullModule, getQueueToken } from "@nestjs/bullmq";
import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { PhotoProcessor } from "./convert-photo.processor";
import { PrismaModule } from "../prisma/prisma.module";
import { FilesModule } from "../files/files.module";
import { Queue, QueueEvents } from "bullmq";

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
    {
      provide: "QUEUE_EVENTS",
      useFactory: (queue: Queue): QueueEvents => {
        return new QueueEvents(queue.name, {
          connection: queue.opts.connection
        });
      },
      inject: [getQueueToken("photo-conversion")],
    },
  ],
  exports: [BullModule, "QUEUE_EVENTS"],
})
export class PhotoQueueModule {}
