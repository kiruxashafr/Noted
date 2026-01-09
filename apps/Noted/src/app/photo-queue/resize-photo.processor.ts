import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Job } from "bullmq";
import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { FilesService } from "../files/files.service";
import { EventEmitter2 } from "@nestjs/event-emitter";

@Processor("resize-conversion")
@Injectable()
export class PhotoResizeProcessor extends WorkerHost implements OnModuleInit {
  private readonly logger = new Logger(PhotoResizeProcessor.name);
  private readonly TARGET_SIZE = 180;
  private readonly MIMETYPE = "image/jpeg";
    private readonly QUALITY = 80;
    private sharp

    constructor(
    private eventEmitter: EventEmitter2,
    private readonly fileService: FilesService,
  ) {
    super();
  }

  async onModuleInit() {
    await this.initializeSharp();
  }

  async process(job: Job): Promise<void> {
    const { fileId, userId, access } = job.data;

    const file = await this.fileService.getFileBuffer(fileId, userId)
    const fileInfo = await this.fileService.findOne(fileId,userId)

      const resizedPhoto = await this.sharp(file)
          .resize({ width: 180 })
          .toBuffer()
    
      const uploadFile = {
    buffer: resizedPhoto,
    originalname: fileInfo.originalName,
    mimetype: fileInfo.mimeType,
    size: resizedPhoto.length,
      } 
      this.logger.debug('фото успешно конвертировано')
    await this.fileService.uploadFile(userId, access, uploadFile )
  }

  

  private async initializeSharp(): Promise<void> {
    try {
      this.sharp = require("sharp");
    } catch (error) {
      this.logger.error(`Failed to initialize heic-convert: ${error.message}`);
    }
  }

}