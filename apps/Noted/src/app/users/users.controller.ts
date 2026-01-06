import { Controller, Post, UseInterceptors, UploadedFile, UseGuards, Req, Delete, Patch, Body } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { UsersService } from "./users.service";
import { JwtAuthGuard } from "../auth/guards/jwt.guards";
import { Request } from "express";
import { ImageValidationPipe } from "../pipes/image-validation.pipe";
import { ImageConverterPipe } from "../pipes/image-converter.pipe";
import { UpdateUserDto } from "./dto/user-update.dto";
import { UploadFileDto } from "../files/dto/upload-file.dto";
import { Multer } from "multer";

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
    @Body() dto: UploadFileDto
  ) {
    const uploadData = {
      buffer: file.buffer,
      originalname: file.originalname,
      mimetype: file.mimetype,
      size:file.size
    };
    return this.usersService.uploadAvatar(uploadData, req.user.sub, dto.access);
  }

  // @Delete("me/delete")
  // @UseGuards(JwtAuthGuard)
  // async deleteUser(@Req() req: Request) {
  //   return this.usersService.deleteUser(req.user.sub);
  // }

  @Patch("me")
  @UseGuards(JwtAuthGuard)
  async updateMe(@Req() req: Request, @Body() dto: UpdateUserDto) {
    return this.usersService.updateUser(req.user.sub, dto);
  }
}
