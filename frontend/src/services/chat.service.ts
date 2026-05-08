'use client'

import { axiosWithAuth } from '../api/interceptor'
import { Socket, io } from 'socket.io-client'

import {
  ChatMessage,
  WsChatMessagePayload,
  WsCompleteResponse,
  WsErrorPayload,
  WsPartialResponse
} from '@/types/chat.types'

class ChatService {
  private socket: Socket | null = null
  private token: string | null = null
  private reconnectAttempts = 0

  setToken(token: string) {
    this.token = token
  }

  async connect() {
    if (!this.token) throw new Error('No token provided for WS connection')

    if (this.socket?.connected) return

    this.socket = io(
      process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001',
      {
        path: '/socket.io',
        auth: { token: this.token },
        withCredentials: true,
        reconnection: true,
        reconnectionAttempts: 5,
        transports: ['websocket', 'polling']
      }
    )

    return new Promise<void>((resolve, reject) => {
      if (!this.socket) return reject('Socket is null')

      const onConnect = () => {
        this.reconnectAttempts = 0
        console.log('✅ WS connected:', this.socket?.id)
        resolve()
      }

      const onConnectError = (err: any) => {
        console.error('❌ WS connect error:', err.message)
        reject(err)
      }

      this.socket.on('connect', onConnect)
      this.socket.on('connect_error', onConnectError)

      // Очистка слушателей при отмене
      return () => {
        this.socket?.off('connect', onConnect)
        this.socket?.off('connect_error', onConnectError)
      }
    })
  }

  async reconnectWithNewToken(newToken: string) {
    this.setToken(newToken)
    await this.disconnect()
    return this.connect()
  }

  async disconnect() {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
    }
  }

  // -----------------------------
  // HTTP
  // -----------------------------
  async getHistory(): Promise<ChatMessage[]> {
    const response = await axiosWithAuth.get<WsChatMessagePayload[]>('/chat')
    return response.data.map(msg => this.mapToChatMessage(msg))
  }

  async clearHistory() {
    return axiosWithAuth.delete('/chat')
  }

  // -----------------------------
  // WS EMIT
  // -----------------------------
  async sendMessage(text: string, tempId?: string) {
    if (!this.socket?.connected) {
      throw new Error('WebSocket is not connected')
    }
    this.socket.emit('chat:send', { text, tempId })
  }

  // -----------------------------
  // WS LISTENERS
  // -----------------------------
  onMessageReceived(cb: (msg: ChatMessage) => void) {
    const handler = (payload: WsChatMessagePayload) => {
      cb(this.mapToChatMessage(payload))
    }
    this.socket?.on('chat:message', handler)
    return () => this.socket?.off('chat:message', handler)
  }

  onMessagePartial(cb: (data: WsPartialResponse) => void) {
    this.socket?.on('chat:partial', cb)
    return () => this.socket?.off('chat:partial', cb)
  }

  onMessageComplete(cb: (data: WsCompleteResponse) => void) {
    this.socket?.on('chat:complete', cb)
    return () => this.socket?.off('chat:complete', cb)
  }

  onError(cb: (data: WsErrorPayload) => void) {
    this.socket?.on('chat:error', cb)
    return () => this.socket?.off('chat:error', cb)
  }

  onDisconnect(cb: () => void) {
    this.socket?.on('disconnect', cb)
    return () => this.socket?.off('disconnect', cb)
  }

  onConnectError(cb: (err: any) => void) {
    this.socket?.on('connect_error', cb)
    return () => this.socket?.off('connect_error', cb)
  }

  onException(cb: (data: any) => void) {
    this.socket?.on('exception', cb)
    return () => this.socket?.off('exception', cb)
  }

  // -----------------------------
  // Utils
  // -----------------------------
  private mapToChatMessage(data: WsChatMessagePayload): ChatMessage {
    return {
      id: data.id,
      content: data.content,
      createdAt: data.createdAt,
      tempId: data.tempId,
      isUser: data.role === 'USER',
      isPending: false
    }
  }

  get isConnected() {
    return this.socket?.connected ?? false
  }
}

export const chatService = new ChatService()
