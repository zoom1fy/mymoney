import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { AccountService } from './account.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';
import { Auth } from '../auth/decorators/auth.decorator';
import { CurrentUser } from '../auth/decorators/user.decorator';
import { User } from '@/../.prisma/client';

@Auth()
@Controller('accounts')
export class AccountController {
  constructor(private readonly accountService: AccountService) {}

  @Post()
  create(@CurrentUser() user: User, @Body() dto: CreateAccountDto) {
    return this.accountService.create(user.id, dto);
  }

  @Get()
  findAll(@CurrentUser() user: User) {
    return this.accountService.findAll(user.id);
  }

  @Get(':id')
  findOne(@CurrentUser() user: User, @Param('id') id: string) {
    return this.accountService.findOne(user.id, Number(id));
  }

  @Patch(':id')
  update(@CurrentUser() user: User, @Param('id') id: string, @Body() dto: UpdateAccountDto) {
    return this.accountService.update(user.id, Number(id), dto);
  }

  @Delete(':id')
  remove(@CurrentUser() user: User, @Param('id') id: string) {
    return this.accountService.remove(user.id, Number(id));
  }
}
