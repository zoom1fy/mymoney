import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ValidationPipe,
  UsePipes,
} from '@nestjs/common';
import { CategoryService } from './category.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CurrentUser } from '../auth/decorators/user.decorator';
import { User } from '@/../.prisma/client';
import { Auth } from '../auth/decorators/auth.decorator';

@Auth()
@Controller('category')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @UsePipes(new ValidationPipe())
  @Post()
  create(@CurrentUser() user: User, @Body() dto: CreateCategoryDto) {
    return this.categoryService.create(user.id, dto);
  }

  @Get()
  findAll(@CurrentUser() user: User) {
    return this.categoryService.findAll(user.id);
  }

  @Get(':id')
  findOne(@CurrentUser() user: User, @Param('id') id: string) {
    return this.categoryService.findOne(user.id, Number(id));
  }

  @UsePipes(new ValidationPipe())
  @Patch(':id')
  update(@CurrentUser() user: User, @Param('id') id: string, @Body() dto: UpdateCategoryDto) {
    return this.categoryService.update(user.id, Number(id), dto);
  }

  @Delete(':id')
  remove(@CurrentUser() user: User, @Param('id') id: string) {
    return this.categoryService.remove(user.id, Number(id));
  }
}
