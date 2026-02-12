import { BlockType } from "generated/prisma/enums";
import { Block } from "generated/prisma/client";

export interface CreateBlockRequest {
  blockType: BlockType;
  meta: BlockMeta;
  parentId?: string;
  pageId?: string;
  order?: number;
}

export interface CreatePageRequest {
  meta: unknown;
  title: string;
  order: number;
}

//Page
export interface PageMetaContent {
  title: string;
}

export enum PageMetaKeys {
  Title = "title",
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

export interface BlockWithPath extends Block {
  path: string;
}

export interface BlockWithOrder extends Block {
  order: number;
}

export type BlockMeta = TextMetaContent | PageMetaContent;
