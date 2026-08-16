import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { DbTransactionContext } from '../prisma/db';
import { money } from '../prisma/money';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { ExchangeRateService } from '../currency/exchange-rate.service';
import { TransactionType } from './enums/transaction-type.enum';
import { GetTransactionsDto } from './dto/get-transactions.dto';
import { GetTransactionSummaryDto } from './dto/get-transaction-summary.dto';

@Injectable()
export class TransactionService {
  constructor(
    private prisma: PrismaService,
    private exchangeRateService: ExchangeRateService
  ) {}

  // Applies a signed delta to an account balance inside the active transaction.
  private async adjustBalance(tx: DbTransactionContext, accountId: number, delta: number) {
    const account = await tx.orm.public.Account.where({ id: accountId }).first();
    if (!account) {
      throw new NotFoundException('Аккаунт не найден');
    }
    await tx.orm.public.Account.where({ id: accountId }).update({
      currentBalance: money(Number(account.currentBalance) + delta),
    });
  }

  // Runs balance updates + transaction creation inside a single transaction
  // to prevent partial updates if any step fails (e.g., debit without credit).
  async create(userId: string, dto: CreateTransactionDto) {
    const { accountId, categoryId, targetAccountId, amount, currencyCode, description, type } = dto;

    const account = await this.prisma.db.orm.public.Account.where({
      id: accountId,
      userId,
    }).first();
    if (!account) throw new NotFoundException('Аккаунт не найден');

    const category =
      categoryId !== undefined
        ? await this.prisma.db.orm.public.Category.where({ id: categoryId, userId }).first()
        : null;
    if (type !== TransactionType.TRANSFER) {
      if (categoryId === undefined) {
        throw new BadRequestException('categoryId обязателен для данного типа транзакции');
      }

      if (!category) {
        throw new NotFoundException('Категория не найдена');
      }
    }

    const value = Number(amount);
    if (!value || value <= 0) {
      throw new BadRequestException('Сумма должна быть положительным числом');
    }

    return this.prisma.db.transaction(async (tx) => {
      switch (type) {
        case TransactionType.INCOME:
          await this.adjustBalance(tx, accountId, value);
          break;

        case TransactionType.EXPENSE:
          await this.adjustBalance(tx, accountId, -value);
          break;

        case TransactionType.TRANSFER: {
          if (!targetAccountId) {
            throw new BadRequestException('Для перевода нужен целевой аккаунт');
          }

          const targetAccount = await tx.orm.public.Account.where({
            id: targetAccountId,
            userId,
          }).first();
          if (!targetAccount) {
            throw new NotFoundException('Целевой аккаунт не найден');
          }

          await this.adjustBalance(tx, accountId, -value);
          await this.adjustBalance(tx, targetAccountId, value);
          break;
        }

        default:
          throw new BadRequestException(`Неизвестный тип транзакции: ${String(type)}`);
      }

      return tx.orm.public.Transaction.create({
        userId,
        accountId,
        targetAccountId: targetAccountId ?? null,
        categoryId: categoryId ?? null,
        amount: money(value),
        currencyCode,
        description: description ?? null,
        transactionDate: dto.transactionDate ? new Date(dto.transactionDate) : new Date(),
        type,
      });
    });
  }

  // Fetches take+1 items so we can detect the next page without an extra count query.
  // If results exceed take, the extra item becomes nextCursor; it is removed from data.
  private applyPagination<T extends { id: number }>(
    results: T[],
    take: number
  ): { data: T[]; nextCursor: number | null } {
    let nextCursor: number | null = null;

    if (results.length > take) {
      const nextItem = results.pop();
      nextCursor = nextItem?.id ?? null;
    }

    return { data: results, nextCursor };
  }

  async findAll(userId: string, query: GetTransactionsDto) {
    const take = Number(query.take ?? 20);
    const cursor = query.cursor ? Number(query.cursor) : undefined;
    const { accountId, type, from, to } = query;

    let chain = this.prisma.db.orm.public.Transaction.where({ userId });
    if (accountId) chain = chain.where({ accountId });
    if (type) chain = chain.where({ type });
    if (from) chain = chain.where((t) => t.transactionDate.gte(new Date(from)));
    if (to) chain = chain.where((t) => t.transactionDate.lte(new Date(to)));

    const results = await chain
      .orderBy([(t) => t.transactionDate.desc(), (t) => t.id.desc()])
      .skip(cursor ? 1 : 0)
      .take(take + 1)
      .all();

    return this.applyPagination(results, take);
  }

  async getSummary(userId: string, query: GetTransactionSummaryDto) {
    const { type, from, to } = query;

    let chain = this.prisma.db.orm.public.Transaction.include('category', (c) =>
      c.select('id', 'name', 'color')
    ).where({ userId, type });
    if (from) chain = chain.where((t) => t.transactionDate.gte(new Date(from)));
    if (to) chain = chain.where((t) => t.transactionDate.lte(new Date(to)));

    const transactions = await chain.all();

    if (transactions.length === 0) return [];

    const currencies = [...new Set(transactions.map((t) => t.currencyCode))];
    const rateMap = await this.exchangeRateService.getRatesToRub(currencies);

    const rubTotals = new Map<number, { name: string; color: string | null; total: number }>();

    for (const transaction of transactions) {
      const amount = Number(transaction.amount);
      const rate = rateMap.get(transaction.currencyCode) ?? 1;
      const rubAmount = amount * rate;

      const categoryId = transaction.categoryId ?? 0;
      const existing = rubTotals.get(categoryId);
      if (existing) {
        existing.total += rubAmount;
      } else {
        rubTotals.set(categoryId, {
          name: transaction.category?.name ?? 'Без категории',
          color: transaction.category?.color ?? null,
          total: rubAmount,
        });
      }
    }

    return Array.from(rubTotals.entries())
      .map(([categoryId, { name, color, total }]) => ({
        categoryId: categoryId === 0 ? null : categoryId,
        categoryName: name,
        categoryColor: color,
        totalAmount: Math.round(total * 100) / 100,
      }))
      .sort((a, b) => b.totalAmount - a.totalAmount);
  }

  async findOne(userId: string, id: number) {
    const transaction = await this.prisma.db.orm.public.Transaction.where({ id })
      .where((t) => t.account.some((a) => a.userId.eq(userId)))
      .first();

    if (!transaction) throw new NotFoundException('Транзакция не найдена');

    return transaction;
  }

  async remove(userId: string, id: number) {
    const transaction = await this.prisma.db.orm.public.Transaction.where({ id })
      .where((t) => t.account.some((a) => a.userId.eq(userId)))
      .first();

    if (!transaction) throw new NotFoundException('Транзакция не найдена');

    const amount = Number(transaction.amount);

    await this.prisma.db.transaction(async (tx) => {
      if ((transaction.type as TransactionType) === TransactionType.INCOME) {
        // Revert income: deduct money
        await this.adjustBalance(tx, transaction.accountId, -amount);
      } else if ((transaction.type as TransactionType) === TransactionType.EXPENSE) {
        // Revert expense: refund money
        await this.adjustBalance(tx, transaction.accountId, amount);
      } else if ((transaction.type as TransactionType) === TransactionType.TRANSFER) {
        // Revert transfer: refund source, deduct from target
        await this.adjustBalance(tx, transaction.accountId, amount);
        if (transaction.targetAccountId) {
          await this.adjustBalance(tx, transaction.targetAccountId, -amount);
        }
      }

      await tx.orm.public.Transaction.where({ id }).delete();
    });
  }

  // Reverts the old transaction effect on balances, then applies the new one.
  // This supports changing amount, type, or account within a single operation.
  async update(userId: string, id: number, dto: UpdateTransactionDto) {
    const transaction = await this.prisma.db.orm.public.Transaction.where({ id })
      .where((t) => t.account.some((a) => a.userId.eq(userId)))
      .first();

    if (!transaction) throw new NotFoundException('Транзакция не найдена');

    const newAccountId = dto.accountId !== undefined ? dto.accountId : transaction.accountId;
    const newTargetAccountId =
      dto.targetAccountId !== undefined ? dto.targetAccountId : transaction.targetAccountId;
    const accountsToCheck: number[] = [];

    if (newAccountId !== null) accountsToCheck.push(newAccountId);
    if (newTargetAccountId !== null) accountsToCheck.push(newTargetAccountId);

    if (accountsToCheck.length > 0) {
      const accounts = await this.prisma.db.orm.public.Account.where({ userId })
        .where((a) => a.id.in(accountsToCheck))
        .all();

      const deletedAccount = accounts.find((acc) => acc.isDeleted);
      if (deletedAccount) {
        throw new BadRequestException('Нельзя обновить транзакцию: счёт удалён');
      }
    }

    const oldAmount = Number(transaction.amount);
    const newAmount = dto.amount !== undefined ? Number(dto.amount) : oldAmount;
    const newType = dto.type ?? transaction.type;
    const applyAccountId = dto.accountId ?? transaction.accountId;
    const targetAccountId = dto.targetAccountId ?? transaction.targetAccountId;

    await this.prisma.db.transaction(async (tx) => {
      // Reverse the original transaction's effect on balances to restore account state.
      if ((transaction.type as TransactionType) === TransactionType.INCOME) {
        await this.adjustBalance(tx, transaction.accountId, -oldAmount);
      } else if ((transaction.type as TransactionType) === TransactionType.EXPENSE) {
        await this.adjustBalance(tx, transaction.accountId, oldAmount);
      } else if ((transaction.type as TransactionType) === TransactionType.TRANSFER) {
        await this.adjustBalance(tx, transaction.accountId, oldAmount);
        if (transaction.targetAccountId) {
          await this.adjustBalance(tx, transaction.targetAccountId, -oldAmount);
        }
      }

      // Apply the updated transaction values (amount, type, account) to balances.
      if (newType === TransactionType.INCOME) {
        await this.adjustBalance(tx, applyAccountId, newAmount);
      } else if (newType === TransactionType.EXPENSE) {
        await this.adjustBalance(tx, applyAccountId, -newAmount);
      } else if (newType === TransactionType.TRANSFER) {
        await this.adjustBalance(tx, applyAccountId, -newAmount);
        if (targetAccountId) {
          await this.adjustBalance(tx, targetAccountId, newAmount);
        }
      }

      await tx.orm.public.Transaction.where({ id }).update({
        accountId: applyAccountId,
        targetAccountId,
        categoryId: dto.categoryId ?? transaction.categoryId,
        amount: money(newAmount),
        currencyCode: dto.currencyCode ?? transaction.currencyCode,
        description: dto.description !== undefined ? dto.description : transaction.description,
        type: newType,
        transactionDate: dto.transactionDate
          ? new Date(dto.transactionDate)
          : transaction.transactionDate,
      });
    });
  }
}
