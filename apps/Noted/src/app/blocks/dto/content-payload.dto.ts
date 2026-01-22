import { TextMetaContent } from "@noted/types";
import { IsNotEmpty } from "class-validator";

export class TextBlockMetaDto implements TextMetaContent {
  @IsNotEmpty()
  json!: Record<string, unknown>;
}
