import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from '../auth/auth.service';
import * as bcrypt from 'bcryptjs';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService, private authService: AuthService) {}

  async create(dto: CreateUserDto) {
    const hashedPassword = await bcrypt.hash(dto.password, 12);
    const user = await this.prisma.user.create({
      data: { name: dto.name, email: dto.email, phone: dto.phone, hashedPassword },
      select: { id: true, name: true, email: true, phone: true, role: true, createdAt: true },
    });
    const token = this.authService.signToken({ id: user.id, email: user.email, role: user.role });
    return { ...user, access_token: token, token_type: 'bearer' };
  }
}
