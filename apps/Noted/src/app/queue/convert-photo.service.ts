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
    @InjectQueue("photo-conversion")
    private readonly photoQueue: Queue<AvatarJobData, AvatarConversionResult>,
    ) { }

      async sendToHeicConvert(fileId: string, userId: string, access: FileAccess) {

    await this.photoQueue.add("heic-convert", {
      fileId: fileId,
      userId: userId,
      access: access
    });

  }
}