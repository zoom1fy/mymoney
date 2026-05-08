import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import request from 'supertest';
import cookieParser from 'cookie-parser';
import { JwtService } from '@nestjs/jwt';
import jwt from 'jsonwebtoken';
import { AuthModule } from '../src/auth/auth.module';
import { AccountModule } from '../src/account/account.module';
import { CategoryModule } from '../src/category/category.module';
import { TransactionModule } from '../src/transaction/transaction.module';
import { UserModule } from '../src/user/user.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { HttpService } from '@nestjs/axios';
import { TOKEN_CONFIG } from '../src/config/token.config';
import { of } from 'rxjs';
import Decimal from 'decimal.js';

// ─── Environment Setup ──────────────────────────────────────
process.env.JWT_SECRET = 'e2e-test-jwt-secret';
process.env.NODE_ENV = 'test';

// ─── Test Constants ─────────────────────────────────────────────
const TEST_USER_ID = '550e8400-e29b-41d4-a716-446655440000';
const TEST_EMAIL = 'test@example.com';
const TEST_PASSWORD = 'password123';
// Generate a real JWT token signed with the test secret (so passport-jwt can verify it)
const VALID_TOKEN = jwt.sign({ id: TEST_USER_ID }, 'e2e-test-jwt-secret', { expiresIn: '1h' });
const VALID_REFRESH = 'valid-refresh-token';

// ─── Mock argon2 globally ───────────────────────────────────
jest.mock('argon2', () => ({
  hash: jest.fn().mockResolvedValue('$argon2id$v=19$m=65536,t=3,p=4$abc$hashed'),
  verify: jest.fn().mockResolvedValue(true),
}));

// ─── Mock Helpers ───────────────────────────────────────────────
function createMockPrisma() {
  return {
    user: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    account: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    category: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    transaction: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    chatMessage: {
      create: jest.fn(),
      findMany: jest.fn(),
      deleteMany: jest.fn(),
    },
    currency: { findMany: jest.fn(), findUnique: jest.fn() },
    accountType: { findMany: jest.fn() },
    accountCategory: { findMany: jest.fn() },
    $connect: jest.fn(),
    $disconnect: jest.fn(),
    $transaction: jest.fn().mockImplementation((ops: any[]) => Promise.resolve(ops)),
  };
}

function createMockJwtService() {
  return {
    sign: jest.fn().mockImplementation((payload: any, options: any) => {
      if (options?.expiresIn === '15m') return VALID_TOKEN;
      if (options?.expiresIn === '7d') return VALID_REFRESH;
      return 'mock-token';
    }),
    verifyAsync: jest.fn().mockResolvedValue({ id: TEST_USER_ID }),
  };
}

const mockTokenConfig = {
  accessTokenExpiresIn: '15m',
  refreshTokenExpiresIn: '7d',
  refreshTokenName: 'refresh_token',
  refreshTokenCookieOptions: { httpOnly: true, secure: false, sameSite: 'lax' as const },
};

// ─── Test Setup ─────────────────────────────────────────────────
describe('MyMoney API (e2e)', () => {
  let app: INestApplication;
  let mockPrisma: ReturnType<typeof createMockPrisma>;
  let mockJwt: ReturnType<typeof createMockJwtService>;

  beforeAll(async () => {
    mockPrisma = createMockPrisma();
    mockJwt = createMockJwtService();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        PassportModule.register({ defaultStrategy: 'jwt' }),
        AuthModule,
        AccountModule,
        CategoryModule,
        TransactionModule,
        UserModule,
      ],
    })
      .overrideProvider(PrismaService)
      .useValue(mockPrisma)
      .overrideProvider(JwtService)
      .useValue(mockJwt)
      .overrideProvider(TOKEN_CONFIG)
      .useValue(mockTokenConfig)
      .overrideProvider(HttpService)
      .useValue({ get: jest.fn().mockReturnValue(of({ data: {} })) })
      .compile();

    app = moduleFixture.createNestApplication();
    app.use(cookieParser());
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(() => {
    // Clear call history only - preserve mockResolvedValue from beforeEach
    Object.values(mockPrisma).forEach((model) => {
      if (model && typeof model === 'object') {
        Object.values(model).forEach((fn) => {
          if (typeof fn === 'function' && 'mockClear' in fn) {
            (fn as jest.Mock).mockClear();
          }
        });
      }
    });
  });

  beforeEach(() => {
    // Default: JwtStrategy.validate() calls userService.findById() which uses user.findUnique
    // Return a valid user so authenticated endpoints pass the guard
    mockPrisma.user.findUnique.mockResolvedValue({
      id: TEST_USER_ID,
      email: TEST_EMAIL,
      passwordHash: '$argon2id$hashed',
      lastLogin: new Date(),
    });
  });

  // ─── Auth Endpoints ────────────────────────────────────────
  describe('POST /api/auth/register', () => {
    it('should register a new user and return tokens', async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce(null);
      mockPrisma.user.create.mockResolvedValueOnce({
        id: TEST_USER_ID,
        email: TEST_EMAIL,
        passwordHash: '$argon2id$hashed',
        lastLogin: new Date(),
      });

      const response = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ email: TEST_EMAIL, password: TEST_PASSWORD })
        .expect(200);

      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('accessToken');
    });

    it('should return 404 if user already exists', async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce({ id: 'existing' });
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ email: TEST_EMAIL, password: TEST_PASSWORD })
        .expect(404);
    });

    it('should return 400 for invalid email format', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ email: 'not-an-email', password: TEST_PASSWORD })
        .expect(400);
    });

    it('should return 400 for password shorter than 6 characters', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ email: TEST_EMAIL, password: '123' })
        .expect(400);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login successfully and return tokens', async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce({
        id: TEST_USER_ID,
        email: TEST_EMAIL,
        passwordHash: '$argon2id$hash',
        lastLogin: new Date(),
      });

      const response = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: TEST_EMAIL, password: TEST_PASSWORD })
        .expect(200);

      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('accessToken');
    });

    it('should return 404 if user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce(null);
      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'nonexistent@example.com', password: TEST_PASSWORD })
        .expect(404);
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should clear refresh token cookie', async () => {
      const response = await request(app.getHttpServer()).post('/api/auth/logout').expect(200);
      expect(response.header['set-cookie']).toBeDefined();
    });
  });

  // ─── Accounts Endpoints ────────────────────────────────────
  describe('POST /api/accounts', () => {
    it('should create a new account', async () => {
      mockPrisma.account.findFirst.mockResolvedValueOnce(null);
      mockPrisma.account.create.mockResolvedValueOnce({
        id: 1,
        userId: TEST_USER_ID,
        name: 'Сбербанк',
        icon: 'bank',
        currentBalance: new Decimal(1000),
        isDeleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const response = await request(app.getHttpServer())
        .post('/api/accounts')
        .set('Authorization', `Bearer ${VALID_TOKEN}`)
        .send({
          name: 'Сбербанк',
          categoryId: 1,
          typeId: 1,
          currencyCode: 'RUB',
          currentBalance: 1000,
          icon: 'bank',
        })
        .expect(201);

      expect(response.body.name).toBe('Сбербанк');
    });

    it('should return 400 for duplicate account name', async () => {
      mockPrisma.account.findFirst.mockResolvedValueOnce({
        id: 1,
        name: 'Сбербанк',
        isDeleted: false,
      });
      await request(app.getHttpServer())
        .post('/api/accounts')
        .set('Authorization', `Bearer ${VALID_TOKEN}`)
        .send({ name: 'Сбербанк', categoryId: 1, typeId: 1, currencyCode: 'RUB' })
        .expect(400);
    });

    it('should return 400 for missing required fields', async () => {
      await request(app.getHttpServer())
        .post('/api/accounts')
        .set('Authorization', `Bearer ${VALID_TOKEN}`)
        .send({})
        .expect(400);
    });
  });

  describe('GET /api/accounts', () => {
    it('should return all active accounts for user', async () => {
      mockPrisma.account.findMany.mockResolvedValueOnce([
        {
          id: 1,
          userId: TEST_USER_ID,
          name: 'Сбербанк',
          currentBalance: new Decimal(1000),
          isDeleted: false,
          createdAt: new Date('2020-01-01'),
        },
        {
          id: 2,
          userId: TEST_USER_ID,
          name: 'Наличные',
          currentBalance: new Decimal(500),
          isDeleted: false,
          createdAt: new Date('2020-01-02'),
        },
      ]);

      const response = await request(app.getHttpServer())
        .get('/api/accounts')
        .set('Authorization', `Bearer ${VALID_TOKEN}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(2);
    });
  });

  describe('GET /api/accounts/:id', () => {
    it('should return a single account', async () => {
      mockPrisma.account.findFirst.mockResolvedValueOnce({
        id: 1,
        userId: TEST_USER_ID,
        name: 'Сбербанк',
        currentBalance: new Decimal(1000),
        isDeleted: false,
      });

      const response = await request(app.getHttpServer())
        .get('/api/accounts/1')
        .set('Authorization', `Bearer ${VALID_TOKEN}`)
        .expect(200);

      expect(response.body.name).toBe('Сбербанк');
    });

    it('should return 404 for non-existent account', async () => {
      mockPrisma.account.findFirst.mockResolvedValueOnce(null);
      await request(app.getHttpServer())
        .get('/api/accounts/999')
        .set('Authorization', `Bearer ${VALID_TOKEN}`)
        .expect(404);
    });
  });

  describe('PATCH /api/accounts/:id', () => {
    it('should update an account', async () => {
      mockPrisma.account.findFirst
        .mockResolvedValueOnce({
          id: 1,
          name: 'Old',
          isDeleted: false,
          currentBalance: new Decimal(0),
        })
        .mockResolvedValueOnce(null);
      mockPrisma.account.update.mockResolvedValueOnce({
        id: 1,
        name: 'Updated',
        currentBalance: new Decimal(2000),
      });

      const response = await request(app.getHttpServer())
        .patch('/api/accounts/1')
        .set('Authorization', `Bearer ${VALID_TOKEN}`)
        .send({ name: 'Updated', currentBalance: 2000 })
        .expect(200);

      expect(response.body.name).toBe('Updated');
    });
  });

  describe('DELETE /api/accounts/:id', () => {
    it('should soft-delete an account', async () => {
      mockPrisma.account.findFirst.mockResolvedValueOnce({
        id: 1,
        name: 'ToDelete',
        isDeleted: false,
        currentBalance: new Decimal(0),
      });
      mockPrisma.account.update.mockResolvedValueOnce({ id: 1, isDeleted: true });

      await request(app.getHttpServer())
        .delete('/api/accounts/1')
        .set('Authorization', `Bearer ${VALID_TOKEN}`)
        .expect(200);

      expect(mockPrisma.account.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ isDeleted: true }) })
      );
    });
  });

  // ─── Categories Endpoints (route: /api/category) ───────────
  describe('POST /api/category', () => {
    it('should create a new category', async () => {
      mockPrisma.category.findFirst.mockResolvedValueOnce(null);
      mockPrisma.category.create.mockResolvedValueOnce({
        id: 1,
        userId: TEST_USER_ID,
        name: 'Еда',
        icon: 'food',
        color: '#FF0000',
        isExpense: true,
        isArchived: false,
        currencyCode: 'RUB',
      });

      const response = await request(app.getHttpServer())
        .post('/api/category')
        .set('Authorization', `Bearer ${VALID_TOKEN}`)
        .send({ name: 'Еда', currencyCode: 'RUB', color: '#FF0000', isExpense: true, icon: 'food' })
        .expect(201);

      expect(response.body.name).toBe('Еда');
    });

    it('should return 400 for duplicate category name', async () => {
      mockPrisma.category.findFirst.mockResolvedValueOnce({ id: 1, isArchived: false });
      await request(app.getHttpServer())
        .post('/api/category')
        .set('Authorization', `Bearer ${VALID_TOKEN}`)
        .send({ name: 'Еда', currencyCode: 'RUB', isExpense: true })
        .expect(400);
    });

    it('should return 400 for name exceeding max length', async () => {
      await request(app.getHttpServer())
        .post('/api/category')
        .set('Authorization', `Bearer ${VALID_TOKEN}`)
        .send({ name: 'ThisNameIsWayTooLongForCategory', currencyCode: 'RUB', isExpense: true })
        .expect(400);
    });
  });

  describe('GET /api/category', () => {
    it('should return all active categories', async () => {
      mockPrisma.category.findMany.mockResolvedValueOnce([
        { id: 1, name: 'Еда', isArchived: false, isExpense: true },
        { id: 2, name: 'Зарплата', isArchived: false, isExpense: false },
      ]);

      const response = await request(app.getHttpServer())
        .get('/api/category')
        .set('Authorization', `Bearer ${VALID_TOKEN}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(2);
    });
  });

  describe('GET /api/category/archived', () => {
    it('should return archived categories', async () => {
      mockPrisma.category.findMany.mockResolvedValueOnce([
        { id: 3, name: 'Old Category', isArchived: true },
      ]);

      const response = await request(app.getHttpServer())
        .get('/api/category/archived')
        .set('Authorization', `Bearer ${VALID_TOKEN}`)
        .expect(200);

      expect(response.body.length).toBe(1);
    });
  });

  describe('DELETE /api/category/:id', () => {
    it('should archive a category and its children', async () => {
      mockPrisma.category.findFirst.mockResolvedValueOnce({
        id: 1,
        name: 'ToDelete',
        isArchived: false,
        userId: TEST_USER_ID,
      });
      mockPrisma.category.update.mockResolvedValueOnce({ id: 1, isArchived: true });
      mockPrisma.category.updateMany.mockResolvedValueOnce({ count: 2 });

      await request(app.getHttpServer())
        .delete('/api/category/1')
        .set('Authorization', `Bearer ${VALID_TOKEN}`)
        .expect(200);

      expect(mockPrisma.category.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { isArchived: true } })
      );
    });
  });

  // ─── Transactions Endpoints ────────────────────────────────
  describe('POST /api/transactions', () => {
    it('should create an income transaction', async () => {
      mockPrisma.account.findFirst.mockResolvedValueOnce({ id: 1, userId: TEST_USER_ID });
      mockPrisma.category.findFirst.mockResolvedValueOnce({ id: 1, userId: TEST_USER_ID });
      mockPrisma.$transaction.mockResolvedValueOnce([
        { id: 1, currentBalance: new Decimal(1100) },
        { id: 100, amount: 100, type: 'INCOME' },
      ]);

      await request(app.getHttpServer())
        .post('/api/transactions')
        .set('Authorization', `Bearer ${VALID_TOKEN}`)
        .send({
          accountId: 1,
          categoryId: 1,
          amount: 100,
          type: 'INCOME',
          currencyCode: 'RUB',
          description: 'Salary',
        })
        .expect(201);

      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });

    it('should create an expense transaction', async () => {
      mockPrisma.account.findFirst.mockResolvedValueOnce({ id: 1, userId: TEST_USER_ID });
      mockPrisma.category.findFirst.mockResolvedValueOnce({ id: 1, userId: TEST_USER_ID });
      mockPrisma.$transaction.mockResolvedValueOnce([
        { id: 1, currentBalance: new Decimal(900) },
        { id: 101, amount: 50, type: 'EXPENSE' },
      ]);

      await request(app.getHttpServer())
        .post('/api/transactions')
        .set('Authorization', `Bearer ${VALID_TOKEN}`)
        .send({ accountId: 1, categoryId: 1, amount: 50, type: 'EXPENSE', currencyCode: 'RUB' })
        .expect(201);
    });

    it('should return 400 for invalid amount (negative)', async () => {
      // Service checks account & category BEFORE amount validation
      mockPrisma.account.findFirst.mockResolvedValueOnce({ id: 1, userId: TEST_USER_ID });
      mockPrisma.category.findFirst.mockResolvedValueOnce({ id: 1, userId: TEST_USER_ID });
      await request(app.getHttpServer())
        .post('/api/transactions')
        .set('Authorization', `Bearer ${VALID_TOKEN}`)
        .send({ accountId: 1, categoryId: 1, amount: -10, type: 'INCOME', currencyCode: 'RUB' })
        .expect(400);
    });
  });

  describe('GET /api/transactions', () => {
    it('should return paginated transactions', async () => {
      mockPrisma.transaction.findMany.mockResolvedValueOnce([
        { id: 1, amount: 100, type: 'INCOME' },
      ]);

      const response = await request(app.getHttpServer())
        .get('/api/transactions')
        .set('Authorization', `Bearer ${VALID_TOKEN}`)
        .expect(200);

      expect(response.body).toHaveProperty('data');
    });

    it('should support filtering by accountId', async () => {
      mockPrisma.transaction.findMany.mockResolvedValueOnce([]);
      const response = await request(app.getHttpServer())
        .get('/api/transactions?accountId=1')
        .set('Authorization', `Bearer ${VALID_TOKEN}`)
        .expect(200);

      expect(response.body).toHaveProperty('data');
    });
  });

  describe('DELETE /api/transactions/:id', () => {
    it('should delete a transaction and reverse balance changes', async () => {
      mockPrisma.transaction.findFirst.mockResolvedValueOnce({
        id: 1,
        accountId: 1,
        type: 'INCOME',
        amount: 100,
        targetAccountId: null,
        account: { userId: TEST_USER_ID },
      });
      mockPrisma.$transaction.mockResolvedValueOnce([{}, {}]);

      await request(app.getHttpServer())
        .delete('/api/transactions/1')
        .set('Authorization', `Bearer ${VALID_TOKEN}`)
        .expect(204);

      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });

    it('should return 404 for non-existent transaction', async () => {
      mockPrisma.transaction.findFirst.mockResolvedValueOnce(null);
      await request(app.getHttpServer())
        .delete('/api/transactions/999')
        .set('Authorization', `Bearer ${VALID_TOKEN}`)
        .expect(404);
    });
  });

  // ─── User Endpoints ────────────────────────────────────────
  describe('GET /api/user/profile', () => {
    it('should return user profile', async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce({
        id: TEST_USER_ID,
        email: TEST_EMAIL,
        passwordHash: '$argon2id$hashed',
        lastLogin: new Date(),
      });

      const response = await request(app.getHttpServer())
        .get('/api/user/profile')
        .set('Authorization', `Bearer ${VALID_TOKEN}`)
        .expect(200);

      expect(response.body.email).toBe(TEST_EMAIL);
      expect(response.body.passwordHash).toBeUndefined();
    });
  });

  describe('PATCH /api/user/profile', () => {
    it('should update user profile email', async () => {
      const newEmail = 'new@example.com';
      // 1st: JWT guard calls findById -> findUnique
      // 2nd: updateProfile calls findById -> findUnique
      // 3rd: updateProfile calls getByEmail -> findUnique (should return null = available)
      mockPrisma.user.findUnique
        .mockResolvedValueOnce({
          id: TEST_USER_ID,
          email: TEST_EMAIL,
          passwordHash: '$argon2id$hashed',
          lastLogin: new Date(),
        })
        .mockResolvedValueOnce({
          id: TEST_USER_ID,
          email: TEST_EMAIL,
          passwordHash: '$argon2id$hashed',
          lastLogin: new Date(),
        })
        .mockResolvedValueOnce(null);
      mockPrisma.user.update.mockResolvedValueOnce({
        id: TEST_USER_ID,
        email: newEmail,
        passwordHash: '$argon2id$hashed',
        lastLogin: new Date(),
      });

      const response = await request(app.getHttpServer())
        .patch('/api/user/profile')
        .set('Authorization', `Bearer ${VALID_TOKEN}`)
        .send({ email: newEmail })
        .expect(200);

      expect(response.body.email).toBe(newEmail);
    });
  });

  // ─── Unauthorized Access ───────────────────────────────────
  describe('Unauthorized access', () => {
    it('should return 401 for accounts without auth token', async () => {
      await request(app.getHttpServer()).get('/api/accounts').expect(401);
    });

    it('should return 401 for category without auth token', async () => {
      await request(app.getHttpServer()).get('/api/category').expect(401);
    });

    it('should return 401 for transactions without auth token', async () => {
      await request(app.getHttpServer()).get('/api/transactions').expect(401);
    });
  });
});
