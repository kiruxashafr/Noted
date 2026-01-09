import { InjectQueue } from "@nestjs/bullmq";
import { Injectable, Logger } from "@nestjs/common";
import { Queue } from "bullmq";
import { AvatarJobData } from "./interface/avatar-job-data.interface";
import { AvatarConversionResult } from "./interface/avatar-conversion-result.interface";
import { FileAccess } from "generated/prisma/enums";

@Injectable()
export class PhotoQueueService {
    private readonly logger = new Logger(PhotoQueueService.name);

  constructor(
    @InjectQueue("photo-resize")
    private readonly photoResizeQueue: Queue<AvatarJobData, AvatarConversionResult>,
    @InjectQueue("photo-conversion")
    private readonly photoConversionQueue: Queue<AvatarJobData, AvatarConversionResult>,
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
}