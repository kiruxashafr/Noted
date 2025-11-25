import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/users.dto';
import { UsersPipe } from '../conception/users/users.pipe';
import { UsersGuard } from '../conception/users/users.guard';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Get('quest')
  @UseGuards(UsersGuard)
  findDataForQuest(@Query('pageNumber', UsersPipe) pageNumber?: number) {
    // console.log(pageNumber);

    return this.usersService.findDataForQuest();
  }

  @Post()
  create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }
}
