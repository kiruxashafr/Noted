import { BlockMeta, CreateBlockRequest} from "@noted/types";
import { BlockType } from "generated/prisma/enums";

export class CreateBlockDto implements CreateBlockRequest {
  blockType: BlockType;
  meta?: BlockMeta;
  parentId?: string;
  pageId?: string;
  order?: number;
}

