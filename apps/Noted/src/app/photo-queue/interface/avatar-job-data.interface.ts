import { FileAccess } from "generated/prisma/enums";

export interface AvatarJobData {
  fileId: string;
  userId: string;
  access: FileAccess;
}
