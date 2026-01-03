import { HttpStatus, Injectable } from "@nestjs/common";
import { randomUUID } from "crypto";
import * as Minio from "minio";
import { InjectMinio } from "../minio/minio.decorator";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Multer } from "multer";
import path from "path";
import { ApiException } from "@noted/common/errors/api-exception";
import { ErrorCodes } from "@noted/common/errors/error-codes.const";

@Injectable()
export class FilesService {
  protected bucketName = "noted";

  constructor(@InjectMinio() private readonly minioService: Minio.Client) {}

  async uploadPhoto(userId: string, file: Express.Multer.File): Promise<{ filePath: string }> {
    const fileExtension = path.extname(file.originalname);
    const filePath = `${userId}/${randomUUID().toString()}${fileExtension}`;

    this.minioService.putObject(this.bucketName, filePath, file.buffer, file.size, {
      "Content-Type": file.mimetype,
      "X-Amz-Meta-Original-Filename": file.originalname,
    });
    return { filePath };
  }

  async deleteFile(filePath: string): Promise<void> {
    try {
      await this.minioService.statObject(this.bucketName, filePath);
    
      this.minioService.removeObject(this.bucketName, filePath);
    } catch (error) {
      if (error.code === 'NotFound') {
        throw new ApiException(ErrorCodes.FILE_NOT_FOUND, HttpStatus.NOT_FOUND);
      }
      throw new ApiException(ErrorCodes.FILE_NOT_FOUND, HttpStatus.NOT_FOUND, [error])
    }
  }

  
  
}
