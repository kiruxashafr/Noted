import { BullModule, getQueueToken } from "@nestjs/bullmq";
import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { PhotoProcessor } from "./result.processor";
import { PrismaModule } from "../prisma/prisma.module";
import { FilesModule } from "../files/files.module";
import { Queue, QueueEvents } from "bullmq";

// Интерфейс для конфигурации подключения Redis
interface RedisConnectionConfig {
  host: string;
  port: number;
  password?: string;
}

// Интерфейс для очереди с пользовательскими настройками
interface CustomQueueOptions {
  connection: RedisConnectionConfig;
  defaultJobOptions: {
    removeOnComplete: number;
    removeOnFail: number;
    attempts: number;
    backoff: {
      type: string;
      delay: number;
    };
  };
}

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
          removeOnComplete: 50,
          removeOnFail: 100,
          attempts: 3,
          backoff: {
            type: "exponential",
            delay: 1000,
          },
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
