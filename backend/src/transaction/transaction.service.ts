import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { CurrencyService } from '../currency/currency.service';
import { TransactionType } from './enums/transaction-type.enum';
import { GetTransactionsDto } from './dto/get-transactions.dto';

@Injectable()
export class TransactionService {
  constructor(
    private prisma: PrismaService,
    private currencyService: CurrencyService
  ) {}

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

      case TransactionType.TRANSFER:
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

      default:
        throw new BadRequestException(`Неизвестный тип транзакции: ${type}`);
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

  // --- Вспомогательные методы для findAll ---

  private buildDateFilter(from?: string, to?: string) {
    if (!from && !to) return undefined;

    const dateFilter: any = {};
    if (from) dateFilter.gte = new Date(from);
    if (to) dateFilter.lte = new Date(to);

    return dateFilter;
  }

  private buildWhereClause(userId: string, query: GetTransactionsDto) {
    const { accountId, type, from, to } = query;
    const where: any = { userId };

    if (accountId) where.accountId = accountId;
    if (type) where.type = type;

    const dateFilter = this.buildDateFilter(from, to);
    if (dateFilter) where.transactionDate = dateFilter;

    return where;
  }

  private async applyPagination<T>(
    queryBuilder: Promise<T[]>,
    take: number,
    cursor?: number
  ): Promise<{ data: T[]; nextCursor: number | null }> {
    const results = await queryBuilder;
    let nextCursor: number | null = null;

    if (results.length > take) {
      const nextItem = results.pop();
      nextCursor = (nextItem as any).id;
    }

    return { data: results, nextCursor };
  }

  // --- Основной метод findAll ---
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

    if (transaction.type === TransactionType.INCOME) {
      // Откат дохода → вычесть деньги
      updates.push(
        this.prisma.account.update({
          where: { id: transaction.accountId },
          data: { currentBalance: { decrement: amount } },
        })
      );
    } else if (transaction.type === TransactionType.EXPENSE) {
      // Откат расхода → вернуть деньги
      updates.push(
        this.prisma.account.update({
          where: { id: transaction.accountId },
          data: { currentBalance: { increment: amount } },
        })
      );
    } else if (transaction.type === TransactionType.TRANSFER) {
      // Откат перевода → вернуть деньги на исходный счёт, списать с целевого
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

    // Удаление самой транзакции
    updates.push(this.prisma.transaction.delete({ where: { id } }));

    return this.prisma.$transaction(updates);
  }

  async update(userId: string, id: number, dto: UpdateTransactionDto) {
    const transaction = await this.prisma.transaction.findFirst({
      where: { id, account: { userId } },
      include: { account: true },
    });

    if (!transaction) throw new NotFoundException('Транзакция не найдена');

    const updates: any[] = [];

    const oldAmount = Number(transaction.amount);
    const newAmount = dto.amount !== undefined ? Number(dto.amount) : oldAmount;
    const oldType = transaction.type;
    const newType = dto.type ?? oldType;

    // 1. Откат старой транзакции
    if (oldType === TransactionType.INCOME) {
      updates.push(
        this.prisma.account.update({
          where: { id: transaction.accountId },
          data: { currentBalance: { decrement: oldAmount } },
        })
      );
    } else if (oldType === TransactionType.EXPENSE) {
      updates.push(
        this.prisma.account.update({
          where: { id: transaction.accountId },
          data: { currentBalance: { increment: oldAmount } },
        })
      );
    } else if (oldType === TransactionType.TRANSFER) {
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

    // 2. Применение новой транзакции
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

    // 3. Обновляем запись транзакции
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
