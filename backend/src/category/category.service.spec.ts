import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { CategoryService } from './category.service';
import { PrismaService } from '../prisma/prisma.service';

type Category = {
  id: number;
  name: string;
  icon?: string;
  color?: string;
  isArchived?: boolean;
  userId: string;
  parentId?: number | null;
  createdAt?: Date;
  updatedAt?: Date;
};

describe('CategoryService', () => {
  const userId = 'user-uuid-1';
  const categoryId = 1;
  const parentId = 2;

  const mockPrisma = {
    category: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
  };

  let service: CategoryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CategoryService, { provide: PrismaService, useValue: mockPrisma }],
    }).compile();

    service = module.get<CategoryService>(CategoryService);
    // Reset all mock implementations and calls
    Object.values(mockPrisma.category).forEach((mock) => {
      mock.mockReset();
    });
  });

  describe('create()', () => {
    it('should create category with all fields', async () => {
      const dto: any = {
        name: 'Groceries',
        icon: 'shopping',
        color: '#AA00AA',
        isExpense: true,
        currencyCode: 'RUB',
        parentId: null,
      };
      const created: Category = {
        id: 5,
        name: dto.name,
        icon: dto.icon,
        color: dto.color,
        isArchived: false,
        userId,
        parentId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockPrisma.category.findFirst.mockResolvedValue(null);
      mockPrisma.category.create.mockResolvedValue(created);

      const result = await service.create(userId, dto);

      expect(mockPrisma.category.findFirst).toHaveBeenCalled();
      expect(mockPrisma.category.create).toHaveBeenCalled();
      expect(result).toEqual(created);
    });

    it('should default icon to "default" if not provided', async () => {
      const dto: any = {
        name: 'Utilities',
        color: '#000000',
        isExpense: true,
        currencyCode: 'RUB',
        parentId: null,
      };
      const created: Category = {
        id: 6,
        name: dto.name,
        icon: 'default',
        color: dto.color,
        isArchived: false,
        userId,
        parentId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockPrisma.category.findFirst.mockResolvedValue(null);
      mockPrisma.category.create.mockResolvedValue(created);

      const result = await service.create(userId, dto);
      const data = mockPrisma.category.create.mock.calls[0][0].data;
      expect(data.icon).toBe('default');
      expect(result).toEqual(created);
    });

    it('should default color to "" if not provided', async () => {
      const dto: any = { name: 'Transport', isExpense: false, currencyCode: 'RUB' };
      const created: Category = {
        id: 7,
        name: dto.name,
        icon: 'default',
        color: '',
        isArchived: false,
        userId,
        parentId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockPrisma.category.findFirst.mockResolvedValue(null);
      mockPrisma.category.create.mockResolvedValue(created);

      const result = await service.create(userId, dto);
      const data = mockPrisma.category.create.mock.calls[0][0].data;
      expect(data.color).toBe('');
      expect(result).toEqual(created);
    });

    it('should throw BadRequestException if category with same name exists (isArchived: false)', async () => {
      const dto: any = { name: 'Groceries', isExpense: true, currencyCode: 'RUB' };
      mockPrisma.category.findFirst.mockResolvedValue({ id: 99, isArchived: false });
      await expect(service.create(userId, dto)).rejects.toBeInstanceOf(BadRequestException);
    });

    it('should throw BadRequestException if parent category not found', async () => {
      const dto: any = { name: 'New Sub', parentId, isExpense: true, currencyCode: 'RUB' };
      mockPrisma.category.findFirst.mockResolvedValueOnce(null);
      mockPrisma.category.findFirst.mockResolvedValueOnce(null);
      await expect(service.create(userId, dto)).rejects.toBeInstanceOf(BadRequestException);
    });

    it('should throw BadRequestException if parent category is archived', async () => {
      const dto: any = { name: 'Child', parentId, isExpense: true, currencyCode: 'RUB' };
      mockPrisma.category.findFirst.mockResolvedValueOnce(null);
      mockPrisma.category.findFirst.mockResolvedValueOnce({ id: parentId, isArchived: true });
      await expect(service.create(userId, dto)).rejects.toBeInstanceOf(BadRequestException);
    });

    it('should allow creating subcategory with valid parent', async () => {
      const dto: any = { name: 'Sub', parentId, isExpense: true, currencyCode: 'RUB' };
      const parent = { id: parentId, isArchived: false };
      const created: Category = {
        id: 8,
        name: dto.name,
        parentId,
        userId,
        isArchived: false,
        icon: 'default',
        color: '',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockPrisma.category.findFirst.mockResolvedValueOnce(null);
      mockPrisma.category.findFirst.mockResolvedValueOnce(parent);
      mockPrisma.category.create.mockResolvedValueOnce(created);

      const result = await service.create(userId, dto);
      expect(result).toEqual(created);
      const data = mockPrisma.category.create.mock.calls[0][0].data;
      expect(data.parentId).toBe(parentId);
    });
  });

  describe('findAll()', () => {
    it('returns non-archived categories ordered by createdAt asc', async () => {
      const list = [
        { id: 1, name: 'Alpha', isArchived: false, userId, createdAt: new Date('2020-01-01') },
        { id: 2, name: 'Beta', isArchived: false, userId, createdAt: new Date('2020-01-02') },
      ];
      mockPrisma.category.findMany.mockResolvedValue(list);
      const res = await service.findAll(userId);
      expect(mockPrisma.category.findMany).toHaveBeenCalledWith({
        where: { isArchived: false, userId },
        orderBy: { createdAt: 'asc' },
      });
      expect(res).toEqual(list);
    });
  });

  describe('findOne()', () => {
    it('returns category by id and userId', async () => {
      const found = { id: categoryId, name: 'Food', userId };
      mockPrisma.category.findFirst.mockResolvedValue(found);
      const res = await service.findOne(userId, categoryId);
      expect(res).toEqual(found);
    });

    it('throws NotFoundException if not found', async () => {
      mockPrisma.category.findFirst.mockResolvedValue(null);
      await expect(service.findOne(userId, categoryId)).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('update()', () => {
    it('updates category fields', async () => {
      const current = { id: categoryId, name: 'Old', userId, isArchived: false, parentId: 2 };
      const dto: any = { name: 'New Name', color: '#123456', parentId: 3 };
      mockPrisma.category.findFirst.mockResolvedValueOnce(current).mockResolvedValueOnce(null);
      mockPrisma.category.findFirst.mockResolvedValueOnce({ id: 3, isArchived: false });
      mockPrisma.category.update.mockResolvedValueOnce({ ...current, ...dto });

      const res = await service.update(userId, categoryId, dto);
      expect(res.name).toBe('New Name');
    });

    it('throws BadRequestException if category is archived', async () => {
      const current = { id: categoryId, name: 'Old', userId, isArchived: true, parentId: 2 };
      mockPrisma.category.findFirst.mockResolvedValueOnce(current);
      await expect(service.update(userId, categoryId, { name: 'Anything' })).rejects.toBeInstanceOf(
        BadRequestException
      );
    });

    it('throws BadRequestException if new name conflicts with another active category', async () => {
      const current = { id: categoryId, name: 'Old', userId, isArchived: false, parentId: 2 };
      mockPrisma.category.findFirst
        .mockResolvedValueOnce(current)
        .mockResolvedValueOnce({ id: 999, isArchived: false });
      await expect(
        service.update(userId, categoryId, { name: 'Conflicting' })
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('skips name check if name unchanged', async () => {
      const current = { id: categoryId, name: 'Old', userId, isArchived: false, parentId: 2 };
      mockPrisma.category.findFirst.mockResolvedValueOnce(current).mockResolvedValueOnce(null);
      mockPrisma.category.update.mockResolvedValueOnce({ ...current, name: 'Old' });
      const res = await service.update(userId, categoryId, { name: 'Old' });
      expect(res).toBeDefined();
    });

    it('throws BadRequestException if new parent not found', async () => {
      const current = { id: categoryId, name: 'Old', userId, isArchived: false, parentId: 2 };
      mockPrisma.category.findFirst.mockResolvedValueOnce(current).mockResolvedValueOnce(null);
      await expect(service.update(userId, categoryId, { parentId: 99 })).rejects.toBeInstanceOf(
        BadRequestException
      );
    });

    it('throws BadRequestException if new parent is archived', async () => {
      const current = { id: categoryId, name: 'Old', userId, isArchived: false, parentId: 2 };
      mockPrisma.category.findFirst
        .mockResolvedValueOnce(current)
        .mockResolvedValueOnce({ id: 99, isArchived: true });
      await expect(service.update(userId, categoryId, { parentId: 99 })).rejects.toBeInstanceOf(
        BadRequestException
      );
    });

    it('skips parent check if parentId unchanged', async () => {
      const current = { id: categoryId, name: 'Old', userId, isArchived: false, parentId: 2 };
      mockPrisma.category.findFirst.mockResolvedValueOnce(current);
      mockPrisma.category.update.mockResolvedValueOnce({ ...current, name: 'Old' });
      const res = await service.update(userId, categoryId, { name: 'Old', parentId: 2 });
      expect(res).toBeDefined();
    });
  });

  describe('remove()', () => {
    it('archives category and all its children', async () => {
      const current = {
        id: categoryId,
        name: 'ToRemove',
        userId,
        isArchived: false,
        parentId: null,
      };
      mockPrisma.category.findFirst.mockResolvedValueOnce(current);
      mockPrisma.category.update.mockResolvedValueOnce({ ...current, isArchived: true });
      mockPrisma.category.updateMany.mockResolvedValueOnce({ count: 2 });
      const res = await service.remove(userId, categoryId);
      expect(mockPrisma.category.update).toHaveBeenCalledWith({
        where: { id: categoryId },
        data: { isArchived: true },
      });
      expect(mockPrisma.category.updateMany).toHaveBeenCalledWith({
        where: { parentId: categoryId },
        data: { isArchived: true },
      });
      expect(res).toEqual({ success: true });
    });

    it('returns category as-is if already archived', async () => {
      const current = {
        id: categoryId,
        name: 'Archived',
        userId,
        isArchived: true,
        parentId: null,
      };
      mockPrisma.category.findFirst.mockResolvedValueOnce(current);
      const res = await service.remove(userId, categoryId);
      expect(res).toEqual(current);
      expect(mockPrisma.category.update).not.toHaveBeenCalled();
      expect(mockPrisma.category.updateMany).not.toHaveBeenCalled();
    });
  });

  describe('getArchived()', () => {
    it('returns archived categories ordered by createdAt asc', async () => {
      const archived = [
        { id: 9, name: 'Old', isArchived: true, userId, createdAt: new Date('2020-01-01') },
        { id: 10, name: 'Older', isArchived: true, userId, createdAt: new Date('2020-01-02') },
      ];
      mockPrisma.category.findMany.mockResolvedValue(archived);
      const res = await service.getArchived(userId);
      expect(mockPrisma.category.findMany).toHaveBeenCalledWith({
        where: { isArchived: true, userId },
        orderBy: { createdAt: 'asc' },
      });
      expect(res).toEqual(archived);
    });
  });

  describe('unarchive()', () => {
    it('unarchives category and all its children', async () => {
      const current = { id: categoryId, name: 'Cat', userId, isArchived: true, parentId: 2 };
      const parent = { id: current.parentId, isArchived: false };
      const unarchived = { ...current, isArchived: false };
      mockPrisma.category.findFirst
        .mockResolvedValueOnce(current) // by id
        .mockResolvedValueOnce(parent) // parent readiness
        .mockResolvedValueOnce(unarchived); // final findOne return
      mockPrisma.category.update.mockResolvedValueOnce(unarchived);
      mockPrisma.category.updateMany.mockResolvedValueOnce({ count: 2 });
      const res = await service.unarchive(userId, categoryId);
      expect(mockPrisma.category.update).toHaveBeenCalledWith({
        where: { id: categoryId },
        data: { isArchived: false },
      });
      expect(mockPrisma.category.updateMany).toHaveBeenCalledWith({
        where: { parentId: categoryId },
        data: { isArchived: false },
      });
      expect(res).toEqual({ id: categoryId, name: 'Cat', isArchived: false, userId, parentId: 2 });
    });

    it('throws BadRequestException if parent is still archived', async () => {
      const current = { id: categoryId, name: 'Cat', userId, isArchived: true, parentId: 2 };
      const parent = { id: 2, isArchived: true };
      mockPrisma.category.findFirst.mockResolvedValueOnce(current).mockResolvedValueOnce(parent);
      await expect(service.unarchive(userId, categoryId)).rejects.toBeInstanceOf(
        BadRequestException
      );
    });

    it('returns category as-is if not archived', async () => {
      const current = { id: categoryId, name: 'Cat', userId, isArchived: false, parentId: 2 };
      mockPrisma.category.findFirst.mockResolvedValueOnce(current);
      const res = await service.unarchive(userId, categoryId);
      expect(res).toEqual(current);
    });

    it('throws BadRequestException if parent not found for child category', async () => {
      const current = { id: categoryId, name: 'Cat', userId, isArchived: true, parentId: 99 };
      mockPrisma.category.findFirst.mockResolvedValueOnce(current).mockResolvedValueOnce(null);
      await expect(service.unarchive(userId, categoryId)).rejects.toBeInstanceOf(
        BadRequestException
      );
    });
  });
});
