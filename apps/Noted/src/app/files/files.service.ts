import { HttpStatus, Injectable, Logger, OnModuleInit, PayloadTooLargeException } from "@nestjs/common";
import { v4 as uuid } from "uuid";
import { Upload } from "@aws-sdk/lib-storage";
import { ApiException } from "@noted/common/errors/api-exception";
import { ErrorCodes } from "@noted/common/errors/error-codes.const";
import { CreateBucketCommand, DeleteObjectCommand, HeadBucketCommand, PutBucketPolicyCommand, S3Client } from "@aws-sdk/client-s3";
import { ConfigService } from "@nestjs/config";
import { ReadFileDto } from "./dto/read-file.dto";
import { PrismaService } from "../prisma/prisma.service";
import { STORAGE_QUOTAS } from "@noted/common/constants";
import { StorageUsageDto } from "./dto/usage.dto";
import { toDto } from "@noted/common/utils/to-dto";
import { FileAccess } from "generated/prisma/enums";
import { MediaFile } from "generated/prisma/client";

@Injectable()
export class FilesService implements OnModuleInit{
  private readonly logger = new Logger(FilesService.name);
  private readonly s3: S3Client;
  private readonly bucket: string;
  private readonly endpointPublic: string;
  private readonly defaultQuota: number;



  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService
  ) {
    this.bucket = this.config.getOrThrow<string>("STORAGE_BUCKET_NAME");
    this.endpointPublic = this.config.getOrThrow<string>("STORAGE_ENDPOINT_PUBLIC");
    this.defaultQuota = parseInt(config.getOrThrow("STORAGE_QUOTA_DEFAULT"));

    this.s3 = new S3Client({
      endpoint: config.getOrThrow<string>("STORAGE_ENDPOINT"),
      region: this.config.getOrThrow<string>("STORAGE_REGION"),
      credentials: {
        accessKeyId: config.getOrThrow<string>("STORAGE_ACCESS_KEY"),
        secretAccessKey: config.getOrThrow<string>("STORAGE_SECRET_KEY")
      },
      forcePathStyle: true

    })
  }

  async onModuleInit() {
    await this.ensureBucketExists();
  }

  async uploadFile(
    userId: string,
    access: FileAccess = FileAccess.PRIVATE,
    file: { buffer: Buffer; originalname: string; mimetype: string; size: number}
  ): Promise<ReadFileDto> {
    await this.checkQuota(userId, file.size)
    const fileKey = `${userId}/${uuid()}`;


    try {

      const upload = new Upload({
        client: this.s3,
        params: {
          Bucket: this.bucket,
          Key: fileKey,
          Body: file.buffer,
          ContentType: file.mimetype,
          Metadata: {
            "X-Amz-Meta-Original-Filename": file.originalname,
          }
        }
      })
      await upload.done();
    } catch (error) {
      throw new ApiException(ErrorCodes.FILE_UPLOAD_FAILED, HttpStatus.INTERNAL_SERVER_ERROR, error.message);
    }

    try {

      const saved = await this.prisma.mediaFile.create({
        data: {
          bucket: this.bucket,
          key: fileKey,
          mimeType: file.mimetype,
          originalName: file.originalname,
          size: file.size,
          ownerId: userId,
          access
        }
      })
      const dto = toDto(saved, ReadFileDto);
      dto.url = this.generatePublicUrl(saved)

      return dto;
    }catch(error: unknown) {
      this.logger.error(`upload() | DB Save Failed. Cleaning up S3... | key=${fileKey}`, (error as Error).stack);
    }
          try {
        await this.s3.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: fileKey }));
        this.logger.log(`upload() | Cleanup successful | key=${fileKey}`);
      } catch (cleanupError) {
        this.logger.error(`upload() | CRITICAL: Failed to cleanup S3 after DB error | key=${fileKey}`, cleanupError);
      }
  } 

  async deleteFile(fileId: string): Promise<void> {
    const file = await this.prisma.mediaFile.findUnique({
      where: {
        id: fileId
      }
    })
    
    try {
      await this.s3.send(
        new DeleteObjectCommand({
          Bucket: file.bucket,
          Key: file.key
        })
      )
    } catch {
      this.logger.warn(`delete() | Failed to delete from S3 (orphan possible) | key=${file.key}`);
    }
  }

  // async deleteAllFile(prefix: string) {
  //   try {
  //     const objectList: string[] = [];
  //     const srteam = this.minioService.listObjectsV2(this.bucketName, prefix, true);

  //     for await (const obj of srteam) {
  //       objectList.push(obj.name);
  //     }

  //     if (objectList.length === 0) {
  //       this.logger.log(`No files found with prefix: "${prefix}"`);
  //       return {
  //         deletedCount: 0,
  //         files: [],
  //       };
  //     }

  //     await this.minioService.removeObjects(this.bucketName, objectList);

  //     this.logger.log(`saccessfully deleted ${objectList.length} files`);
  //     return {
  //       deletedCount: objectList.length,
  //       files: objectList,
  //     };
  //   } catch (error) {
  //     throw new ApiException(ErrorCodes.DELETE_FILE_ERROR, HttpStatus.INTERNAL_SERVER_ERROR, error.message);
  //   }
  // }

    private async checkQuota(ownerId: string, newFileSize: number): Promise<void> {
    const { usedBytes, limitBytes } = await this.getUsage(ownerId);
    const available = limitBytes - usedBytes;

    if (newFileSize > available) {
      const limitMb = Math.round(limitBytes / 1024 / 1024);
      const usedMb = Math.round(usedBytes / 1024 / 1024);
      throw new PayloadTooLargeException(`Storage quota exceeded. Limit: ${limitMb}MB, Used: ${usedMb}MB`);
    }
    }
  
  
    private generatePublicUrl(file: MediaFile): string {
    if (file.access === FileAccess.PUBLIC) {
      return `${this.endpointPublic}/${this.bucket}/${file.key}`;
    }
    return `/api/media/${file.id}/download`;
      }
  
  
    async getUsage(ownerId: string,): Promise<StorageUsageDto> {
      const user = await this.prisma.user.findUnique({
      where:{id: ownerId}
      });
      const limitBytes = STORAGE_QUOTAS[user.plan]

      const result = await this.prisma.mediaFile.aggregate({
        where: {
        ownerId: ownerId
        },
        _sum: {
          size: true
        }
      })

      const usedBytes = result._sum.size || 0;

    const percentage = limitBytes > 0 ? Math.round((usedBytes / limitBytes) * 100) : 100;

    return {
      usedBytes,
      limitBytes,
      percentage: Math.min(percentage, 100),
    };
  }


    private async ensureBucketExists() {
    try {
      await this.s3.send(new HeadBucketCommand({ Bucket: this.bucket }));
    } catch (error: any) { // eslint-disable-line
      if (error.$metadata?.httpStatusCode === 404) {
        this.logger.log(`Bucket "${this.bucket}" not found. Creating...`);
        await this.s3.send(new CreateBucketCommand({ Bucket: this.bucket }));

        const policy = {
          Version: "2012-10-17",
          Statement: [
            {
              Sid: "PublicRead",
              Effect: "Allow",
              Principal: "*",
              Action: ["s3:GetObject"],
              Resource: [`arn:aws:s3:::${this.bucket}/*`],
            },
          ],
        };
        await this.s3.send(
          new PutBucketPolicyCommand({
            Bucket: this.bucket,
            Policy: JSON.stringify(policy),
          }),
        );
      }
    }
  }
}
