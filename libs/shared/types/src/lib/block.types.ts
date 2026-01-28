import { BlockType } from "generated/prisma/enums";

export interface CreateBlockRequest {
  blockType: BlockType;
  blockContent: Record<string, unknown>;
  parrentId?: string;
  order?: number;
}

export interface PageBlockContent {
  title: string;
  meta: Record<string, unknown>;
}

export interface TextBlockContent {
  json: Record<string, unknown>;
}
