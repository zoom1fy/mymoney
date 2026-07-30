import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';
import { PrismaService } from '../prisma/prisma.service';
import Decimal from 'decimal.js';

@Injectable()
export class AccountService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateAccountDto) {
    const hasExisting = await this.prisma.account.findFirst({
      where: {
        userId,
        name: dto.name,
        isDeleted: false,
      },
    });

    if (hasExisting) {
      throw new BadRequestException('Счёт с таким именем уже существует');
    }

    const balance =
      dto.currentBalance !== undefined && !isNaN(dto.currentBalance)
        ? new Decimal(dto.currentBalance)
        : new Decimal(0);

    const account = await this.prisma.account.create({
      data: {
        userId,
        name: dto.name,
        icon: dto.icon ?? 'default',
        categoryId: dto.categoryId,
        typeId: dto.typeId,
        currencyCode: dto.currencyCode,
        currentBalance: balance,
        isDeleted: false,
      },
      include: { currency: true },
    });

    const { currency, ...rest } = account;
    return {
      ...rest,
      currencySymbol: currency.symbol,
      currentBalance: Number(rest.currentBalance),
    };
  }

  async findAll(userId: string) {
    const accounts = await this.prisma.account.findMany({
      where: { userId, isDeleted: false },
      include: { currency: true },
      orderBy: { createdAt: 'asc' },
    });

    return accounts.map(({ currency, ...account }) => ({
      ...account,
      currencySymbol: currency.symbol,
      currentBalance: Number(account.currentBalance),
    }));
  }

  async findOne(userId: string, id: number) {
    const account = await this.prisma.account.findFirst({
      where: { id, userId },
      include: { currency: true },
    });

    if (!account) throw new NotFoundException('Счёт не найден');

    const { currency, ...rest } = account;
    return {
      ...rest,
      currencySymbol: currency.symbol,
      currentBalance: Number(rest.currentBalance),
    };
  }

  async update(userId: string, id: number, dto: UpdateAccountDto) {
    // Verify the account exists before allowing any update.
    const account = await this.findOne(userId, id);

    if (dto.name && dto.name !== account.name) {
      const hasConflict = await this.prisma.account.findFirst({
        where: {
          userId,
          name: dto.name,
          isDeleted: false,
          NOT: { id },
        },
      });

      if (hasConflict) {
        throw new BadRequestException('Другой счёт с таким именем уже существует');
      }
    }

    const updated = await this.prisma.account.update({
      where: { id },
      data: {
        ...dto,
        currentBalance:
          dto.currentBalance !== undefined ? new Decimal(dto.currentBalance) : undefined,
      },
      include: { currency: true },
    });

    const { currency, ...rest } = updated;
    return {
      ...rest,
      currencySymbol: currency.symbol,
      currentBalance: Number(rest.currentBalance),
    };
  }

  async remove(userId: string, id: number) {
    // Confirm the account exists before soft-deleting it.
    await this.findOne(userId, id);

    return this.prisma.account.update({
      where: { id },
      data: { isDeleted: true },
    });
  }
}
