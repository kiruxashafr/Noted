// src/app.module.ts
import { Module, NestModule } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { UsersModule } from "./users/users.module";
import { PrismaService } from "./prisma.service";
import { AuthModule } from "./auth/auth.module";

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), UsersModule, AuthModule],
  controllers: [],
  providers: [PrismaService],
})
export class AppModule implements NestModule {
  configure() {
    // Configure middleware here if needed
  }
}
