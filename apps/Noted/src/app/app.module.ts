// src/app.module.ts
import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { UsersModule } from "./users/users.module";
import { AuthModule } from "./auth/auth.module";
import { FilesModule } from "./files/files.module";
import { PrismaModule } from "./prisma/prisma.module";
import { PhotoQueueModule } from "./photo-queue/photo-queue.module";
import { EventEmitterModule } from "@nestjs/event-emitter";
import { BullModule } from "@nestjs/bullmq";
import { NotificationModule } from "./notification/notification.module";
import { BlocksModule } from "./blocks/blocks.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    UsersModule,
    AuthModule,
    FilesModule,
    BlocksModule,
    PrismaModule,
    PhotoQueueModule,
    NotificationModule,
    EventEmitterModule.forRoot(),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (conf: ConfigService) => ({
        connection: {
          host: conf.getOrThrow("REDIS_HOST"),
          port: conf.getOrThrow("REDIS_PORT"),
          password: conf.getOrThrow("REDIS_PASSWORD"),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
