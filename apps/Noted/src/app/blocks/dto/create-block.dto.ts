import { CreateBlockRequest } from "@noted/types";
import { BlockType } from "generated/prisma/enums";

export class CreateBlockDto implements CreateBlockRequest {
  blockType: BlockType;
  blockContent: unknown;
}
