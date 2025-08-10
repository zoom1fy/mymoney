import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { CurrencyService } from '../currency/currency.service';
import { TransactionType } from './enums/transaction-type.enum';

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
          transactionDate: new Date(),
          type,
        },
      })
    );

    return this.prisma.$transaction(updates);
  }

  async findAll(userId: string) {
    const transaction = await this.prisma.transaction.findMany({
      where: {
        account: { userId },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!transaction) throw new NotFoundException('Транзакции не найдены');

    return transaction;
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
          transactionDate: new Date(),
        },
      })
    );

    return this.prisma.$transaction(updates);
  }
}
