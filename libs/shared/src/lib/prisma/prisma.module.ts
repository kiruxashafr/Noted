import { Module } from '@nestjs/common';
import { PrismaService } from '../../../../../apps/Noted/src/app/prisma.service';

@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}