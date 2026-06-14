import { Test, TestingModule } from '@nestjs/testing';
import { AccountController } from './account.controller';
import { AccountService } from './account.service';
import { User } from '@prisma/client';

describe('AccountController', () => {
  let controller: AccountController;
  let mockAccountService: any;

  const mockUser = { id: 'user-uuid-1' } as User;

  beforeEach(async () => {
    mockAccountService = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AccountController],
      providers: [{ provide: AccountService, useValue: mockAccountService }],
    }).compile();

    controller = module.get<AccountController>(AccountController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create()', () => {
    it('should call accountService.create with user id and dto', async () => {
      const dto = { name: 'Savings', categoryId: 'bank' as any, typeId: 'bank' as any, currencyCode: 'RUB' as any };
      const expected = { id: 1, name: 'Savings' };
      mockAccountService.create.mockResolvedValue(expected);

      const result = await controller.create(mockUser, dto);

      expect(mockAccountService.create).toHaveBeenCalledWith(mockUser.id, dto);
      expect(result).toEqual(expected);
    });
  });

  describe('findAll()', () => {
    it('should call accountService.findAll with user id', async () => {
      const expected = [{ id: 1, name: 'A' }];
      mockAccountService.findAll.mockResolvedValue(expected);

      const result = await controller.findAll(mockUser);

      expect(mockAccountService.findAll).toHaveBeenCalledWith(mockUser.id);
      expect(result).toEqual(expected);
    });
  });

  describe('findOne()', () => {
    it('should call accountService.findOne with user id and numeric id', async () => {
      const expected = { id: 1, name: 'A' };
      mockAccountService.findOne.mockResolvedValue(expected);

      const result = await controller.findOne(mockUser, '1');

      expect(mockAccountService.findOne).toHaveBeenCalledWith(mockUser.id, 1);
      expect(result).toEqual(expected);
    });
  });

  describe('update()', () => {
    it('should call accountService.update with user id, numeric id, and dto', async () => {
      const dto = { name: 'Updated' };
      const expected = { id: 1, name: 'Updated' };
      mockAccountService.update.mockResolvedValue(expected);

      const result = await controller.update(mockUser, '1', dto);

      expect(mockAccountService.update).toHaveBeenCalledWith(mockUser.id, 1, dto);
      expect(result).toEqual(expected);
    });
  });

  describe('remove()', () => {
    it('should call accountService.remove with user id and numeric id', async () => {
      const expected = { success: true };
      mockAccountService.remove.mockResolvedValue(expected);

      const result = await controller.remove(mockUser, '1');

      expect(mockAccountService.remove).toHaveBeenCalledWith(mockUser.id, 1);
      expect(result).toEqual(expected);
    });
  });
});
