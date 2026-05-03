import { Controller, Get, Body, Patch, Delete, ValidationPipe, UsePipes } from '@nestjs/common';
import { UserService } from './user.service';
import { UpdateProfileDto } from './dto/user.dto';
import { CurrentUser } from '../auth/decorators/user.decorator';
import { User } from '@/../.prisma/client';
import { Auth } from '../auth/decorators/auth.decorator';

@Auth()
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('profile')
  getProfile(@CurrentUser() user: User) {
    return this.userService.getProfile(user.id);
  }

  @UsePipes(new ValidationPipe())
  @Patch('profile')
  updateProfile(@CurrentUser() user: User, @Body() dto: UpdateProfileDto) {
    return this.userService.updateProfile(user.id, dto);
  }

  @Delete('profile')
  deleteProfile(@CurrentUser() user: User) {
    return this.userService.deleteUser(user.id);
  }
}
