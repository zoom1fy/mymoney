import postgres from '@prisma/orm-postgres/runtime';
import type { Contract } from './contract.d';
import contractJson from './contract.json';

export const db = postgres<Contract>({
  contractJson,
  url: process.env['DATABASE_URL']!,
});

export type DbClient = typeof db;

export type DbTransactionContext = Parameters<Parameters<DbClient['transaction']>[0]>[0];

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  createdAt: Date;
  lastLogin: Date | null;
}
