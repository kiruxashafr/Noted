import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Job } from "bullmq";
import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { FilesService } from "../files/files.service";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { PhotoJobData } from "./interface/photo-job-data.interface";
import { PhotoConvertedEvent, PhotoEvent } from "../shared/events/photo-event.types";

@Processor("photo-editor")
@Injectable()
export class PhotoEditorProcessor extends WorkerHost implements OnModuleInit {
  private readonly logger = new Logger(PhotoEditorProcessor.name);
  private sharp;
  private readonly EXTENSION_MAP: Record<string, string> = {
    jpeg: "jpg",
    png: "png",
    webp: "webp",
    heif: "heif",
    gif: "gif",
    tiff: "tiff",
    avif: "avif",
  };

  private readonly MIME_MAP: Record<string, string> = {
    jpeg: "image/jpeg",
    png: "image/png",
    webp: "image/webp",
    heif: "image/heif",
    gif: "image/gif",
    tiff: "image/tiff",
    avif: "image/avif",
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
    const { fileId, userId, access, profile } = job.data;
    try {
      const originalBuffer = await this.fileService.getFileBuffer(fileId, userId);
      const fileInfo = await this.fileService.findOne(fileId, userId);

      let processor = this.sharp(originalBuffer);

      if (profile.format) {
        processor = processor.toFormat(profile.format);
        this.logger.log(`photo ${fileId} convert to ${profile.format}`);
      }

      if (profile.width || profile.height) {
        processor = processor.resize(profile.width, profile.height, {
          fit: this.sharp.fit.inside,
          withoutEnlargement: true,
        });
        this.logger.log(`photo ${fileId} resize to ...`);
      }

      const processedBuffer = await processor.toBuffer();

      let newOriginalName = fileInfo.originalName;
      let mimeType = fileInfo.mimeType;

      if (profile.format) {
        const extension = this.EXTENSION_MAP[profile.format];
        mimeType = this.MIME_MAP[profile.format];
        newOriginalName = fileInfo.originalName.replace(/\.[^.]+$/, `.${extension}`);
      }
      const uploadFile = {
        buffer: processedBuffer,
        originalname: newOriginalName,
        mimetype: mimeType,
        size: processedBuffer.length,
      };

      const convertedFile = await this.fileService.uploadFile(userId, access, uploadFile);

      const resultData: PhotoConvertedEvent = {
        userId,
        originalFileId: fileId,
        newFileId: convertedFile.id,
      };

      await this.eventEmitter.emitAsync(PhotoEvent.PHOTO_CONVERTED, resultData);
    } catch (editError) {
      this.logger.error(`edit is failed ${editError}`);
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
