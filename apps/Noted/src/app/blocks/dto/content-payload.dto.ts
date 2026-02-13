import { ContainerMetaContent, TextMetaContent } from "@noted/types";
import { IsNotEmpty } from "class-validator";

export class TextBlockMetaDto implements TextMetaContent {
  @IsNotEmpty()
  json!: Record<string, unknown>;
}

export class ContainerBlockMetaDto implements ContainerMetaContent {
  @IsNotEmpty()
  title: string;
}
