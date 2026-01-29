import { BlockType } from "generated/prisma/enums";

export interface CreateBlockRequest {
  blockType: BlockType;
  blockContent: unknown;
  parrentId?: string;
  order?: number;
}

export interface PageBlockContent {
  title: string;
}

export interface TextBlockContent {
  json: unknown;
}

export enum BlockPageKeys {
  TITLE = "title"
}