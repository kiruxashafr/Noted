import { ContainerMetaContent, TextMetaContent } from "@noted/types";
import { IsNotEmpty } from "class-validator";

export class TextBlockMetaDto implements TextMetaContent {
  @IsNotEmpty()
  payload!: Record<string, unknown>;
}

export class ContainerBlockMetaDto implements ContainerMetaContent {
  @IsNotEmpty()
  title: string;
}
