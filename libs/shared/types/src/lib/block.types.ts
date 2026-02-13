import { BlockPermission, BlockType } from "generated/prisma/enums";
import { Block } from "generated/prisma/client";

export interface CreateBlockRequest {
  blockType: BlockType;
  meta: BlockMeta;
  order: number;
  parentId?: string;
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

//Container
export interface ContainerMetaContent {
  title: string;
}

export enum ContainerMetaKeys {
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

export type BlockMeta = TextMetaContent | ContainerMetaContent;
