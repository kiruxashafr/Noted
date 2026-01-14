import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Job } from "bullmq";
import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { FilesService } from "../files/files.service";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { PhotoJobData } from "./interface/photo-job-data.interface";
import { PhotoEvent } from "../shared/events/photo-event.types";


@Processor("photo-editor")
@Injectable()
export class PhotoEditorProcessor extends WorkerHost implements OnModuleInit {
    private readonly logger = new Logger(PhotoEditorProcessor.name);
    private sharp
    private readonly EXTENSION_MAP: Record<string, string> = {
        'jpeg': 'jpg',
        'png': 'png',
        'webp': 'webp',
        'heif': 'heif',
        'gif': 'gif',
        'tiff': 'tiff',
        'avif': 'avif'
    };

    private readonly MIME_MAP: Record<string, string> = {
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'webp': 'image/webp',
        'heif': 'image/heif',
        'gif': 'image/gif',
        'tiff': 'image/tiff',
        'avif': 'image/avif'
    };

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
        const { fileId, userId, access, convertTo, resizeTo } = job.data;

        const originalBuffer = await this.fileService.getFileBuffer(fileId, userId)
        const fileInfo = await this.fileService.findOne(fileId, userId)

        let processor = this.sharp(originalBuffer)

        if (convertTo) {
            processor = processor
              .toFormat(convertTo)
          this.logger.log(`photo ${fileId} convert to ${convertTo}`)
        }
        if (resizeTo) {
            processor = processor
                .resize(resizeTo.width, resizeTo.height, {
                    fit: this.sharp.fit.inside,
                    withoutEnlargement: true
                })
        this.logger.log(`photo ${fileId} resize to ${resizeTo}`)
        }
        const processedBuffer = await processor.toBuffer();
        const extension = this.EXTENSION_MAP[convertTo]
        const mimeType = this.MIME_MAP[convertTo]
              
        const uploadFile = {
        buffer: processedBuffer,
        originalname: fileInfo.originalName.replace(/\.[^.]+$/, `.${extension}`),
        mimetype: mimeType,
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