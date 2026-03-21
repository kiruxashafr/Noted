import { Module } from "@nestjs/common";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { PrismaService } from "../prisma/prisma.service";
import { JwtModule } from "@nestjs/jwt";
import { ConfigModule } from "@nestjs/config";
import { FilesService } from "../files/files.service";

@Module({
  imports: [JwtModule, ConfigModule],
  controllers: [AuthController],
  providers: [AuthService, PrismaService, FilesService],
})
export class AuthModule {}
