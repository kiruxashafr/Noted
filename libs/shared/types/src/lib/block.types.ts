import { BlockType } from "generated/prisma/enums";

export interface CreateBlockRequest {
  blockType: BlockType;
  meta: unknown;
  parentId: string;
  order: number;
}
//Page
export interface PageMetaContent {
  title: string;
}

export enum BlockPageKeys {
  TITLE = "title"
}

//Text
export interface TextMetaContent{
  json: Record<string, unknown>;
}

export enum TextPageKeys {
  JSON = "json"
}

export type BlockMeta = PageMetaContent | TextMetaContent