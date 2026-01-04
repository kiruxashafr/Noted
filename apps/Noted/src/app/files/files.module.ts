import { Module } from "@nestjs/common";
import { FilesService } from "./files.service";
import { MinioModule } from "../minio/minio.module";

@Module({
  imports: [MinioModule],
  providers: [FilesService],
  exports: [FilesService],
})
export class FilesModule {}
