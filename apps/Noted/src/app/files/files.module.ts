import { Module } from "@nestjs/common";
import { FilesService } from "./files.service";
import { MediaUtils } from "./utils/media.utils";

@Module({
  imports: [],
  providers: [FilesService],
  exports: [FilesService, MediaUtils],
})
export class FilesModule {}
