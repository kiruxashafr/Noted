// src/app.module.ts
import { Module, NestModule } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { UsersModule } from "./users/users.module";
import { AuthModule } from "./auth/auth.module";
import { FilesModule } from "./files/files.module";
import { PrismaModule } from "./prisma/prisma.module";
import { PhotoQueueModule } from "./queue/queue.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    UsersModule,
    AuthModule,
    FilesModule,
    PrismaModule,
    PhotoQueueModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule implements NestModule {
  configure() {
    // Configure middleware here if needed
  }
}
