import { BlockType } from "generated/prisma/enums";
import { Block } from "generated/prisma/client";

export interface CreateBlockRequest {
  blockType: BlockType;
  meta: unknown;
  parentId?: string;
  pageId?: string;
  order?: number;
}

export interface CreatePageRequest {
  title: string;
  order: number;
}

export interface BlockWithOrder extends Block {
  order: number;
}

//Text
export interface TextMetaContent {
  json: Record<string, unknown>;
}

export enum TextPageKeys {
  Json = "json",
}

export enum PageOrBlock {
  PAGE,
  BLOCK,
}

export type BlockMeta = TextMetaContent;
