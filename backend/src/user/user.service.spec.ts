import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { UserService } from './user.service';
import { PrismaService } from '../prisma/prisma.service';

// Mock argon2 hashing behavior as specified
jest.mock('argon2', () => ({
  verify: jest.fn().mockResolvedValue(true),
  hash: jest.fn().mockResolvedValue('$argon2id$hashed-password'),
}));

const mockArgon2Verify = jest.requireMock('argon2').verify as jest.Mock;

describe('UserService', () => {
  let service: UserService;
  let mockPrisma: any;

  const userId = 'user-uuid-1';
  const email = 'test@example.com';
  const password = 'password123';
  const passwordHash = '$argon2id$hashed-password';
  const updatedEmail = 'new@example.com';
  const now = new Date('2026-05-03T12:00:00Z');

  beforeAll(() => {
    // Freeze time for deterministic lastLogin values
    // @ts-ignore
    jest.useFakeTimers('modern');
    // @ts-ignore
    jest.setSystemTime(now);
  });

  afterAll(() => {
    // @ts-ignore
    jest.useRealTimers();
  });

  beforeEach(async () => {
    mockPrisma = {
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [UserService, { provide: PrismaService, useValue: mockPrisma }],
    }).compile();

    service = module.get<UserService>(UserService);
    // Reset all mock implementations and calls
    Object.values(mockPrisma.user).forEach((mock) => {
      (mock as jest.Mock).mockReset();
    });
    mockArgon2Verify.mockResolvedValue(true);
  });

  describe('findById()', () => {
    it('should return user with accounts, categories, and transactions included', async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce({
        id: userId,
        email,
        passwordHash,
        lastLogin: now,
        accounts: [{ id: 'acc-1' }],
        categories: [{ id: 'cat-1' }],
        transactions: [{ id: 'txn-1' }],
      } as any);

      const result = await service.findById(userId);

      expect(result).toBeTruthy();
      expect(result.id).toBe(userId);
      expect(result.email).toBe(email);
      expect(result.accounts).toBeDefined();
      expect(result.categories).toBeDefined();
      expect(result.transactions).toBeDefined();

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
        include: { accounts: true, categories: true, transactions: true },
      });
    });

    it('should throw NotFoundException if user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce(null);
      await expect(service.findById(userId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('getByEmail()', () => {
    it('should return user by email', async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce({
        id: userId,
        email,
        passwordHash,
        lastLogin: now,
      } as any);

      const result = await service.getByEmail(email);
      expect(result).toBeTruthy();
      expect(result!.email).toBe(email);
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({ where: { email } });
    });

    it('should return null/undefined if user not found (no exception)', async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce(null);
      const result = await service.getByEmail('absent@example.com');
      expect(result).toBeNull();
    });
  });

  describe('create()', () => {
    it('should create user with hashed password and set lastLogin', async () => {
      // Prepare input
      const dto = { email, password } as any;

      mockPrisma.user.create.mockResolvedValueOnce({
        id: userId,
        email,
        passwordHash,
        lastLogin: now,
      } as any);

      const result = await service.create(dto);

      expect(mockPrisma.user.create).toHaveBeenCalled();
      // Ensure password is hashed using argon2.hash and stored as passwordHash
      // The hashing function is mocked to return '$argon2id$hashed-password'
      expect(result.passwordHash).toBe(passwordHash);
      expect(result.email).toBe(email);
      expect(result.lastLogin).toBe(now);
    });
  });

  describe('update()', () => {
    it('should update password (hash it first)', async () => {
      const newPass = 'newpass';
      mockPrisma.user.update.mockResolvedValueOnce({
        id: userId,
        email,
        passwordHash,
      } as any);

      const result = await service.update(userId, { password: newPass });

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: { passwordHash: passwordHash },
      });
      expect(result).toBeTruthy();
    });

    it('should update email', async () => {
      mockPrisma.user.update.mockResolvedValueOnce({
        id: userId,
        email: updatedEmail,
        passwordHash,
      } as any);

      const result = await service.update(userId, { email: updatedEmail });

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: { email: updatedEmail },
      });
      expect(result.email).toBe(updatedEmail);
    });
  });

  describe('getProfile()', () => {
    it('should return user without passwordHash and with computed name', async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce({
        id: userId,
        email,
        passwordHash,
        lastLogin: now,
        accounts: [],
        categories: [],
        transactions: [],
      } as any);

      const profile = await service.getProfile(userId);
      expect((profile as any).passwordHash).toBeUndefined();
      expect(profile.email).toBe(email);
      expect(profile.name).toBe('test'); // derived from email before '@'
    });
  });

  describe('updateProfile()', () => {
    it('should update email and return user without passwordHash with computed name', async () => {
      // First: findById returns current user
      mockPrisma.user.findUnique.mockResolvedValueOnce({
        id: userId,
        email,
        passwordHash,
        lastLogin: now,
        accounts: [],
        categories: [],
        transactions: [],
      } as any);
      // Second: getByEmail returns null (no conflict for new email)
      mockPrisma.user.findUnique.mockResolvedValueOnce(null);
      mockPrisma.user.update.mockResolvedValueOnce({
        id: userId,
        email: updatedEmail,
        passwordHash,
        lastLogin: now,
      } as any);

      const updated = await service.updateProfile(userId, {
        email: updatedEmail,
        currentPassword: password,
      });
      expect(mockArgon2Verify).toHaveBeenCalledWith(passwordHash, password);
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({ where: { email: updatedEmail } });
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: { email: updatedEmail },
      });
      expect(updated.email).toBe(updatedEmail);
      expect((updated as any).passwordHash).toBeUndefined();
      expect(updated.name).toBe('new'); // computed from updated email
    });

    it('should update password (hash it) and return user without passwordHash', async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce({
        id: userId,
        email,
        passwordHash,
        lastLogin: now,
        accounts: [],
        categories: [],
        transactions: [],
      } as any);
      mockPrisma.user.update.mockResolvedValueOnce({
        id: userId,
        email,
        passwordHash,
        lastLogin: now,
      } as any);

      const updated = await service.updateProfile(userId, {
        password: 'newpass',
        currentPassword: password,
      });
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: { passwordHash: passwordHash },
      });
      expect((updated as any).passwordHash).toBeUndefined();
    });

    it('should throw ConflictException if new email already in use', async () => {
      // First: findById returns current user
      mockPrisma.user.findUnique.mockResolvedValueOnce({
        id: userId,
        email,
        passwordHash,
        lastLogin: now,
        accounts: [],
        categories: [],
        transactions: [],
      } as any);
      // Second: getByEmail finds existing user with the new email
      mockPrisma.user.findUnique.mockResolvedValueOnce({ id: 'other', email: updatedEmail } as any);
      await expect(
        service.updateProfile(userId, { email: updatedEmail, currentPassword: password })
      ).rejects.toThrow(ConflictException);
    });

    it('should skip email uniqueness check if email unchanged', async () => {
      // First call: findById needs a user
      mockPrisma.user.findUnique.mockResolvedValueOnce({
        id: userId,
        email,
        passwordHash,
        lastLogin: now,
        accounts: [],
        categories: [],
        transactions: [],
      } as any);
      mockPrisma.user.update.mockResolvedValueOnce({
        id: userId,
        email,
        passwordHash,
        lastLogin: now,
      } as any);
      const updated = await service.updateProfile(userId, { email, currentPassword: password });
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: { email },
      });
      expect(updated.email).toBe(email);
      expect((updated as any).passwordHash).toBeUndefined();
    });

    it('should throw BadRequestException if current password is wrong', async () => {
      mockArgon2Verify.mockResolvedValueOnce(false);
      mockPrisma.user.findUnique.mockResolvedValueOnce({
        id: userId,
        email,
        passwordHash,
        lastLogin: now,
        accounts: [],
        categories: [],
        transactions: [],
      } as any);

      const { BadRequestException } = require('@nestjs/common');
      await expect(
        service.updateProfile(userId, { email: updatedEmail, currentPassword: 'wrong' })
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('deleteUser()', () => {
    it('should delete user', async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce({
        id: userId,
        email,
        passwordHash,
        lastLogin: now,
        accounts: [],
        categories: [],
        transactions: [],
      } as any);
      mockPrisma.user.delete.mockResolvedValueOnce({ id: userId, email } as any);
      const result = await service.deleteUser(userId);
      expect(result).toEqual({ message: 'Пользователь успешно удалён' });
      expect(mockPrisma.user.delete).toHaveBeenCalledWith({ where: { id: userId } });
    });

    it('should throw NotFoundException if user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce(null);
      await expect(service.deleteUser(userId)).rejects.toThrow(NotFoundException);
    });
  });
});
