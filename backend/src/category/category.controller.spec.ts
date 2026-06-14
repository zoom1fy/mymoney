import { Test, TestingModule } from '@nestjs/testing';
import { CategoryController } from './category.controller';
import { CategoryService } from './category.service';
import { User } from '@prisma/client';

describe('CategoryController', () => {
  let controller: CategoryController;
  let mockCategoryService: any;

  const mockUser = { id: 'user-uuid-1' } as User;

  beforeEach(async () => {
    mockCategoryService = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
      getArchived: jest.fn(),
      unarchive: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CategoryController],
      providers: [{ provide: CategoryService, useValue: mockCategoryService }],
    }).compile();

    controller = module.get<CategoryController>(CategoryController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create()', () => {
    it('should call categoryService.create with user id and dto', async () => {
      const dto = { name: 'Groceries', isExpense: true, currencyCode: 'RUB' as any };
      const expected = { id: 1, name: 'Groceries' };
      mockCategoryService.create.mockResolvedValue(expected);

      const result = await controller.create(mockUser, dto);

      expect(mockCategoryService.create).toHaveBeenCalledWith(mockUser.id, dto);
      expect(result).toEqual(expected);
    });
  });

  describe('findAll()', () => {
    it('should call categoryService.findAll with user id', async () => {
      const expected = [{ id: 1, name: 'Food' }];
      mockCategoryService.findAll.mockResolvedValue(expected);

      const result = await controller.findAll(mockUser);

      expect(mockCategoryService.findAll).toHaveBeenCalledWith(mockUser.id);
      expect(result).toEqual(expected);
    });
  });

  describe('findOne()', () => {
    it('should call categoryService.findOne with user id and numeric id', async () => {
      const expected = { id: 1, name: 'Food' };
      mockCategoryService.findOne.mockResolvedValue(expected);

      const result = await controller.findOne(mockUser, '1');

      expect(mockCategoryService.findOne).toHaveBeenCalledWith(mockUser.id, 1);
      expect(result).toEqual(expected);
    });
  });

  describe('update()', () => {
    it('should call categoryService.update with user id, numeric id, and dto', async () => {
      const dto = { name: 'Updated' };
      const expected = { id: 1, name: 'Updated' };
      mockCategoryService.update.mockResolvedValue(expected);

      const result = await controller.update(mockUser, '1', dto);

      expect(mockCategoryService.update).toHaveBeenCalledWith(mockUser.id, 1, dto);
      expect(result).toEqual(expected);
    });
  });

  describe('remove()', () => {
    it('should call categoryService.remove with user id and numeric id', async () => {
      const expected = { success: true };
      mockCategoryService.remove.mockResolvedValue(expected);

      const result = await controller.remove(mockUser, '1');

      expect(mockCategoryService.remove).toHaveBeenCalledWith(mockUser.id, 1);
      expect(result).toEqual(expected);
    });
  });

  describe('getArchived()', () => {
    it('should call categoryService.getArchived with user id', async () => {
      const expected = [{ id: 9, name: 'Old', isArchived: true }];
      mockCategoryService.getArchived.mockResolvedValue(expected);

      const result = await controller.getArchived(mockUser);

      expect(mockCategoryService.getArchived).toHaveBeenCalledWith(mockUser.id);
      expect(result).toEqual(expected);
    });
  });

  describe('unarchive()', () => {
    it('should call categoryService.unarchive with user id and numeric id', async () => {
      const expected = { id: 1, isArchived: false };
      mockCategoryService.unarchive.mockResolvedValue(expected);

      const result = await controller.unarchive(mockUser, '1');

      expect(mockCategoryService.unarchive).toHaveBeenCalledWith(mockUser.id, 1);
      expect(result).toEqual(expected);
    });
  });
});
