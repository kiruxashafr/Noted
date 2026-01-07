import { ConfigService } from "@nestjs/config";

export class MediaUtils {
  private readonly endpointPublic: string;
  private readonly bucket: string;

  constructor(private readonly config: ConfigService) {
    this.bucket = this.config.getOrThrow<string>("STORAGE_BUCKET_NAME");
    this.endpointPublic = this.config.getOrThrow<string>("STORAGE_ENDPOINT_PUBLIC");
  }
}
