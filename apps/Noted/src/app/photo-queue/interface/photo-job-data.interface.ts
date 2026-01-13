import { FilesExtension } from "@noted/types";
import { FileAccess } from "generated/prisma/enums";

interface ResizeOptions {
  width: number,
  height: number
}

interface CompressOptions {
  quality?: number;
  maxSizeKB?: number; 
}

export interface PhotoJobData {
  fileId: string;
  userId: string;
  access: FileAccess;
  convertTo?: FilesExtension;
  resizeTo?: ResizeOptions;
  compressTo?: CompressOptions;
}
