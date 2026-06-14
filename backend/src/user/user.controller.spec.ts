import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { User } from '@prisma/client';

describe('UserController', () => {
  let controller: UserController;
  let mockUserService: any;

  const mockUser = { id: 'user-uuid-1', email: 'test@test.com' } as User;

  beforeEach(async () => {
    mockUserService = {
      getProfile: jest.fn(),
      updateProfile: jest.fn(),
      deleteUser: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [{ provide: UserService, useValue: mockUserService }],
    }).compile();

    controller = module.get<UserController>(UserController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getProfile()', () => {
    it('should call userService.getProfile with user id', async () => {
      const expected = { id: 'user-uuid-1', email: 'test@test.com', name: 'test' };
      mockUserService.getProfile.mockResolvedValue(expected);

      const result = await controller.getProfile(mockUser);

      expect(mockUserService.getProfile).toHaveBeenCalledWith(mockUser.id);
      expect(result).toEqual(expected);
    });
  });

  describe('updateProfile()', () => {
    it('should call userService.updateProfile with user id and dto', async () => {
      const dto = { email: 'new@test.com', currentPassword: 'pass' };
      const expected = { id: 'user-uuid-1', email: 'new@test.com', name: 'new' };
      mockUserService.updateProfile.mockResolvedValue(expected);

      const result = await controller.updateProfile(mockUser, dto);

      expect(mockUserService.updateProfile).toHaveBeenCalledWith(mockUser.id, dto);
      expect(result).toEqual(expected);
    });
  });

  describe('deleteProfile()', () => {
    it('should call userService.deleteUser with user id', async () => {
      const expected = { message: 'Пользователь успешно удалён' };
      mockUserService.deleteUser.mockResolvedValue(expected);

      const result = await controller.deleteProfile(mockUser);

      expect(mockUserService.deleteUser).toHaveBeenCalledWith(mockUser.id);
      expect(result).toEqual(expected);
    });
  });
});
