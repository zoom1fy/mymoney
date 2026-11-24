import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';
import { PrismaService } from '../prisma/prisma.service';
import { money } from '../prisma/money';
import { ExchangeRateService } from '../currency/exchange-rate.service';

@Injectable()
export class AccountService {
  constructor(
    private prisma: PrismaService,
    private exchangeRateService: ExchangeRateService
  ) {}

  async create(userId: string, dto: CreateAccountDto) {
    const hasExisting = await this.prisma.db.orm.public.Account.where({
      userId,
      name: dto.name,
      isDeleted: false,
    }).first();

    if (hasExisting) {
      throw new BadRequestException('Счёт с таким именем уже существует');
    }

    const currentBalance =
      dto.currentBalance !== undefined && !Number.isNaN(dto.currentBalance)
        ? money(dto.currentBalance)
        : '0';

    const account = await this.prisma.db.orm.public.Account.include('currency').create({
      userId,
      name: dto.name,
      icon: dto.icon ?? 'default',
      categoryId: dto.categoryId,
      typeId: dto.typeId,
      currencyCode: dto.currencyCode,
      currentBalance,
      isDeleted: false,
    });

    const { currency, ...rest } = account;
    return {
      ...rest,
      currencySymbol: currency.symbol,
      currentBalance: Number(rest.currentBalance),
    };
  }

  async findAll(userId: string) {
    const accounts = await this.prisma.db.orm.public.Account.where({
      userId,
      isDeleted: false,
    })
      .include('currency')
      .orderBy((a) => a.createdAt.asc())
      .all();

    return accounts.map(({ currency, ...account }) => ({
      ...account,
      currencySymbol: currency.symbol,
      currentBalance: Number(account.currentBalance),
    }));
  }

  async getCategoryTotals(userId: string) {
    const accounts = await this.prisma.db.orm.public.Account.where({
      userId,
      isDeleted: false,
    }).all();

    if (accounts.length === 0) return [];

    const currencies = [...new Set(accounts.map((account) => account.currencyCode))];
    const rateMap = await this.exchangeRateService.getRatesToBaseCurrency(currencies);

    const totals = new Map<number, number>();

    for (const account of accounts) {
      // Unknown currencies fall back to 1 so the total stays visible
      const rate = rateMap.get(account.currencyCode) ?? 1;
      const balance = Number(account.currentBalance) * rate;
      totals.set(account.categoryId, (totals.get(account.categoryId) ?? 0) + balance);
    }

    return [...totals.entries()]
      .map(([categoryId, total]) => ({
        categoryId,
        totalAmount: Math.round(total * 100) / 100,
      }))
      .sort((a, b) => a.categoryId - b.categoryId);
  }

  async findOne(userId: string, id: number) {
    const account = await this.prisma.db.orm.public.Account.where({ id, userId })
      .include('currency')
      .first();

    if (!account) throw new NotFoundException('Счёт не найден');

    const { currency, ...rest } = account;
    return {
      ...rest,
      currencySymbol: currency.symbol,
      currentBalance: Number(rest.currentBalance),
    };
  }

  async update(userId: string, id: number, dto: UpdateAccountDto) {
    const account = await this.findOne(userId, id);

    if (dto.name && dto.name !== String((account as { name?: unknown }).name)) {
      const hasConflict = await this.prisma.db.orm.public.Account.where({
        userId,
        name: dto.name,
        isDeleted: false,
      })
        .where((a) => a.id.neq(id))
        .first();

      if (hasConflict) {
        throw new BadRequestException('Другой счёт с таким именем уже существует');
      }
    }

    const data: {
      name?: string;
      icon?: string;
      categoryId?: number;
      typeId?: number;
      currencyCode?: string;
      currentBalance?: string;
    } = {};

    if (dto.name !== undefined) data.name = dto.name;
    if (dto.icon !== undefined) data.icon = dto.icon;
    if (dto.categoryId !== undefined) data.categoryId = dto.categoryId;
    if (dto.typeId !== undefined) data.typeId = dto.typeId;
    if (dto.currencyCode !== undefined) data.currencyCode = dto.currencyCode;
    if (dto.currentBalance !== undefined) data.currentBalance = money(dto.currentBalance);

    await this.prisma.db.orm.public.Account.where({ id }).update(data);

    return this.findOne(userId, id);
  }

  async remove(userId: string, id: number) {
    await this.findOne(userId, id);

    return this.prisma.db.orm.public.Account.where({ id }).update({ isDeleted: true });
  }
}
