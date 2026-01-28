import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  UseGuards,
  Req,
  Delete,
  Patch,
  Body,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { UsersService } from "./users.service";
import { JwtAuthGuard } from "../auth/guards/jwt.guards";
import { Request } from "express";
import { ImageValidationPipe } from "../pipes/image-validation.pipe";
import { UpdateUserDto } from "./dto/user-update.dto";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Multer } from "multer";
import { UploadAvatarPhotoDto } from "./dto/upload-avatar.dto";

@Controller("users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post("me/avatar")
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor("avatar"))
  @HttpCode(HttpStatus.ACCEPTED)
  async uploadAvatar(
    @Req() req: Request,
    @UploadedFile(ImageValidationPipe)
    file: Express.Multer.File,
    @Body() dto: UploadAvatarPhotoDto,
  ) {
    const uploadData = {
      buffer: file.buffer,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
    };
    return this.usersService.updateAvatar(uploadData, req.user.sub, dto.socketId);
  }

  @Delete("me/delete")
  @UseGuards(JwtAuthGuard)
  async deleteUser(@Req() req: Request) {
    return this.usersService.deleteUser(req.user.sub);
  }

  @Patch("me")
  @UseGuards(JwtAuthGuard)
  async updateMe(@Req() req: Request, @Body() dto: UpdateUserDto) {
    return this.usersService.updateUser(req.user.sub, dto);
  }
}
