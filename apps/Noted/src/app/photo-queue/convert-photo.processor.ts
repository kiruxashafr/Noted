import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Job } from "bullmq";
import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { FilesService } from "../files/files.service";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { PhotoConversionFailedEvent, PhotoEvent } from "../shared/events/types";

@Processor("photo-conversion")
@Injectable()
export class PhotoConvertProcessor extends WorkerHost implements OnModuleInit {
  private readonly logger = new Logger(PhotoConvertProcessor.name);
  private readonly CONVERT_TYPE = "JPEG"
  private readonly MIMETYPE = "image/jpeg"
  private sharp;

  constructor(
    private eventEmitter: EventEmitter2,
    private readonly fileService: FilesService,
  ){super()}

  async onModuleInit() {
    await this.initializeSharp();
  }

  async process(job: Job): Promise<void> {
    const { fileId, userId, access } = job.data;

    const file = await this.fileService.getFileBuffer(fileId, userId)
    const fileInfo = await this.fileService.findOne(fileId,userId)
    try {
      const finalBuffer: Buffer = await this.sharp(file)
        .toFormat(this.CONVERT_TYPE)
        .toBuffer();

      const uploadFile = {
        buffer: finalBuffer,
        originalname: fileInfo.originalName.replace(/\.[^.]+$/, '.jpg'),
        mimetype: this.MIMETYPE,
        size: finalBuffer.length
      }
      
      const convertedFile = await this.fileService.uploadFile(userId, access, uploadFile)
      this.fileService.deleteFile(fileId, userId)

      const resultData = {
        userId,
        newFileID: convertedFile.id
      }
      
      await this.eventEmitter.emitAsync(PhotoEvent.PHOTO_CONVERTED, resultData);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      this.logger.error(` Processing failed for job ${job.id}: ${errorMessage}`);
      const failedEvent: PhotoConversionFailedEvent = {
        userId,
        jobId: job.id,
        fileId,
        error: errorMessage
      };
      
      await this.eventEmitter.emitAsync(PhotoEvent.PHOTO_CONVERSION_FAILED, failedEvent);
    }
  }

  private async initializeSharp(): Promise<void> {
    try {
      this.sharp = require("sharp");
    } catch (error) {
      this.logger.error(`Failed to initialize sharp: ${error.message}`);
    }
  }
}
