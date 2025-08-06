import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CategoryService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateCategoryDto) {
    const existing = await this.prisma.category.findFirst({
      where: {
        userId,
        name: dto.name,
      },
    });

    if (existing) {
      throw new BadRequestException('Категория с таким именем уже существует');
    }

    return this.prisma.category.create({
      data: {
        userId,
        name: dto.name,
        icon: dto.icon ?? 'default',
        currencyCode: dto.currencyCode,
        isExpense: dto.isExpense,
        parentId: dto.parentId ?? null,
      },
    });
  }

  async findAll(userId: string) {
    return this.prisma.category.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(userId: string, id: number) {
    const category = await this.prisma.category.findFirst({
      where: { id, userId },
    });

    if (!category) throw new NotFoundException('Категория не найдена');

    return category;
  }

  async update(userId: string, id: number, dto: UpdateCategoryDto) {
    const category = await this.findOne(userId, id); // проверка доступа и существования

    if (dto.name && dto.name !== category.name) {
      const exists = await this.prisma.category.findFirst({
        where: {
          userId,
          name: dto.name,
          NOT: { id }, // исключаем текущую категорию
        },
      });

      if (exists) {
        throw new BadRequestException('Другая категория с таким именем уже существует');
      }
    }

    return this.prisma.category.update({
      where: { id },
      data: { ...dto },
    });
  }

  async remove(userId: string, id: number) {
    await this.findOne(userId, id); // проверка доступа и существования

    return this.prisma.category.delete({ where: { id } });
  }
}
