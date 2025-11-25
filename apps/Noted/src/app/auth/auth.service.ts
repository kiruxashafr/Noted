import { ConflictException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { RegisterRequest } from './dto/register.dto';
import bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
    constructor(private readonly prisma: PrismaService) {}

    async register(dto: RegisterRequest) {
        const { name, email, password } = dto;

        const existUser = await this.prisma.user.findUnique({
            where: { email },
        });

        if (existUser) {
            throw new ConflictException('Пользователь с таким email уже существует');
        }

        const user = await this.prisma.user.create({
            data: {
                name,
                email,
                password: await bcrypt.hash(password, 10),
            },
        });

        return user;
}
}