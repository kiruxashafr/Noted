import { InjectQueue } from "@nestjs/bullmq";
import { Injectable, Logger } from "@nestjs/common";
import { Queue } from "bullmq";
import { AvatarJobData } from "./interface/avatar-job-data.interface";
import { AvatarConversionResult } from "./interface/avatar-conversion-result.interface";
import { FileAccess } from "generated/prisma/enums";
import { PhotoJobData } from "./interface/photo-job-data.interface";
import { PhotoEditResult } from "./interface/photo-editor-result.interface";

@Injectable()
export class PhotoQueueService {
    private readonly logger = new Logger(PhotoQueueService.name);

  constructor(
    @InjectQueue("photo-resize")
    private readonly photoResizeQueue: Queue<AvatarJobData, AvatarConversionResult>,
    @InjectQueue("photo-conversion")
    private readonly photoConversionQueue: Queue<AvatarJobData, AvatarConversionResult>,
    @InjectQueue("photo-resize")
    private readonly photoEditorQueue: Queue<PhotoJobData, PhotoEditResult>,
    ) { }

      async sendToHeicConvert(fileId: string, userId: string, access: FileAccess) {

    await this.photoConversionQueue.add("heic-convert", {
      fileId: fileId,
      userId: userId,
      access: access
    });

      }
    async sendToResizeConvert(fileId: string, userId: string, access: FileAccess) {

    await this.photoResizeQueue.add("resize-photo", {
      fileId: fileId,
      userId: userId,
      access: access
    });

    }
    async sendToPhotoEditor(data:PhotoJobData) {

    await this.photoEditorQueue.add("photo-editor", {
      fileId: data.fileId,
      userId: data.userId,
      access: data.access,
      convertTo: data.convertTo,
      resizeTo: data.resizeTo,
      compressTo: data.compressTo
    });

  }
}