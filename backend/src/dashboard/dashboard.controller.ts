import { Controller, Get, Query } from '@nestjs/common';
import { Auth } from '../auth/decorators/auth.decorator';
import { CurrentUser } from '../auth/decorators/user.decorator';
import { User } from '@prisma/client';
import { UserService } from '../user/user.service';
import { AccountService } from '../account/account.service';
import { CategoryService } from '../category/category.service';
import { TransactionService } from '../transaction/transaction.service';
import { TransactionType } from '../transaction/enums/transaction-type.enum';

@Auth()
@Controller('dashboard')
export class DashboardController {
  constructor(
    private readonly userService: UserService,
    private readonly accountService: AccountService,
    private readonly categoryService: CategoryService,
    private readonly transactionService: TransactionService,
  ) {}

  @Get()
  async getDashboard(
    @CurrentUser() user: User,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const [profile, accounts, categories, archivedCategories, expenseSummary, incomeSummary] =
      await Promise.all([
        this.userService.getProfile(user.id),
        this.accountService.findAll(user.id),
        this.categoryService.findAll(user.id),
        this.categoryService.getArchived(user.id),
        this.transactionService.getSummary(user.id, {
          type: TransactionType.EXPENSE,
          from,
          to,
        }),
        this.transactionService.getSummary(user.id, {
          type: TransactionType.INCOME,
          from,
          to,
        }),
      ]);

    // accounts remain in their original currency; only summary/conversion uses RUB
    return {
      profile,
      accounts,
      categories,
      archivedCategories,
      expenseSummary,
      incomeSummary,
    };
  }
}
