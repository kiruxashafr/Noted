import { Body, Controller, HttpCode, HttpStatus, Post, UsePipes, ValidationPipe } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterRequest } from './dto/register.dto';


@Controller('auth')
@UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
export class AuthController {
    constructor(private readonly authService: AuthService) {}


    @Post('register')
    @HttpCode(HttpStatus.CREATED)
    async register(@Body() dto: RegisterRequest) {
        return await this.authService.register(dto);
    }
}