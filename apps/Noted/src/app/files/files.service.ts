import { Injectable } from "@nestjs/common";
import { randomUUID } from "crypto";
import * as Minio from "minio";
import { InjectMinio } from "../minio/minio.decorator";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Multer } from "multer";
import path from "path";

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
}
