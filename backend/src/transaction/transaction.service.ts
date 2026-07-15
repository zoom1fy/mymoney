import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { CurrencyService } from '../currency/currency.service';
import { TransactionType } from '../transaction/enums/transaction-type.enum';
import { GetTransactionsDto } from './dto/get-transactions.dto';
import { GetTransactionSummaryDto } from './dto/get-transaction-summary.dto';

@Injectable()
export class TransactionService {
  constructor(
    private prisma: PrismaService,
    private currencyService: CurrencyService
  ) {}

  // Runs balance updates + transaction creation inside a single Prisma transaction
  // to prevent partial updates if any step fails (e.g., debit without credit).
  async create(userId: string, dto: CreateTransactionDto) {
    const { accountId, categoryId, targetAccountId, amount, currencyCode, description, type } = dto;

    const account = await this.prisma.account.findFirst({
      where: { id: accountId, userId },
    });
    if (!account) throw new NotFoundException('Аккаунт не найден');

    const category = await this.prisma.category.findFirst({
      where: { id: categoryId, userId },
    });
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

    const updates: any[] = [];

    switch (type) {
      case TransactionType.INCOME:
        updates.push(
          this.prisma.account.update({
            where: { id: accountId },
            data: { currentBalance: { increment: value } },
          })
        );
        break;

      case TransactionType.EXPENSE:
        updates.push(
          this.prisma.account.update({
            where: { id: accountId },
            data: { currentBalance: { decrement: value } },
          })
        );
        break;

      case TransactionType.TRANSFER: {
        if (!targetAccountId) {
          throw new BadRequestException('Для перевода нужен целевой аккаунт');
        }

        const targetAccount = await this.prisma.account.findFirst({
          where: { id: targetAccountId, userId },
        });
        if (!targetAccount) {
          throw new NotFoundException('Целевой аккаунт не найден');
        }

        updates.push(
          this.prisma.account.update({
            where: { id: accountId },
            data: { currentBalance: { decrement: value } },
          })
        );
        updates.push(
          this.prisma.account.update({
            where: { id: targetAccountId },
            data: { currentBalance: { increment: value } },
          })
        );
        break;
      }

      default:
        throw new BadRequestException(`Неизвестный тип транзакции: ${String(type)}`);
    }

    updates.push(
      this.prisma.transaction.create({
        data: {
          userId,
          accountId,
          targetAccountId: targetAccountId ?? null,
          categoryId,
          amount: value,
          currencyCode,
          description: description ?? null,
          transactionDate: dto.transactionDate ? new Date(dto.transactionDate) : new Date(),
          type,
        },
      })
    );

    return this.prisma.$transaction(updates);
  }

  private buildDateFilter(from?: string, to?: string): { gte?: Date; lte?: Date } | undefined {
    if (!from && !to) return undefined;

    const dateFilter: { gte?: Date; lte?: Date } = {};
    if (from) dateFilter.gte = new Date(from);
    if (to) dateFilter.lte = new Date(to);

    return dateFilter;
  }

  private buildWhereClause(userId: string, query: GetTransactionsDto) {
    const { accountId, type, from, to } = query;
    const where: {
      userId: string;
      accountId?: number;
      type?: TransactionType;
      transactionDate?: { gte?: Date; lte?: Date };
    } = { userId };

    if (accountId) where.accountId = accountId;
    if (type) where.type = type;

    const dateFilter = this.buildDateFilter(from, to);
    if (dateFilter) where.transactionDate = dateFilter;

    return where;
  }

  // Fetches take+1 items so we can detect the next page without an extra count query.
  // If results exceed take, the extra item becomes nextCursor; it is removed from data.
  private async applyPagination<T>(
    queryBuilder: Promise<T[]>,
    take: number,
    _cursor?: number // eslint-disable-line @typescript-eslint/no-unused-vars
  ): Promise<{ data: T[]; nextCursor: number | null }> {
    const results = await queryBuilder;
    let nextCursor: number | null = null;

    if (results.length > take) {
      const nextItem = results.pop();
      nextCursor = (nextItem as { id: number }).id;
    }

    return { data: results, nextCursor };
  }

  async findAll(userId: string, query: GetTransactionsDto) {
    const take = Number(query.take ?? 20);
    const cursor = query.cursor ? Number(query.cursor) : undefined;

    const where = this.buildWhereClause(userId, query);

    const transactionsQuery = this.prisma.transaction.findMany({
      take: take + 1,
      cursor: cursor ? { id: cursor } : undefined,
      skip: cursor ? 1 : 0,
      where,
      orderBy: [{ transactionDate: 'desc' }, { id: 'desc' }],
      select: {
        id: true,
        amount: true,
        type: true,
        description: true,
        transactionDate: true,
        currencyCode: true,
        accountId: true,
        categoryId: true,
      },
    });

    return this.applyPagination(transactionsQuery, take, cursor);
  }

  async getSummary(userId: string, query: GetTransactionSummaryDto) {
    const { type, from, to } = query;

    const conditions = [Prisma.sql`t.user_id = ${userId}`, Prisma.sql`t.type = ${type}`];
    if (from) conditions.push(Prisma.sql`t.transaction_date >= ${new Date(from)}`);
    if (to) conditions.push(Prisma.sql`t.transaction_date <= ${new Date(to)}`);

    const whereClause = Prisma.join(conditions, ' AND ');

    type RawRow = {
      categoryId: bigint | null;
      categoryName: string | null;
      categoryColor: string | null;
      totalAmount: string;
    };

    const rows = await this.prisma.$queryRaw<RawRow[]>(Prisma.sql`
      SELECT
        t.category_id AS categoryId,
        c.name AS categoryName,
        c.color AS categoryColor,
        CAST(SUM(t.amount) AS DECIMAL(15,2)) AS totalAmount
      FROM transactions t
      LEFT JOIN categories c ON c.id = t.category_id
      WHERE ${whereClause}
      GROUP BY t.category_id, c.name, c.color
      ORDER BY totalAmount DESC
    `);

    return rows.map(r => ({
      categoryId: r.categoryId === null ? null : Number(r.categoryId),
      categoryName: r.categoryName,
      categoryColor: r.categoryColor,
      totalAmount: Number(r.totalAmount),
    }));
  }

  async findOne(userId: string, id: number) {
    const transaction = await this.prisma.transaction.findFirst({
      where: {
        id,
        account: { userId },
      },
    });

    if (!transaction) throw new NotFoundException('Транзакция не найдена');

    return transaction;
  }

  async remove(userId: string, id: number) {
    const transaction = await this.prisma.transaction.findFirst({
      where: {
        id,
        account: { userId },
      },
      include: {
        account: true,
      },
    });

    if (!transaction) throw new NotFoundException('Транзакция не найдена');

    const amount = Number(transaction.amount);
    const updates: any[] = [];

    if (transaction.type === 'INCOME') {
      // Revert income: deduct money
      updates.push(
        this.prisma.account.update({
          where: { id: transaction.accountId },
          data: { currentBalance: { decrement: amount } },
        })
      );
    } else if (transaction.type === 'EXPENSE') {
      // Revert expense: refund money
      updates.push(
        this.prisma.account.update({
          where: { id: transaction.accountId },
          data: { currentBalance: { increment: amount } },
        })
      );
    } else if (transaction.type === 'TRANSFER') {
      // Revert transfer: refund source, deduct from target
      updates.push(
        this.prisma.account.update({
          where: { id: transaction.accountId },
          data: { currentBalance: { increment: amount } },
        })
      );
      if (transaction.targetAccountId) {
        updates.push(
          this.prisma.account.update({
            where: { id: transaction.targetAccountId },
            data: { currentBalance: { decrement: amount } },
          })
        );
      }
    }

    updates.push(this.prisma.transaction.delete({ where: { id } }));

    return this.prisma.$transaction(updates);
  }

  // Reverts the old transaction effect on balances, then applies the new one.
  // This supports changing amount, type, or account within a single operation.
  async update(userId: string, id: number, dto: UpdateTransactionDto) {
    const transaction = await this.prisma.transaction.findFirst({
      where: { id, account: { userId } },
      include: { account: true },
    });

    if (!transaction) throw new NotFoundException('Транзакция не найдена');

    const newAccountId = dto.accountId !== undefined ? dto.accountId : transaction.accountId;
    const newTargetAccountId =
      dto.targetAccountId !== undefined ? dto.targetAccountId : transaction.targetAccountId;
    const accountsToCheck: number[] = [];

    if (newAccountId !== null) accountsToCheck.push(newAccountId);
    if (newTargetAccountId !== null) accountsToCheck.push(newTargetAccountId);

    if (accountsToCheck.length > 0) {
      const accounts = await this.prisma.account.findMany({
        where: { id: { in: accountsToCheck }, userId },
        select: { id: true, isDeleted: true },
      });

      const hasDeleted = accounts.find((acc) => acc.isDeleted);
      if (hasDeleted) {
        throw new BadRequestException('Нельзя обновить транзакцию: счёт удалён');
      }
    }

    const updates: any[] = [];

    const oldAmount = Number(transaction.amount);
    const newAmount = dto.amount !== undefined ? Number(dto.amount) : oldAmount;
    const oldType = transaction.type;
    const newType = dto.type ?? oldType;

    // Reverse the original transaction's effect on balances to restore account state.
    if (oldType === 'INCOME') {
      updates.push(
        this.prisma.account.update({
          where: { id: transaction.accountId },
          data: { currentBalance: { decrement: oldAmount } },
        })
      );
    } else if (oldType === 'EXPENSE') {
      updates.push(
        this.prisma.account.update({
          where: { id: transaction.accountId },
          data: { currentBalance: { increment: oldAmount } },
        })
      );
    } else if (oldType === 'TRANSFER') {
      updates.push(
        this.prisma.account.update({
          where: { id: transaction.accountId },
          data: { currentBalance: { increment: oldAmount } },
        })
      );
      if (transaction.targetAccountId) {
        updates.push(
          this.prisma.account.update({
            where: { id: transaction.targetAccountId },
            data: { currentBalance: { decrement: oldAmount } },
          })
        );
      }
    }

    // Apply the updated transaction values (amount, type, account) to balances.
    const targetAccountId = dto.targetAccountId ?? transaction.targetAccountId;

    if (newType === TransactionType.INCOME) {
      updates.push(
        this.prisma.account.update({
          where: { id: dto.accountId ?? transaction.accountId },
          data: { currentBalance: { increment: newAmount } },
        })
      );
    } else if (newType === TransactionType.EXPENSE) {
      updates.push(
        this.prisma.account.update({
          where: { id: dto.accountId ?? transaction.accountId },
          data: { currentBalance: { decrement: newAmount } },
        })
      );
    } else if (newType === TransactionType.TRANSFER) {
      updates.push(
        this.prisma.account.update({
          where: { id: dto.accountId ?? transaction.accountId },
          data: { currentBalance: { decrement: newAmount } },
        })
      );
      if (targetAccountId) {
        updates.push(
          this.prisma.account.update({
            where: { id: targetAccountId },
            data: { currentBalance: { increment: newAmount } },
          })
        );
      }
    }

    // Persist the modified transaction record.
    updates.push(
      this.prisma.transaction.update({
        where: { id },
        data: {
          accountId: dto.accountId ?? transaction.accountId,
          targetAccountId,
          categoryId: dto.categoryId ?? transaction.categoryId,
          amount: newAmount,
          currencyCode: dto.currencyCode ?? transaction.currencyCode,
          description: dto.description ?? transaction.description,
          type: newType,
          transactionDate: dto.transactionDate
            ? new Date(dto.transactionDate)
            : transaction.transactionDate,
        },
      })
    );

    return this.prisma.$transaction(updates);
  }
}
