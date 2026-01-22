import { BlockType } from "generated/prisma/enums";

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

//Text
export interface TextMetaContent {
  json: Record<string, unknown>;
}

export enum TextPageKeys {
  Json = "json",
}

export enum BlockNesting {
  TOP,
  CHILD,
}

export type BlockMeta = TextMetaContent;
