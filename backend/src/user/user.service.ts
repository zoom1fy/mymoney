import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthDto } from '../auth/dto/auth.dto';
import { hash } from 'argon2';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      include: {
        accounts: true,
        categories: true,
        transactions: true,
      },
    });
  }

  getByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async create(dto: AuthDto) {
    const user = {
      email: dto.email,
      passwordHash: await hash(dto.password),
      lastLogin: new Date(),
    };

    return this.prisma.user.create({ data: user });
  }
}
