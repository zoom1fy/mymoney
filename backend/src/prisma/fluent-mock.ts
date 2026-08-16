export const ORM_MODELS = [
  'Account',
  'AccountCategory',
  'AccountType',
  'Category',
  'Currency',
  'ExchangeRate',
  'PasswordResetToken',
  'PendingUser',
  'Transaction',
  'User',
] as const;

export type ChainMock = {
  where: jest.Mock;
  orderBy: jest.Mock;
  skip: jest.Mock;
  take: jest.Mock;
  include: jest.Mock;
  select: jest.Mock;
  first: jest.Mock;
  all: jest.Mock;
  create: jest.Mock;
  update: jest.Mock;
  delete: jest.Mock;
  upsert: jest.Mock;
};

export function createChainMock(): ChainMock {
  const chain: Record<string, unknown> = {};

  for (const method of ['where', 'orderBy', 'skip', 'take', 'include', 'select']) {
    chain[method] = jest.fn(() => chain);
  }
  chain.first = jest.fn(() => null);
  chain.all = jest.fn(() => []);
  chain.create = jest.fn((data: Record<string, unknown> | undefined) => ({
    ...(data ?? {}),
    id: 1,
  }));
  chain.update = jest.fn(() => null);
  chain.delete = jest.fn(() => undefined);
  chain.upsert = jest.fn((input: { create?: Record<string, unknown> } | undefined) => ({
    ...(input?.create ?? {}),
    id: 1,
  }));

  return chain as unknown as ChainMock;
}

export function createPrismaDbMock() {
  const publicNs: Record<string, ChainMock> = {};
  for (const model of ORM_MODELS) {
    publicNs[model] = createChainMock();
  }

  const txContext = { orm: { public: publicNs } };

  const db = {
    orm: { public: publicNs },
    transaction: jest.fn((fn: (tx: unknown) => unknown) => fn(txContext)),
    close: jest.fn(() => undefined),
  };

  return { db, orm: publicNs, txContext };
}
