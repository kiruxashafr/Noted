import { Body, Controller, Get, Post, Req, UseGuards } from "@nestjs/common";
import { BlocksService } from "./blocks.service";
import { CreateBlockDto } from "./dto/create-block.dto";
import { JwtAuthGuard } from "../auth/guards/jwt.guards";
import { Request } from "express";
import { CreatePageDto } from "./dto/create-page.dto";
import { GetChildBlocksDto, GetTopBlocksDto } from "./dto/get-blocks.dto";

@Controller("blocks")
export class BlocksController {
  constructor(private readonly blocksServise: BlocksService) {}

  @Post("block")
  @UseGuards(JwtAuthGuard)
  async createBlock(@Req() req: Request, @Body() dto: CreateBlockDto) {
    return this.blocksServise.createBlock(req.user.sub, dto);
  }

  @Post("page")
  @UseGuards(JwtAuthGuard)
  async createPage(@Req() req: Request, @Body() dto: CreatePageDto) {
    return this.blocksServise.createPage(req.user.sub, dto);
  }

  @Get("child")
  @UseGuards(JwtAuthGuard)
  async getChildBlocks(@Req() req: Request, @Body() dto: GetChildBlocksDto) {
    return this.blocksServise.getChildBlocks(req.user.sub, dto.blockId);
  }

  @Get("testchild")
  @UseGuards(JwtAuthGuard)
  async getChildBlocksTest(@Req() req: Request, @Body() dto: GetTopBlocksDto) {
    return this.blocksServise.findAllChildBlockForPage(req.user.sub, dto.pageId);
  }

  @Get("page/block")
  @UseGuards(JwtAuthGuard)
  async getTopBlocks(@Req() req: Request, @Body() dto: GetTopBlocksDto) {
    return this.blocksServise.getTopBlocksForPage(req.user.sub, dto.pageId);
  }

  @Get("page/title")
  @UseGuards(JwtAuthGuard)
  async findPageTitle(@Req() req: Request) {
    return this.blocksServise.findPageTitle(req.user.sub);
  }
}
