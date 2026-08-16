import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { UserService } from './user.service';
import { PrismaService } from '../prisma/prisma.service';
import { createPrismaDbMock } from '../prisma/fluent-mock';

// Mock argon2 hashing behavior as specified
jest.mock('argon2', () => ({
  verify: jest.fn().mockResolvedValue(true),
  hash: jest.fn().mockResolvedValue('$argon2id$hashed-password'),
}));

const mockArgon2Verify = jest.requireMock('argon2').verify as jest.Mock;

describe('UserService', () => {
  let service: UserService;
  let mock: {
    db: ReturnType<typeof createPrismaDbMock>['db'];
    orm: ReturnType<typeof createPrismaDbMock>['orm'];
  };

  const userId = 'user-uuid-1';
  const email = 'test@example.com';
  const password = 'password123';
  const passwordHash = '$argon2id$hashed-password';
  const updatedEmail = 'new@example.com';
  const now = new Date('2026-05-03T12:00:00Z');

  beforeAll(() => {
    // Freeze time for deterministic lastLogin values
    jest.useFakeTimers();
    jest.setSystemTime(now);
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  beforeEach(async () => {
    mock = createPrismaDbMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [UserService, { provide: PrismaService, useValue: mock }],
    }).compile();

    service = module.get<UserService>(UserService);
    mockArgon2Verify.mockResolvedValue(true);
  });

  describe('findById()', () => {
    it('should return user', async () => {
      mock.orm.User.first.mockResolvedValueOnce({
        id: userId,
        email,
        passwordHash,
        lastLogin: now,
      });

      const result = await service.findById(userId);

      expect(result).toBeTruthy();
      expect(result.id).toBe(userId);
      expect(result.email).toBe(email);

      expect(mock.orm.User.where).toHaveBeenCalledWith({ id: userId });
    });

    it('should throw NotFoundException if user not found', async () => {
      await expect(service.findById(userId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('getByEmail()', () => {
    it('should return user by email', async () => {
      mock.orm.User.first.mockResolvedValueOnce({
        id: userId,
        email,
        passwordHash,
        lastLogin: now,
      });

      const result = await service.getByEmail(email);
      expect(result).toBeTruthy();
      expect(result!.email).toBe(email);
      expect(mock.orm.User.where).toHaveBeenCalledWith({ email });
    });

    it('should return null if user not found (no exception)', async () => {
      const result = await service.getByEmail('absent@example.com');
      expect(result).toBeNull();
    });
  });

  describe('create()', () => {
    it('should create user with hashed password and set lastLogin', async () => {
      const dto = { email, password };

      mock.orm.User.create.mockResolvedValueOnce({
        id: userId,
        email,
        passwordHash,
        lastLogin: now,
      });

      const result = await service.create(dto);

      expect(mock.orm.User.create).toHaveBeenCalled();
      expect(result.passwordHash).toBe(passwordHash);
      expect(result.email).toBe(email);
      expect(result.lastLogin).toBe(now);
    });
  });

  describe('update()', () => {
    it('should update password (hash it first)', async () => {
      const newPass = 'newpass';
      mock.orm.User.update.mockResolvedValueOnce({
        id: userId,
        email,
        passwordHash,
      });

      const result = await service.update(userId, { password: newPass });

      expect(mock.orm.User.update).toHaveBeenCalledWith({
        passwordHash: passwordHash,
      });
      expect(result).toBeTruthy();
    });

    it('should update email', async () => {
      mock.orm.User.update.mockResolvedValueOnce({
        id: userId,
        email: updatedEmail,
        passwordHash,
      });

      const result = await service.update(userId, { email: updatedEmail });

      expect(mock.orm.User.update).toHaveBeenCalledWith({ email: updatedEmail });
      expect(result!.email).toBe(updatedEmail);
    });
  });

  describe('getProfile()', () => {
    it('should return user without passwordHash and with computed name', async () => {
      mock.orm.User.first.mockResolvedValueOnce({
        id: userId,
        email,
        passwordHash,
        lastLogin: now,
        accounts: [],
        categories: [],
        transactions: [],
      });

      const profile = await service.getProfile(userId);
      expect(profile).not.toHaveProperty('passwordHash');
      expect(profile.email).toBe(email);
      expect(profile.name).toBe('test'); // derived from email before '@'
    });
  });

  describe('updateProfile()', () => {
    it('should update email and return user without passwordHash with computed name', async () => {
      // findById fetches the current user from DB
      mock.orm.User.first.mockResolvedValueOnce({
        id: userId,
        email,
        passwordHash,
        lastLogin: now,
        accounts: [],
        categories: [],
        transactions: [],
      });
      // getByEmail confirms the new email is not taken
      mock.orm.User.first.mockResolvedValueOnce(null);
      mock.orm.User.update.mockResolvedValueOnce({
        id: userId,
        email: updatedEmail,
        passwordHash,
        lastLogin: now,
      });

      const updated = await service.updateProfile(userId, {
        email: updatedEmail,
        currentPassword: password,
      });
      expect(mockArgon2Verify).toHaveBeenCalledWith(passwordHash, password);
      expect(mock.orm.User.update).toHaveBeenCalledWith({ email: updatedEmail });
      expect(updated.email).toBe(updatedEmail);
      expect(updated).not.toHaveProperty('passwordHash');
      expect(updated.name).toBe('new'); // computed from updated email
    });

    it('should update password (hash it) and return user without passwordHash', async () => {
      mock.orm.User.first.mockResolvedValueOnce({
        id: userId,
        email,
        passwordHash,
        lastLogin: now,
        accounts: [],
        categories: [],
        transactions: [],
      });
      mock.orm.User.update.mockResolvedValueOnce({
        id: userId,
        email,
        passwordHash,
        lastLogin: now,
      });

      const updated = await service.updateProfile(userId, {
        password: 'newpass',
        currentPassword: password,
      });
      expect(mock.orm.User.update).toHaveBeenCalledWith({ passwordHash: passwordHash });
      expect(updated).not.toHaveProperty('passwordHash');
    });

    it('should throw ConflictException if new email already in use', async () => {
      // findById fetches the current user
      mock.orm.User.first.mockResolvedValueOnce({
        id: userId,
        email,
        passwordHash,
        lastLogin: now,
        accounts: [],
        categories: [],
        transactions: [],
      });
      // getByEmail detects another user already owns the requested email
      mock.orm.User.first.mockResolvedValueOnce({ id: 'other', email: updatedEmail });
      await expect(
        service.updateProfile(userId, { email: updatedEmail, currentPassword: password })
      ).rejects.toThrow(ConflictException);
    });

    it('should skip email uniqueness check if email unchanged', async () => {
      mock.orm.User.first.mockResolvedValueOnce({
        id: userId,
        email,
        passwordHash,
        lastLogin: now,
        accounts: [],
        categories: [],
        transactions: [],
      });
      mock.orm.User.update.mockResolvedValueOnce({
        id: userId,
        email,
        passwordHash,
        lastLogin: now,
      });
      const updated = await service.updateProfile(userId, { email, currentPassword: password });
      expect(mock.orm.User.update).toHaveBeenCalledWith({ email });
      expect(updated.email).toBe(email);
      expect(updated).not.toHaveProperty('passwordHash');
    });

    it('should throw BadRequestException if current password is wrong', async () => {
      mockArgon2Verify.mockResolvedValueOnce(false);
      mock.orm.User.first.mockResolvedValueOnce({
        id: userId,
        email,
        passwordHash,
        lastLogin: now,
        accounts: [],
        categories: [],
        transactions: [],
      });

      await expect(
        service.updateProfile(userId, { email: updatedEmail, currentPassword: 'wrong' })
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('deleteUser()', () => {
    it('should delete user', async () => {
      mock.orm.User.first.mockResolvedValueOnce({
        id: userId,
        email,
        passwordHash,
        lastLogin: now,
        accounts: [],
        categories: [],
        transactions: [],
      });
      mock.orm.User.delete.mockResolvedValueOnce({ id: userId, email });
      const result = await service.deleteUser(userId);
      expect(result).toEqual({ message: 'Пользователь успешно удалён' });
      expect(mock.orm.User.where).toHaveBeenCalledWith({ id: userId });
      expect(mock.orm.User.delete).toHaveBeenCalled();
    });

    it('should throw NotFoundException if user not found', async () => {
      await expect(service.deleteUser(userId)).rejects.toThrow(NotFoundException);
    });
  });
});
