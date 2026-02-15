import { Body, Controller, Delete, Get, Patch, Post, Req, UseGuards } from "@nestjs/common";
import { BlocksService } from "./blocks.service";
import { CreateBlockDto } from "./dto/create-block.dto";
import { JwtAuthGuard } from "../auth/guards/jwt.guards";
import { Request } from "express";
import { GetChildBlocksDto } from "./dto/get-blocks.dto";
import {  DeleteBlockDto } from "./dto/delete-block.dto";
import { CreateAccessDto } from "./dto/create-access.dto";
import { UpadateBlockDto } from "./dto/update-block.dto";
import { UpdateAccessDto } from "./dto/update-access.dto";
import { DeleteAccessDto } from "./dto/delete-access.dto";

@Controller("blocks")
export class BlocksController {
  constructor(private readonly blocksServise: BlocksService) {}

  @Post("block")
  @UseGuards(JwtAuthGuard)
  async createBlock(@Req() req: Request, @Body() dto: CreateBlockDto) {
    return this.blocksServise.createBlock(req.user.sub, dto);
  }

  @Patch("block")
  @UseGuards(JwtAuthGuard)
  async updateBlock(@Req() req: Request, @Body() dto: UpadateBlockDto) {
    return this.blocksServise.upadateBlock(req.user.sub, dto);
  }

  @Post("access")
  @UseGuards(JwtAuthGuard)
  async createAccess(@Req() req: Request, @Body() dto: CreateAccessDto) {
    return this.blocksServise.createAccessForUser(req.user.sub, dto.toId, dto.blockId, dto.permission, dto.expiresAt);
  }

  @Patch("access")
  @UseGuards(JwtAuthGuard)
  async updateAccess(@Req() req: Request, @Body() dto: UpdateAccessDto) {
    return this.blocksServise.updateAccessForUser(req.user.sub, dto);
  }

  @Get("pages")
  @UseGuards(JwtAuthGuard)
  async getUserPages(@Req() req: Request) {
    return this.blocksServise.getUserPages(req.user.sub);
  }

  @Get("child")
  @UseGuards(JwtAuthGuard)
  async getChildBlocks(@Req() req: Request, @Body() dto: GetChildBlocksDto) {
    return this.blocksServise.getChildBlocks(req.user.sub, dto.blockId);
  }

  @Get("access/my")
  @UseGuards(JwtAuthGuard)
  async getFromAccess(@Req() req: Request) {
    return this.blocksServise.getAccessFromUser(req.user.sub);
  }

  @Get("page/title")
  @UseGuards(JwtAuthGuard)
  async findPageTitle(@Req() req: Request) {
    return this.blocksServise.findPageTitle(req.user.sub);
  }

  @Delete("block")
  @UseGuards(JwtAuthGuard)
  async deleteBlock(@Req() req: Request, @Body() dto: DeleteBlockDto) {
    return this.blocksServise.deleteBlock(req.user.sub, dto.blockId);
  }

  @Delete("access")
  @UseGuards(JwtAuthGuard)
  async deleteAccess(@Req() req: Request, @Body() dto: DeleteAccessDto) {
    return this.blocksServise.deleteAccess(req.user.sub, dto.accessId);
  }
}
