// src/users/users.controller.ts
import { Controller, Post, UseInterceptors, UploadedFile, UseGuards, Req } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { UsersService } from "./users.service";
import { JwtAuthGuard } from "../auth/guards/jwt.guards";
import { Request } from "express";
import { ImageValidationPipe } from "../pipes/image-validation.pipe";
import { ImageConverterPipe } from "../pipes/image-converter.pipe";

@Controller("users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post("me/avatar")
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor("avatar"))
  async uploadAvatar(
    @Req() req: Request,
    @UploadedFile(ImageConverterPipe, ImageValidationPipe)
    file: Express.Multer.File,
  ) {
    const uploadData = {
      userId: req.user.sub,
      file,
    };
    return this.usersService.uploadAvatar(uploadData);
  }
}
