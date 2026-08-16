import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CategoryService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateCategoryDto) {
    const hasExisting = await this.prisma.db.orm.public.Category.where({
      userId,
      name: dto.name,
      isArchived: false,
    }).first();

    if (hasExisting) {
      throw new BadRequestException('Категория с таким именем уже существует');
    }

    // Prevent assigning an archived parent
    if (dto.parentId) {
      const parent = await this.prisma.db.orm.public.Category.where({
        id: dto.parentId,
        userId,
      }).first();

      if (!parent) throw new BadRequestException('Родительская категория не найдена');

      if (parent.isArchived)
        throw new BadRequestException('Нельзя создавать подкатегорию внутри архивной категории');
    }

    return this.prisma.db.orm.public.Category.create({
      userId,
      name: dto.name,
      icon: dto.icon ?? 'default',
      currencyCode: dto.currencyCode,
      isExpense: dto.isExpense,
      parentId: dto.parentId ?? null,
      color: dto.color ?? '',
    });
  }

  // Return only active (non-archived) categories so the UI doesn't show deleted ones
  async findAll(userId: string) {
    return this.prisma.db.orm.public.Category.where({
      userId,
      isArchived: false,
    })
      .orderBy((c) => c.createdAt.asc())
      .all();
  }

  async findOne(userId: string, id: number) {
    const category = await this.prisma.db.orm.public.Category.where({ id, userId }).first();

    if (!category) throw new NotFoundException('Категория не найдена');
    return category;
  }

  async update(userId: string, id: number, dto: UpdateCategoryDto) {
    const category = await this.findOne(userId, id);

    if (category.isArchived) {
      throw new BadRequestException('Нельзя редактировать архивную категорию');
    }

    if (dto.name && dto.name !== category.name) {
      const hasExisting = await this.prisma.db.orm.public.Category.where({
        userId,
        name: dto.name,
        isArchived: false,
      })
        .where((c) => c.id.neq(id))
        .first();

      if (hasExisting) {
        throw new BadRequestException('Другая активная категория с таким именем уже существует');
      }
    }

    // Validate the new parent only if it actually changed — skip redundant DB checks
    if (dto.parentId && dto.parentId !== category.parentId) {
      const parent = await this.prisma.db.orm.public.Category.where({
        id: dto.parentId,
        userId,
      }).first();

      if (!parent) throw new BadRequestException('Родительская категория не найдена');

      if (parent.isArchived)
        throw new BadRequestException('Нельзя перенести категорию под архивную');
    }

    const data: {
      name?: string;
      icon?: string;
      currencyCode?: string;
      color?: string;
      isExpense?: boolean;
      parentId?: number;
    } = {};

    if (dto.name !== undefined) data.name = dto.name;
    if (dto.icon !== undefined) data.icon = dto.icon;
    if (dto.currencyCode !== undefined) data.currencyCode = dto.currencyCode;
    if (dto.color !== undefined) data.color = dto.color;
    if (dto.isExpense !== undefined) data.isExpense = dto.isExpense;
    if (dto.parentId !== undefined) data.parentId = dto.parentId;

    return this.prisma.db.orm.public.Category.where({ id }).update(data);
  }

  async remove(userId: string, id: number) {
    const category = await this.findOne(userId, id);

    if (category.isArchived) {
      return category; // already archived
    }

    // Archive the category and all children
    await this.prisma.db.orm.public.Category.where({ id }).update({ isArchived: true });
    await this.prisma.db.orm.public.Category.where({ parentId: id }).update({ isArchived: true });

    return { success: true };
  }

  async getArchived(userId: string) {
    return this.prisma.db.orm.public.Category.where({
      userId,
      isArchived: true,
    })
      .orderBy((c) => c.createdAt.asc())
      .all();
  }

  async unarchive(userId: string, id: number) {
    const category = await this.findOne(userId, id);

    if (!category.isArchived) {
      return category; // already active
    }

    // Prevent unarchiving under an archived parent — child can't exist without a valid parent
    if (category.parentId) {
      const parent = await this.prisma.db.orm.public.Category.where({
        id: category.parentId,
        userId,
      }).first();

      if (!parent) {
        throw new BadRequestException('Родительская категория не найдена');
      }

      if (parent.isArchived) {
        throw new BadRequestException(
          'Нельзя разархивировать категорию, пока её родитель в архиве'
        );
      }
    }

    // Unarchive the category first, then all its children
    await this.prisma.db.orm.public.Category.where({ id }).update({ isArchived: false });
    await this.prisma.db.orm.public.Category.where({ parentId: id }).update({
      isArchived: false,
    });

    return this.findOne(userId, id);
  }
}
