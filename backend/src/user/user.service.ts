import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthDto } from '../auth/dto/auth.dto';
import { UpdateProfileDto } from './dto/user.dto';
import { hash, verify } from 'argon2';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        accounts: true,
        categories: true,
        transactions: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }

    return user;
  }

  getByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async create(dto: AuthDto) {
    const user = {
      email: dto.email,
      passwordHash: await hash(dto.password),
      lastLogin: new Date(),
    };

    return this.prisma.user.create({ data: user });
  }

  async update(id: string, dto: Partial<AuthDto>) {
    const updateData: any = {};

    if (dto.password) {
      updateData.passwordHash = await hash(dto.password);
    }
    if (dto.email) {
      updateData.email = dto.email;
    }

    return this.prisma.user.update({
      where: { id },
      data: updateData,
    });
  }

  // Вспомогательный метод для получения имени из email
  private getNameFromEmail(email: string): string {
    return email.split('@')[0];
  }

  async getProfile(id: string) {
    const profile = await this.findById(id);
    const { passwordHash, ...safeProfile } = profile;

    // Добавляем вычисляемое поле name
    return {
      ...safeProfile,
      name: this.getNameFromEmail(profile.email),
    };
  }

  async updateProfile(id: string, dto: UpdateProfileDto) {
    const user = await this.findById(id);

    // Проверяем текущий пароль
    const isValidPassword = await verify(user.passwordHash, dto.currentPassword);
    if (!isValidPassword) {
      throw new BadRequestException('Неверный текущий пароль');
    }

    // Если обновляем email, проверяем уникальность
    if (dto.email && dto.email !== user.email) {
      const existingUser = await this.getByEmail(dto.email);
      if (existingUser) {
        throw new ConflictException('Email уже используется');
      }
    }

    const updateData: any = {};

    if (dto.email) {
      updateData.email = dto.email;
    }

    if (dto.password) {
      updateData.passwordHash = await hash(dto.password);
    }

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: updateData,
    });

    const { passwordHash, ...safeProfile } = updatedUser;

    // Возвращаем с вычисляемым именем
    return {
      ...safeProfile,
      name: this.getNameFromEmail(updatedUser.email),
    };
  }

  async deleteUser(id: string) {
    await this.findById(id);

    await this.prisma.user.delete({
      where: { id },
    });

    return { message: 'Пользователь успешно удалён' };
  }
}
