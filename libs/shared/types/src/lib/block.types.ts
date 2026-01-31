import { BlockType } from "generated/prisma/enums";

export interface CreateBlockRequest {
  blockType: BlockType;
  meta: unknown;
  parentId?: string;
  pageId?: string;
  order: number;
}

export interface CreatePageRequest {
  title: string;
  order: number;
  meta: unknown;
}
//Page
export interface PageMetaContent {
  json: Record<string, unknown>;
}

export enum BlockPageKeys {
  JSON = "json",
}

//Text
export interface TextMetaContent {
  json: Record<string, unknown>;
}

export enum TextPageKeys {
  JSON = "json",
}

export enum BlockNesting {
  TOP,
  CHILD,
}

export type BlockMeta = PageMetaContent | TextMetaContent;
