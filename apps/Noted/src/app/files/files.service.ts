import { HttpStatus, Injectable, Logger } from "@nestjs/common";
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
  private readonly logger = new Logger(FilesService.name);

  constructor(@InjectMinio() private readonly minioService: Minio.Client) {
    this.initializeBucket();
  }

  async uploadPhoto(userId: string, file: Express.Multer.File): Promise<{ filePath: string }> {
    try {
      const fileExtension = path.extname(file.originalname);
      const filePath = `${userId}/${randomUUID().toString()}${fileExtension}`;

      await this.minioService.putObject(this.bucketName, filePath, file.buffer, file.size, {
        "Content-Type": file.mimetype,
        "X-Amz-Meta-Original-Filename": file.originalname,
      });
      return { filePath };
    } catch (error) {
      throw new ApiException(ErrorCodes.FILE_UPLOAD_FAILED, HttpStatus.INTERNAL_SERVER_ERROR, error.message);
    }
  }

  async deleteFile(filePath: string): Promise<void> {
    try {
      await this.minioService.statObject(this.bucketName, filePath);

      await this.minioService.removeObject(this.bucketName, filePath);

      this.logger.log(`file ${filePath} successful delete`);
    } catch (error) {
      throw new ApiException(ErrorCodes.DELETE_FILE_ERROR, HttpStatus.INTERNAL_SERVER_ERROR, error.message);
    }
  }

  async deleteAllFile(prefix: string) {
    try {
      const objectList: string[] = [];
      const srteam = this.minioService.listObjectsV2(this.bucketName, prefix, true);

      for await (const obj of srteam) {
        objectList.push(obj.name);
      }

      if (objectList.length === 0) {
        this.logger.log(`No files found with prefix: "${prefix}"`);
        return {
          deletedCount: 0,
          files: [],
        };
      }

      await this.minioService.removeObjects(this.bucketName, objectList);

      this.logger.log(`saccessfully deleted ${objectList.length} files`);
      return {
        deletedCount: objectList.length,
        files: objectList,
      };
    } catch (error) {
      throw new ApiException(ErrorCodes.DELETE_FILE_ERROR, HttpStatus.INTERNAL_SERVER_ERROR, error.message);
    }
  }

  private async initializeBucket() {
    try {
      const bucketExists = await this.minioService.bucketExists(this.bucketName);

      if (!bucketExists) {
        await this.minioService.makeBucket(this.bucketName, "us-east-1");
        this.logger.log(`Bucket ${this.bucketName} created`);
      }
    } catch (error) {
      this.logger.error(`create bucket error ${error}`);
    }
  }
}
