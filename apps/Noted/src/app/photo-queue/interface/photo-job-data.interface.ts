import { FileAccess } from "generated/prisma/enums";

export interface PhotoProfile {
  format?: string;
  width?: number;
  height?: number;
}

export interface PhotoJobData {
  fileId: string;
  userId: string;
  access: FileAccess;
  profile: PhotoProfile;
  socketId: string;
}
