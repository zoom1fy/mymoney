import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CategoryService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateCategoryDto) {
    const hasExisting = await this.prisma.category.findFirst({
      where: {
        userId,
        name: dto.name,
        isArchived: false,
      },
    });

    if (hasExisting) {
      throw new BadRequestException('Категория с таким именем уже существует');
    }

    // Prevent assigning an archived parent
    if (dto.parentId) {
      const parent = await this.prisma.category.findFirst({
        where: { id: dto.parentId, userId },
      });

      if (!parent) throw new BadRequestException('Родительская категория не найдена');

      if (parent.isArchived)
        throw new BadRequestException('Нельзя создавать подкатегорию внутри архивной категории');
    }

    return this.prisma.category.create({
      data: {
        userId,
        name: dto.name,
        icon: dto.icon ?? 'default',
        currencyCode: dto.currencyCode,
        isExpense: dto.isExpense,
        parentId: dto.parentId ?? null,
        color: dto.color ?? '',
      },
    });
  }

  // Return only active (non-archived) categories so the UI doesn't show deleted ones
  async findAll(userId: string) {
    return this.prisma.category.findMany({
      where: {
        userId,
        isArchived: false,
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findOne(userId: string, id: number) {
    const category = await this.prisma.category.findFirst({
      where: {
        id: { equals: id },
        userId,
      },
    });

    if (!category) throw new NotFoundException('Категория не найдена');
    return category;
  }

  async update(userId: string, id: number, dto: UpdateCategoryDto) {
    const category = await this.findOne(userId, id);

    if (category.isArchived) {
      throw new BadRequestException('Нельзя редактировать архивную категорию');
    }

    if (dto.name && dto.name !== category.name) {
      const hasExisting = await this.prisma.category.findFirst({
        where: {
          userId,
          name: dto.name,
          isArchived: false,
          NOT: { id },
        },
      });

      if (hasExisting) {
        throw new BadRequestException('Другая активная категория с таким именем уже существует');
      }
    }

    // Validate the new parent only if it actually changed — skip redundant DB checks
    if (dto.parentId && dto.parentId !== category.parentId) {
      const parent = await this.prisma.category.findFirst({
        where: { id: dto.parentId, userId },
      });

      if (!parent) throw new BadRequestException('Родительская категория не найдена');

      if (parent.isArchived)
        throw new BadRequestException('Нельзя перенести категорию под архивную');
    }

    return this.prisma.category.update({
      where: { id },
      data: { ...dto },
    });
  }

  async remove(userId: string, id: number) {
    const category = await this.findOne(userId, id);

    if (category.isArchived) {
      return category; // already archived
    }

    // Archive the category and all children
    await this.prisma.category.update({
      where: { id },
      data: { isArchived: true },
    });

    await this.prisma.category.updateMany({
      where: { parentId: id },
      data: { isArchived: true },
    });

    return { success: true };
  }

  async getArchived(userId: string) {
    return this.prisma.category.findMany({
      where: {
        userId,
        isArchived: true,
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async unarchive(userId: string, id: number) {
    const category = await this.findOne(userId, id);

    if (!category.isArchived) {
      return category; // already active
    }

    // Prevent unarchiving under an archived parent — child can't exist without a valid parent
    if (category.parentId) {
      const parent = await this.prisma.category.findFirst({
        where: { id: category.parentId, userId },
      });

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
    await this.prisma.category.update({
      where: { id },
      data: { isArchived: false },
    });

    // Always keep children in sync — archived parent with active children breaks the hierarchy
    await this.prisma.category.updateMany({
      where: {
        parentId: id,
      },
      data: {
        isArchived: false,
      },
    });

    return this.findOne(userId, id);
  }
}
