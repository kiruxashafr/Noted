import { BlockPermission, BlockType } from "generated/prisma/enums";
import { Block } from "generated/prisma/client";

export interface CreateBlockRequest {
  blockType: BlockType;
  meta: BlockMeta;
  parentId: string;
  order: number;
}

export interface CreatePageRequest {
  meta: unknown;
  title: string;
  order: number;
}

export interface CreateAccessRequest {
  toId: string;
  blockId: string;
  permission: BlockPermission;
  expiresAt?: Date | null;
}

export interface DeleteBlockRequest {
  blockId: string;
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

export interface BlockWithPath extends Block {
  path: string;
}

export type BlockMeta = TextMetaContent | PageMetaContent;
