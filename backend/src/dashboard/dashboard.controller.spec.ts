import { Test, TestingModule } from '@nestjs/testing';
import { DashboardController } from './dashboard.controller';
import { UserService } from '../user/user.service';
import { AccountService } from '../account/account.service';
import { CategoryService } from '../category/category.service';
import { TransactionService } from '../transaction/transaction.service';
import { TransactionType } from '../transaction/enums/transaction-type.enum';

describe('DashboardController', () => {
  let controller: DashboardController;
  let mockUserService: any;
  let mockAccountService: any;
  let mockCategoryService: any;
  let mockTransactionService: any;

  const mockUser = { id: 'user-uuid-1' } as any;

  beforeEach(async () => {
    mockUserService = {
      getProfile: jest.fn(),
    };
    mockAccountService = {
      findAll: jest.fn(),
    };
    mockCategoryService = {
      findAll: jest.fn(),
      getArchived: jest.fn(),
    };
    mockTransactionService = {
      getSummary: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [DashboardController],
      providers: [
        { provide: UserService, useValue: mockUserService },
        { provide: AccountService, useValue: mockAccountService },
        { provide: CategoryService, useValue: mockCategoryService },
        { provide: TransactionService, useValue: mockTransactionService },
      ],
    }).compile();

    controller = module.get<DashboardController>(DashboardController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getDashboard()', () => {
    it('should return dashboard data with accounts in original currency', async () => {
      const profile = { id: 'user-uuid-1', email: 'test@test.com' };
      const accounts = [
        { id: 1, name: 'Cash', currencyCode: 'USD', currentBalance: 100, currencySymbol: '$' },
        { id: 2, name: 'Card', currencyCode: 'RUB', currentBalance: 5000, currencySymbol: '₽' },
      ];
      const categories = [{ id: 1, name: 'Food', isExpense: true }];
      const archivedCategories = [];
      const expenseSummary = [
        { categoryId: 1, categoryName: 'Food', categoryColor: '#ff0000', totalAmount: 45000 },
      ];
      const incomeSummary = [];

      mockUserService.getProfile.mockResolvedValue(profile);
      mockAccountService.findAll.mockResolvedValue(accounts);
      mockCategoryService.findAll.mockResolvedValue(categories);
      mockCategoryService.getArchived.mockResolvedValue(archivedCategories);
      // Stub returns different data depending on transaction type.
      mockTransactionService.getSummary.mockImplementation((_userId: string, query: any) => {
        if (query.type === TransactionType.EXPENSE) return Promise.resolve(expenseSummary);
        return Promise.resolve(incomeSummary);
      });

      const result = await controller.getDashboard(mockUser, '2024-01-01', '2024-01-31');

      expect(result.profile).toEqual(profile);
      expect(result.accounts).toEqual(accounts);
      expect(result.accounts[0].currencyCode).toBe('USD');
      expect(result.accounts[0].currentBalance).toBe(100);
      expect(result.categories).toEqual(categories);
      expect(result.archivedCategories).toEqual(archivedCategories);
      expect(result.expenseSummary).toEqual(expenseSummary);
      expect(result.incomeSummary).toEqual(incomeSummary);
    });

    it('should pass from/to to transactionService.getSummary', async () => {
      mockUserService.getProfile.mockResolvedValue({});
      mockAccountService.findAll.mockResolvedValue([]);
      mockCategoryService.findAll.mockResolvedValue([]);
      mockCategoryService.getArchived.mockResolvedValue([]);
      mockTransactionService.getSummary.mockResolvedValue([]);

      await controller.getDashboard(mockUser, '2024-06-01', '2024-06-30');

      expect(mockTransactionService.getSummary).toHaveBeenCalledWith(mockUser.id, {
        type: TransactionType.EXPENSE,
        from: '2024-06-01',
        to: '2024-06-30',
      });
      expect(mockTransactionService.getSummary).toHaveBeenCalledWith(mockUser.id, {
        type: TransactionType.INCOME,
        from: '2024-06-01',
        to: '2024-06-30',
      });
    });
  });
});
