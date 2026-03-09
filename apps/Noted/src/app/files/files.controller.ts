import { Controller, UseGuards, Req, Get, Param } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards/jwt.guards";
import { Request } from "express";
import { FilesService } from "./files.service";

@Controller("media")
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Get(":id")
  @UseGuards(JwtAuthGuard)
  async uploadAvatar(@Req() req: Request, @Param("id") id: string) {
    return this.filesService.findOne(id, req.user.sub);
  }
}
