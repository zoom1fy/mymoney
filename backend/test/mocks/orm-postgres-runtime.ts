const emptyPublic: Record<string, unknown> = new Proxy(
  {},
  {
    get: () => {
      throw new Error('Real Prisma runtime must not be used in tests; mock PrismaService instead.');
    },
  }
);

export default function createPostgresStub(): unknown {
  return {
    orm: { public: emptyPublic },
    transaction: () => {
      throw new Error('Real Prisma runtime must not be used in tests; mock PrismaService instead.');
    },
    close: () => Promise.resolve(),
  };
}
