import { IsEmail, IsNumber, IsString } from 'class-validator';

export class CreateUserDto {
  @IsString({
    message: 'Имя не строка!',
  })
  name: string;

  @IsEmail()
  email: string;
}

export type UpdateUserDto = Partial<CreateUserDto>;
