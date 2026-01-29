import { BlockType } from "generated/prisma/enums";

export interface CreateBlockRequest {
  blockType: BlockType;
  blockContent: unknown;
}
//Page
export interface PageBlockContent{
  title: string
}

export interface PageMetaContent {
  title: string;
}

export enum BlockPageKeys {
  TITLE = "title"
}

//Text
export interface TextBlockContent {
  text: string
  parentId: string
  order: number
}

export interface TextMetaContent{
  text: string
}

export enum TextPageKeys {
  TEXT = "text"
}

