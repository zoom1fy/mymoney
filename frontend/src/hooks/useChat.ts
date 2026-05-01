'use client'

import { getAccessToken } from '@/services/auth-token.service'
import { removeTokenStorage } from '@/services/auth-token.service'
import { authService } from '@/services/auth.service'
import { chatService } from '@/services/chat.service'
import { useCallback, useEffect, useRef, useState } from 'react'

import type { ChatMessage } from '@/types/chat.types'

const CHAT_STORAGE_KEY = 'chat_messages'

export function useChat() {
  const loadFromStorage = (): ChatMessage[] => {
    if (typeof window === 'undefined') return []
    try {
      const raw = localStorage.getItem(CHAT_STORAGE_KEY)
      return raw ? (JSON.parse(raw) as ChatMessage[]) : []
    } catch {
      return []
    }
  }

  const [messages, setMessages] = useState<ChatMessage[]>(() =>
    loadFromStorage()
  )
  const [isLoading, setIsLoading] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [connectionError, setConnectionError] = useState<string | null>(null)
  const [isThinking, setIsThinking] = useState(false)
  const [isReconnecting, setIsReconnecting] = useState(false)

  const tempIdRef = useRef(0)
  const pendingMessages = useRef<string[]>([])
  const reconnectInProgress = useRef(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!messages.length) {
      localStorage.removeItem(CHAT_STORAGE_KEY)
      return
    }

    const safeMessages = messages.map(m => ({
      ...m,
      isPending: false
    }))

    localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(safeMessages))
  }, [messages])

  // ----------------------------
  // Отправка накопленных сообщений после восстановления соединения
  // ----------------------------
  const flushPendingMessages = useCallback(async () => {
    const messagesToSend = [...pendingMessages.current]
    pendingMessages.current = []

    for (const text of messagesToSend) {
      const tempId = `temp-${Date.now()}-${++tempIdRef.current}`
      const optimisticMsg: ChatMessage = {
        id: tempId,
        tempId,
        isUser: true,
        content: text,
        createdAt: new Date().toISOString()
      }

      setMessages(prev => [...prev, optimisticMsg])
      setIsLoading(true)
      setIsThinking(true)

      try {
        await chatService.sendMessage(text, tempId)
      } catch (err: any) {
        console.error('Failed to send queued message:', err.message)
        setMessages(prev => prev.filter(msg => msg.id !== tempId))
        setIsLoading(false)
        setIsThinking(false)

        // Если снова ошибка токена — опять в очередь
        if (
          err.message.includes('Invalid token') ||
          err.message.includes('No token') ||
          err.message.includes('WebSocket is not connected')
        ) {
          pendingMessages.current.push(text)
        }
      }
    }
  }, [])

  // ----------------------------
  // Connect to WS with token refresh
  // ----------------------------
  const connect = useCallback(
    async (token: string) => {
      if (reconnectInProgress.current) return

      try {
        reconnectInProgress.current = true
        setConnectionError(null)
        setIsReconnecting(true)
        chatService.setToken(token)
        await chatService.connect()
        setIsConnected(true)
        setIsReconnecting(false)
        reconnectInProgress.current = false

        // Отправляем все накопленные сообщения после успешного подключения
        await flushPendingMessages()
      } catch (err: any) {
        console.error('WS connection error:', err.message)
        setConnectionError(err.message)
        setIsConnected(false)
        setIsReconnecting(false)
        reconnectInProgress.current = false

        // Пытаемся обновить токен и подключиться снова
        if (
          err.message.includes('Invalid token') ||
          err.message.includes('No token')
        ) {
          try {
            await authService.getNewTokens()
            const freshToken = getAccessToken()
            if (freshToken) {
              await connect(freshToken) // Рекурсивный вызов с новым токеном
            }
          } catch (refreshError) {
            console.error('Failed to refresh token:', refreshError)
            removeTokenStorage()
            setConnectionError('Сессия истекла. Пожалуйста, обновите страницу.')
          }
        }
      }
    },
    [flushPendingMessages]
  )

  // ----------------------------
  // Load history
  // ----------------------------
  const loadChatData = useCallback(async () => {
    try {
      const history = await chatService.getHistory()
      const local = loadFromStorage()
      const merged = [
        ...history,
        ...local.filter(l => !history.some(h => h.id === l.id) && !l.isPending)
      ]
      setMessages(merged)
    } catch (err) {
      console.error('Failed to load chat data', err)
    }
  }, [])

  // ----------------------------
  // Безопасный реконнект с обновлением токена
  // ----------------------------
  const safeReconnect = useCallback(async () => {
    if (isReconnecting || reconnectInProgress.current) return

    setIsReconnecting(true)
    reconnectInProgress.current = true

    try {
      await authService.getNewTokens()
      const freshToken = getAccessToken()
      if (freshToken) {
        await chatService.reconnectWithNewToken(freshToken)
        setIsConnected(true)
        setConnectionError(null)
        await flushPendingMessages()
      }
    } catch (error) {
      console.error('Failed to refresh token and reconnect:', error)
      removeTokenStorage()
      setConnectionError('Сессия истекла. Пожалуйста, обновите страницу.')
    } finally {
      setIsReconnecting(false)
      reconnectInProgress.current = false
    }
  }, [isReconnecting, flushPendingMessages])

  // ----------------------------
  // Send message
  // ----------------------------
  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim()) return

      // Если идёт реконнект или нет подключения — ставим в очередь
      if (!isConnected || isReconnecting) {
        pendingMessages.current.push(text.trim())

        // Пытаемся инициировать подключение если ещё не
        if (!isConnected && !isReconnecting) {
          const token = getAccessToken()
          if (token) {
            connect(token)
          } else {
            setConnectionError('Не удалось подключиться. Попробуйте позже.')
          }
        }
        return
      }

      const tempId = `temp-${Date.now()}-${++tempIdRef.current}`
      const optimisticMsg: ChatMessage = {
        id: tempId,
        tempId,
        isUser: true,
        content: text.trim(),
        createdAt: new Date().toISOString()
      }

      setMessages(prev => [...prev, optimisticMsg])
      setIsLoading(true)
      setIsThinking(true)

      try {
        await chatService.sendMessage(text.trim(), tempId)
      } catch (err: any) {
        console.error('Failed to send message:', err.message)
        setMessages(prev => prev.filter(msg => msg.id !== tempId))
        setIsLoading(false)
        setIsThinking(false)

        const isTokenError =
          err.message.includes('Invalid token') ||
          err.message.includes('No token') ||
          err.message.includes('WebSocket is not connected')

        if (isTokenError) {
          // Сохраняем сообщение в очередь
          pendingMessages.current.push(text.trim())
          // Запускаем безопасный реконнект
          await safeReconnect()
        }
      }
    },
    [isConnected, isReconnecting, connect, safeReconnect]
  )

  // ----------------------------
  // WS listeners + reconnection logic
  // ----------------------------
  useEffect(() => {
    if (!isConnected) return

    // Сразу отправляем накопленные сообщения при подключении
    flushPendingMessages()

    const offDisconnect = chatService.onDisconnect(() => {
      setIsConnected(false)
      setIsThinking(false)
      setIsLoading(false)
      console.log('🔌 WS disconnected')
    })

    const offConnectError = chatService.onConnectError(async err => {
      console.error('⚠️ WS connect error:', err.message)
      setIsConnected(false)
      setIsThinking(false)
      setIsLoading(false)

      if (
        err.message.includes('Invalid token') ||
        err.message.includes('No token')
      ) {
        await safeReconnect()
      }
    })

    const offMessage = chatService.onMessageReceived(serverMsg => {
      setMessages(prev => {
        if (serverMsg.tempId) {
          return prev.map(msg =>
            msg.tempId === serverMsg.tempId ? serverMsg : msg
          )
        }
        return [...prev, serverMsg]
      })
      setIsLoading(false)
    })

    const offPartial = chatService.onMessagePartial(data => {
      setIsThinking(false)
      setMessages(prev => {
        const existing = prev.find(m => m.id === data.id)
        if (existing) {
          return prev.map(m =>
            m.id === data.id ? { ...m, content: m.content + data.chunk } : m
          )
        }
        return [
          ...prev,
          {
            id: data.id,
            content: data.chunk,
            isUser: false,
            createdAt: new Date().toISOString(),
            isPending: true
          }
        ]
      })
    })

    const offComplete = chatService.onMessageComplete(data => {
      setMessages(prev =>
        prev.map(msg =>
          msg.id === data.id
            ? {
                ...msg,
                id: data.finalId ?? msg.id,
                content: data.response,
                isPending: false
              }
            : msg
        )
      )
      setIsLoading(false)
    })

    const offError = chatService.onError(async err => {
      console.error('Chat error:', err)
      setIsThinking(false)
      setIsLoading(false)

      const isTokenError =
        typeof err?.error === 'string' &&
        (err.error.includes('Invalid') ||
          err.error.includes('expired') ||
          err.error.includes('No token'))

      if (isTokenError) {
        await safeReconnect()
      } else if (err?.error) {
        setConnectionError(err.error)
      }
    })

    const offException = chatService.onException(async (err: any) => {
      console.error('WS exception:', err)

      const isAuthError =
        err?.message?.includes('Invalid token') ||
        err?.message?.includes('Unauthorized') ||
        err?.status === 'error'

      if (isAuthError) {
        await safeReconnect()
      }
    })

    return () => {
      offMessage()
      offPartial()
      offComplete()
      offError()
      offDisconnect()
      offConnectError()
      offException()
    }
  }, [isConnected, safeReconnect, flushPendingMessages])

  // ----------------------------
  // Auto-reconnect on token refresh
  // ----------------------------
  useEffect(() => {
    const handleTokenRefresh = () => {
      if (!isConnected && !isReconnecting) {
        const token = getAccessToken()
        if (token) {
          connect(token)
        }
      }
    }

    window.addEventListener('tokenRefreshed', handleTokenRefresh)
    return () => {
      window.removeEventListener('tokenRefreshed', handleTokenRefresh)
    }
  }, [isConnected, isReconnecting, connect])

  const clearChat = useCallback(async () => {
    await chatService.clearHistory()
    localStorage.removeItem(CHAT_STORAGE_KEY)
    pendingMessages.current = []
    setIsThinking(false)
    setIsLoading(false)
    setMessages([])
  }, [])

  return {
    messages,
    isLoading,
    isThinking,
    isConnected,
    connectionError,
    isReconnecting,
    loadChatData,
    connect,
    sendMessage,
    clearChat
  }
}
