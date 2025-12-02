import { IsNotEmpty, MaxLength, IsString, IsEmail, MinLength } from "class-validator";

export class RegisterRequest {
    @IsString({message: 'Имя должно быть строкой'})
    @IsNotEmpty({message: 'Имя не должно быть пустым'})
    @MaxLength(50, {message: 'Имя не должно превышать 50 символов'})
    name: string;

    @IsString({message: 'Email должен быть строкой'})
    @IsNotEmpty({message: 'Почта обязательна для заполнения'})
    @IsEmail({}, {message: 'Некорректный формат email'})
    email: string;

    @IsString({message: 'Пароль должен быть строкой'})
    @IsNotEmpty({message: 'Пароль не должен быть пустым'})
    @MinLength(6, {message: 'Пароль должен быть не менее 6 символов'})
    @MaxLength(64, {message: 'Пароль не должен превышать 32 символа'})
    password: string;
}