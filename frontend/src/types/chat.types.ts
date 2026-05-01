export interface ChatMessage {
  id: string
  content: string
  isUser: boolean
  createdAt: string
  tempId?: string
  isPending?: boolean
}

export interface WsChatMessagePayload {
  id: string
  content: string
  role: 'USER' | 'ASSISTANT'
  createdAt: string
  tempId?: string
}

export interface WsPartialResponse {
  id: string
  chunk: string
}

export interface WsCompleteResponse {
  id: string
  finalId?: string
  response: string
}

export interface WsErrorPayload {
  error: string
  tempId?: string
}
