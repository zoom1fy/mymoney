import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { CategoryService } from './category.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { createPrismaDbMock } from '../prisma/fluent-mock';

describe('CategoryService', () => {
  const userId = 'user-uuid-1';
  const categoryId = 1;
  const parentId = 2;

  let service: CategoryService;
  let dbMock: ReturnType<typeof createPrismaDbMock>;

  beforeEach(async () => {
    dbMock = createPrismaDbMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [CategoryService, { provide: PrismaService, useValue: { db: dbMock.db } }],
    }).compile();

    service = module.get<CategoryService>(CategoryService);
  });

  describe('create()', () => {
    it('should create category with all fields', async () => {
      const dto = {
        name: 'Groceries',
        icon: 'shopping',
        color: '#AA00AA',
        isExpense: true,
        currencyCode: 'RUB' as const,
        parentId: null,
      } as unknown as CreateCategoryDto;
      const created = {
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
      dbMock.orm.Category.create.mockResolvedValueOnce(created);

      const result = await service.create(userId, dto);

      expect(dbMock.orm.Category.where).toHaveBeenCalled();
      expect(dbMock.orm.Category.create).toHaveBeenCalled();
      expect(result).toEqual(created);
    });

    it('should default icon to "default" if not provided', async () => {
      const dto = {
        name: 'Utilities',
        color: '#000000',
        isExpense: true,
        currencyCode: 'RUB' as const,
        parentId: null,
      } as unknown as CreateCategoryDto;
      dbMock.orm.Category.create.mockResolvedValueOnce({ id: 6, ...dto });

      await service.create(userId, dto);
      const data = dbMock.orm.Category.create.mock.calls[0][0];
      expect(data.icon).toBe('default');
    });

    it('should default color to "" if not provided', async () => {
      const dto = {
        name: 'Transport',
        isExpense: false,
        currencyCode: 'RUB' as const,
      } as unknown as CreateCategoryDto;
      dbMock.orm.Category.create.mockResolvedValueOnce({ id: 7, ...dto });

      await service.create(userId, dto);
      const data = dbMock.orm.Category.create.mock.calls[0][0];
      expect(data.color).toBe('');
    });

    it('should throw BadRequestException if category with same name exists (isArchived: false)', async () => {
      const dto = {
        name: 'Groceries',
        isExpense: true,
        currencyCode: 'RUB' as const,
      } as unknown as CreateCategoryDto;
      dbMock.orm.Category.first.mockResolvedValueOnce({ id: 99, isArchived: false });
      await expect(service.create(userId, dto)).rejects.toBeInstanceOf(BadRequestException);
    });

    it('should throw BadRequestException if parent category not found', async () => {
      const dto = {
        name: 'New Sub',
        parentId,
        isExpense: true,
        currencyCode: 'RUB' as const,
      } as unknown as CreateCategoryDto;
      await expect(service.create(userId, dto)).rejects.toBeInstanceOf(BadRequestException);
    });

    it('should throw BadRequestException if parent category is archived', async () => {
      const dto = {
        name: 'Child',
        parentId,
        isExpense: true,
        currencyCode: 'RUB' as const,
      } as unknown as CreateCategoryDto;
      dbMock.orm.Category.first.mockResolvedValueOnce({ id: parentId, isArchived: true });
      await expect(service.create(userId, dto)).rejects.toBeInstanceOf(BadRequestException);
    });

    it('should allow creating subcategory with valid parent', async () => {
      const dto = {
        name: 'Sub',
        parentId,
        isExpense: true,
        currencyCode: 'RUB' as const,
      } as unknown as CreateCategoryDto;
      const parent = { id: parentId, isArchived: false };
      const created = {
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
      dbMock.orm.Category.first.mockResolvedValueOnce(null); // no duplicate name
      dbMock.orm.Category.first.mockResolvedValueOnce(parent);
      dbMock.orm.Category.create.mockResolvedValueOnce(created);

      const result = await service.create(userId, dto);
      expect(result).toEqual(created);
      const data = dbMock.orm.Category.create.mock.calls[0][0];
      expect(data.parentId).toBe(parentId);
    });
  });

  describe('findAll()', () => {
    it('returns non-archived categories ordered by createdAt asc', async () => {
      const list = [
        { id: 1, name: 'Alpha', isArchived: false, userId, createdAt: new Date('2020-01-01') },
        { id: 2, name: 'Beta', isArchived: false, userId, createdAt: new Date('2020-01-02') },
      ];
      dbMock.orm.Category.all.mockResolvedValueOnce(list);
      const res = await service.findAll(userId);
      expect(dbMock.orm.Category.where).toHaveBeenCalledWith({ userId, isArchived: false });
      expect(res).toEqual(list);
    });
  });

  describe('findOne()', () => {
    it('returns category by id and userId', async () => {
      const found = { id: categoryId, name: 'Food', userId };
      dbMock.orm.Category.first.mockResolvedValueOnce(found);
      const res = await service.findOne(userId, categoryId);
      expect(res).toEqual(found);
    });

    it('throws NotFoundException if not found', async () => {
      await expect(service.findOne(userId, categoryId)).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('update()', () => {
    it('updates category fields', async () => {
      const current = { id: categoryId, name: 'Old', userId, isArchived: false, parentId: 2 };
      const dto = {
        name: 'New Name',
        color: '#123456',
        parentId: 3,
      } as unknown as UpdateCategoryDto;
      dbMock.orm.Category.first
        .mockResolvedValueOnce(current)
        .mockResolvedValueOnce(null) // no duplicate name
        .mockResolvedValueOnce({ id: 3, isArchived: false }); // new parent lookup
      dbMock.orm.Category.update.mockResolvedValueOnce({ ...current, ...dto });

      const res = await service.update(userId, categoryId, dto);
      expect(res!.name).toBe('New Name');
    });

    it('throws BadRequestException if category is archived', async () => {
      const current = { id: categoryId, name: 'Old', userId, isArchived: true, parentId: 2 };
      dbMock.orm.Category.first.mockResolvedValueOnce(current);
      await expect(service.update(userId, categoryId, { name: 'Anything' })).rejects.toBeInstanceOf(
        BadRequestException
      );
    });

    it('throws BadRequestException if new name conflicts with another active category', async () => {
      const current = { id: categoryId, name: 'Old', userId, isArchived: false, parentId: 2 };
      dbMock.orm.Category.first
        .mockResolvedValueOnce(current)
        .mockResolvedValueOnce({ id: 999, name: 'Conflicting', isArchived: false });
      await expect(
        service.update(userId, categoryId, { name: 'Conflicting' })
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('skips name check if name unchanged', async () => {
      const current = { id: categoryId, name: 'Old', userId, isArchived: false, parentId: 2 };
      dbMock.orm.Category.first.mockResolvedValueOnce(current);
      dbMock.orm.Category.update.mockResolvedValueOnce({ ...current, name: 'Old' });
      const res = await service.update(userId, categoryId, { name: 'Old' });
      expect(res).toBeDefined();
    });

    it('throws BadRequestException if new parent not found', async () => {
      const current = { id: categoryId, name: 'Old', userId, isArchived: false, parentId: 2 };
      dbMock.orm.Category.first.mockResolvedValueOnce(current);
      await expect(service.update(userId, categoryId, { parentId: 99 })).rejects.toBeInstanceOf(
        BadRequestException
      );
    });

    it('throws BadRequestException if new parent is archived', async () => {
      const current = { id: categoryId, name: 'Old', userId, isArchived: false, parentId: 2 };
      dbMock.orm.Category.first
        .mockResolvedValueOnce(current)
        .mockResolvedValueOnce({ id: 99, isArchived: true });
      await expect(service.update(userId, categoryId, { parentId: 99 })).rejects.toBeInstanceOf(
        BadRequestException
      );
    });

    it('skips parent check if parentId unchanged', async () => {
      const current = { id: categoryId, name: 'Old', userId, isArchived: false, parentId: 2 };
      dbMock.orm.Category.first.mockResolvedValueOnce(current);
      dbMock.orm.Category.update.mockResolvedValueOnce({ ...current, name: 'Old' });
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
      dbMock.orm.Category.first.mockResolvedValueOnce(current);
      dbMock.orm.Category.update.mockResolvedValue({ isArchived: true });
      const res = await service.remove(userId, categoryId);
      expect(dbMock.orm.Category.update).toHaveBeenCalledWith({ isArchived: true });
      expect(dbMock.orm.Category.update).toHaveBeenCalledTimes(2);
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
      dbMock.orm.Category.first.mockResolvedValueOnce(current);
      const res = await service.remove(userId, categoryId);
      expect(res).toEqual(current);
      expect(dbMock.orm.Category.update).not.toHaveBeenCalled();
    });
  });

  describe('getArchived()', () => {
    it('returns archived categories ordered by createdAt asc', async () => {
      const archived = [
        { id: 9, name: 'Old', isArchived: true, userId, createdAt: new Date('2020-01-01') },
        { id: 10, name: 'Older', isArchived: true, userId, createdAt: new Date('2020-01-02') },
      ];
      dbMock.orm.Category.all.mockResolvedValueOnce(archived);
      const res = await service.getArchived(userId);
      expect(dbMock.orm.Category.where).toHaveBeenCalledWith({ userId, isArchived: true });
      expect(res).toEqual(archived);
    });
  });

  describe('unarchive()', () => {
    it('unarchives category and all its children', async () => {
      const current = { id: categoryId, name: 'Cat', userId, isArchived: true, parentId: 2 };
      const parent = { id: current.parentId, isArchived: false };
      const unarchived = { ...current, isArchived: false };
      dbMock.orm.Category.first
        .mockResolvedValueOnce(current) // by id
        .mockResolvedValueOnce(parent) // parent readiness
        .mockResolvedValueOnce(unarchived); // final findOne return
      dbMock.orm.Category.update.mockResolvedValueOnce(unarchived);
      const res = await service.unarchive(userId, categoryId);
      expect(dbMock.orm.Category.update).toHaveBeenCalledWith({ isArchived: false });
      expect(dbMock.orm.Category.update).toHaveBeenCalledTimes(2);
      expect(res).toEqual(unarchived);
    });

    it('throws BadRequestException if parent is still archived', async () => {
      const current = { id: categoryId, name: 'Cat', userId, isArchived: true, parentId: 2 };
      const parent = { id: 2, isArchived: true };
      dbMock.orm.Category.first.mockResolvedValueOnce(current).mockResolvedValueOnce(parent);
      await expect(service.unarchive(userId, categoryId)).rejects.toBeInstanceOf(
        BadRequestException
      );
    });

    it('returns category as-is if not archived', async () => {
      const current = { id: categoryId, name: 'Cat', userId, isArchived: false, parentId: 2 };
      dbMock.orm.Category.first.mockResolvedValueOnce(current);
      const res = await service.unarchive(userId, categoryId);
      expect(res).toEqual(current);
    });

    it('throws BadRequestException if parent not found for child category', async () => {
      const current = { id: categoryId, name: 'Cat', userId, isArchived: true, parentId: 99 };
      dbMock.orm.Category.first.mockResolvedValueOnce(current);
      await expect(service.unarchive(userId, categoryId)).rejects.toBeInstanceOf(
        BadRequestException
      );
    });
  });
});
