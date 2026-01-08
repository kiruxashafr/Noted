import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Job } from "bullmq";
import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { toDto } from "@noted/common/utils/to-dto";
import { ReadConvertPhotoDto } from "./dto/read-convert-photo.dto";

@Processor("photo-conversion")
@Injectable()
export class PhotoProcessor extends WorkerHost implements OnModuleInit {
  private readonly logger = new Logger(PhotoProcessor.name);
  private heicConvert;

  async onModuleInit() {
    await this.initializeConverter();
  }

  async process(job: Job): Promise<{
    success: boolean;
    convertedBuffer: string;
    fileName: string;
    mimeType: string;
    convertedSize?: number;
  }> {
    this.logger.log(`Processing photo job: ${job.id}`);

    const { fileBufferBase64, originalName } = job.data;

    try {
      const fileBuffer = Buffer.from(fileBufferBase64, "base64");
      const finalBuffer = await this.heicConvert({
        buffer: fileBuffer,
        format: "JPEG",
        quality: 0.85,
      });
      const finalMimeType = "image/jpeg";
      const convertedBufferBase64 = await finalBuffer.toString("base64");

      const resultData = {
        success: true,
        convertedBuffer: convertedBufferBase64,
        fileName: originalName.replace(/\.(heic|heif)$/i, ".jpg"),
        mimeType: finalMimeType,
        convertedSize: finalBuffer.length,}
      return  toDto(resultData, ReadConvertPhotoDto) ;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      this.logger.error(` Processing failed for job ${job.id}: ${errorMessage}`);
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
