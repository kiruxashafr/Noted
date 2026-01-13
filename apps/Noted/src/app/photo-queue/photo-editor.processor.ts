import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Job } from "bullmq";
import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { FilesService } from "../files/files.service";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { PhotoConversionFailedEvent, PhotoEvent } from "../shared/events/types";
import { FilesExtension } from "@noted/types";
import { PhotoJobData } from "./interface/photo-job-data.interface";

@Processor("photo-editor")
@Injectable()
export class PhotoEditorProcessor extends WorkerHost implements OnModuleInit {
    private readonly logger = new Logger(PhotoEditorProcessor.name);
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

    async process(job: Job<PhotoJobData>): Promise<void> {
        const { fileId, userId, access, convertTo, resizeTo, compressTo } = job.data;

        const originalBuffer = await this.fileService.getFileBuffer(fileId, userId)
        const fileInfo = await this.fileService.findOne(fileId, userId)

        let processor = this.sharp(originalBuffer)

        if (convertTo) {
            processor = processor
                .toFormat(convertTo)
        }
        if (resizeTo) {
            processor = processor
                .resize(resizeTo.width, resizeTo.height, {
                    fit: this.sharp.fit.inside,
                    withoutEnlargement: true
            })
        }
        if (compressTo.quality) {

            // processor = processor
        }
        const processedBuffer = await processor.toBuffer();

              const uploadFile = {
        buffer: processedBuffer,
        originalname: fileInfo.originalName.replace(/\.[^.]+$/, '.jpg'),
        mimetype: this.MIMETYPE,
        size: processedBuffer.length
      }
      
      const convertedFile = await this.fileService.uploadFile(userId, access, uploadFile)
      this.fileService.deleteFile(fileId, userId)

      const resultData = {
        userId,
        newFileID: convertedFile.id
      }
      
      await this.eventEmitter.emitAsync(PhotoEvent.PHOTO_CONVERTED, resultData);
    
    }




  private async initializeSharp(): Promise<void> {
    try {
      this.sharp = require("sharp");
    } catch (error) {
      this.logger.error(`Failed to initialize sharp: ${error.message}`);
    }
  }

}