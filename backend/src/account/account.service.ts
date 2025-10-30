import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';
import { PrismaService } from '../prisma/prisma.service';
import Decimal from 'decimal.js';

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

    console.log('DTO:', dto);
    console.log('currentBalance:', dto.currentBalance, 'Type:', typeof dto.currentBalance);

    const balance =
      dto.currentBalance !== undefined && !isNaN(dto.currentBalance)
        ? new Decimal(dto.currentBalance)
        : new Decimal(0);

    return this.prisma.account.create({
      data: {
        userId,
        name: dto.name,
        icon: dto.icon ?? 'default',
        categoryId: dto.categoryId,
        typeId: dto.typeId,
        currencyCode: dto.currencyCode,
        currentBalance: balance,
      },
    });
  }

  async findAll(userId: string) {
    const accounts = await this.prisma.account.findMany({
      where: { userId, isDeleted: false }, // 🟢 только активные
      orderBy: { createdAt: 'desc' },
    });

    return accounts.map((account) => ({
      ...account,
      currentBalance: Number(account.currentBalance),
    }));
  }

  async findOne(userId: string, id: number) {
    const account = await this.prisma.account.findFirst({
      where: { id, userId },
    });

    if (!account) throw new NotFoundException('Счёт не найден');

    return {
      ...account,
      currentBalance: Number(account.currentBalance), // Convert Decimal to number
    };
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

    const updateData: any = { ...dto };
    if (dto.currentBalance !== undefined) {
      updateData.currentBalance = new Decimal(dto.currentBalance);
    }

    return this.prisma.account.update({
      where: { id },
      data: updateData,
    });
  }

  async remove(userId: string, id: number) {
    await this.findOne(userId, id); // проверка доступа

    return this.prisma.account.update({
      where: { id },
      data: { isDeleted: true },
    });
  }
}
