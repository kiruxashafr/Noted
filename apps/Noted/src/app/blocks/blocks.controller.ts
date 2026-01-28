import { Controller } from "@nestjs/common";
import { BlocksService } from "./blocks.service";

@Controller("blocks")
export class BlocksController {
    constructor(private readonly blocksServise: BlocksService) {}
}