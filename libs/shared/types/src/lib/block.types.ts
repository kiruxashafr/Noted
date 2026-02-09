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

//Page
export interface PageMetaContent {
  title: string;
}

export enum PageMetakeys {
  Title = "title"
}

//Text
export interface TextMetaContent {
  json: Record<string, unknown>;
}

export enum TextMetaKeys {
  Json = "json",
}

export enum PageOrBlock {
  PAGE,
  BLOCK,
}

export interface BlockWithOrder extends Block {
  order: number;
}

export type BlockMeta = TextMetaContent | PageMetaContent;
