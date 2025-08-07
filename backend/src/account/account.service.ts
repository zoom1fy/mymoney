import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AccountService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateAccountDto) {
    const exists = await this.prisma.account.findFirst({
      where: {
        userId,
        name: dto.name,
      },
    });

    if (exists) {
      throw new BadRequestException('Счёт с таким именем уже существует');
    }

    return this.prisma.account.create({
      data: {
        userId,
        name: dto.name,
        icon: dto.icon ?? 'default',
        categoryId: dto.categoryId,
        typeId: dto.typeId,
        currencyCode: dto.currencyCode,
      },
    });
  }

  async findAll(userId: string) {
    return this.prisma.account.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(userId: string, id: number) {
    const account = await this.prisma.account.findFirst({
      where: { id, userId },
    });

    if (!account) throw new NotFoundException('Счёт не найден');

    return account;
  }

  async update(userId: string, id: number, dto: UpdateAccountDto) {
    const account = await this.findOne(userId, id); // проверка доступа

    if (dto.name && dto.name !== account.name) {
      const conflict = await this.prisma.account.findFirst({
        where: {
          userId,
          name: dto.name,
          NOT: { id },
        },
      });

      if (conflict) {
        throw new BadRequestException('Другой счёт с таким именем уже существует');
      }
    }

    return this.prisma.account.update({
      where: { id },
      data: { ...dto },
    });
  }

  async remove(userId: string, id: number) {
    await this.findOne(userId, id); // проверка доступа и существования

    return this.prisma.account.delete({ where: { id } });
  }
}
