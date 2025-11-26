import { Body, Controller, HttpCode, HttpStatus, Post, Res, UsePipes, ValidationPipe } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterRequest } from './dto/register.dto';
import { LoginRequest } from './dto/login.dto';
import  type { Response } from 'express';


@Controller('auth')
@UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
export class AuthController {
    constructor(private readonly authService: AuthService) {}


    @Post('register')
    @HttpCode(HttpStatus.CREATED)
    async register(@Res({ passthrough: true  }) res: Response, @Body() dto: RegisterRequest) {
        return await this.authService.register(res, dto);
    }


    @Post('login')
    @HttpCode(HttpStatus.OK)
    async login(@Res({ passthrough: true  }) res: Response, @Body() dto: LoginRequest) {
        return await this.authService.login(res, dto);
    }
}