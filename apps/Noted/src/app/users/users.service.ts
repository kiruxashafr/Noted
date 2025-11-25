import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateUserDto } from './dto/users.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.user.findMany();
  }

  findDataForQuest() {
    return this.prisma.user.findMany();
  }

  create(dto: CreateUserDto) {
    return this.prisma.user.create({
      data: dto,
    });
  }
}
