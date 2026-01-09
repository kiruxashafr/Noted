import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Job } from "bullmq";
import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { toDto } from "@noted/common/utils/to-dto";
import { ReadConvertPhotoDto } from "./dto/read-convert-photo.dto";
import { FilesService } from "../files/files.service";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { AvatarConversionFailedEvent, AvatarEvent } from "../shared/events/types";

@Processor("photo-conversion")
@Injectable()
export class PhotoProcessor extends WorkerHost implements OnModuleInit {
  private readonly logger = new Logger(PhotoProcessor.name);
  private readonly CONVERT_TYPE = "JPEG"
  private readonly MIMETYPE = "image/jpeg"
  private heicConvert;

  constructor(
    private eventEmitter: EventEmitter2,
    private readonly fileService: FilesService,
  ){super()}

  async onModuleInit() {
    await this.initializeConverter();
  }

  async process(job: Job): Promise<{
    userId: string;
    newFileId: string;
  }> {
    const { fileId, userId, access } = job.data;

    const file = await this.fileService.getFileBuffer(fileId, userId)
    const fileInfo = await this.fileService.findOne(fileId,userId)
    try {
      const finalBuffer: Buffer = await this.heicConvert({
        buffer: file,
        format: this.CONVERT_TYPE
      });

      const uploadFile = {
        buffer: finalBuffer,
        originalname: fileInfo.originalName.replace(/\.(heic|heif)$/i, ".jpg"),
        mimetype: this.MIMETYPE,
        size: finalBuffer.length
      }
      
      const convertedFile = await this.fileService.uploadFile(userId, access, uploadFile)
      this.fileService.deleteFile(fileId, userId)

      const resultData = {
        userId,
        newFileID: convertedFile.id
      }
      
      await this.eventEmitter.emitAsync(AvatarEvent.AVATAR_CONVERTED, resultData);

      return  toDto(resultData, ReadConvertPhotoDto) ;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      this.logger.error(` Processing failed for job ${job.id}: ${errorMessage}`);
      const failedEvent: AvatarConversionFailedEvent = {
        userId,
        jobId: job.id,
        fileId,
        error: errorMessage
      };
      
      await this.eventEmitter.emitAsync(AvatarEvent.AVATAR_CONVERSION_FAILED, failedEvent);
    }
  }

  private async initializeConverter(): Promise<void> {
    try {
      this.heicConvert = require("heic-convert");
    } catch (error) {
      this.logger.error(`Failed to initialize heic-convert: ${error.message}`);
    }
  }
}
