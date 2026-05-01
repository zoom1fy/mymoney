import { MessageRole } from '@prisma/client';

export interface MessageResponse {
  id: string;
  content: string;
  role: MessageRole;
  createdAt: Date;
  tempId?: string;
}

export interface PartialResponse {
  id: string;
  chunk: string;
}

export interface CompleteResponse {
  id: string;
  finalId: string;
  response: string;
}

export interface ErrorResponse {
  error: string;
  tempId?: string;
}

export interface UserPayload {
  id: string;
  [key: string]: any;
}