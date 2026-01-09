import { BullModule, getQueueToken } from "@nestjs/bullmq";
import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { PhotoProcessor } from "./convert-photo.processor";
import { PrismaModule } from "../prisma/prisma.module";
import { FilesModule } from "../files/files.module";
import { Queue, QueueEvents } from "bullmq";
import { CustomQueueOptions } from "./interfaces/custom-queue-options.interfaces";

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    FilesModule,
    BullModule.registerQueueAsync({
      name: "photo-conversion",
      useFactory: (config: ConfigService): CustomQueueOptions => ({
        connection: {
          host: config.get<string>("REDIS_HOST", "localhost"),
          port: config.get<number>("REDIS_PORT", 6379),
          password: config.get<string>("REDIS_PASSWORD"),
        },
        defaultJobOptions: {
          removeOnComplete: 20,
          removeOnFail: 50,
        },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [
    PhotoProcessor,
    {
      provide: "QUEUE_EVENTS",
      useFactory: (queue: Queue): QueueEvents => {
        return new QueueEvents("photo-conversion", {
          connection: (queue.opts as CustomQueueOptions).connection,
        });
      },
      inject: [getQueueToken("photo-conversion")],
    },
  ],
  exports: [BullModule, "QUEUE_EVENTS"],
})
export class PhotoQueueModule {}
