import { CreatePageRequest } from "@noted/types";

export class CreatePageDto implements CreatePageRequest {
  title: string;
  order: number;
}
