'use client'

import { getAccessToken } from '@/services/auth-token.service'
import { AlertCircle, Loader2, Send, Sparkles, X, Zap } from 'lucide-react'
import { useEffect, useState } from 'react'

import { ConfirmAlert } from '@/components/ui/dialogs/confirm-alert'
import { Button } from '@/components/ui/shadui/button'
import { Input } from '@/components/ui/shadui/input'

import { useChat } from '@/hooks/useChat'

import ChatMessages from './ChatMessages'

interface ChatModalProps {
  open: boolean
  onClose: () => void
}

const MAX_MESSAGE_LENGTH = 100

export default function ChatModal({ open, onClose }: ChatModalProps) {
  const {
    messages,
    isLoading,
    isThinking,
    isConnected,
    connectionError,
    loadChatData,
    connect,
    sendMessage,
    clearChat
  } = useChat()

  const [input, setInput] = useState('')
  const [showClearDialog, setShowClearDialog] = useState(false)

  const suggestedQuestions = [
    {
      icon: <Zap className="size-3.5" />,
      text: 'Проанализируй мои расходы за месяц'
    },
    {
      icon: <Sparkles className="size-3.5" />,
      text: 'Проведи финансовый анализ за прошлый месяц'
    }
  ]

  useEffect(() => {
    if (!open) return
    const token = getAccessToken()
    if (token) {
      connect(token).then(() => {
        if (!connectionError) loadChatData()
      })
    }
  }, [open, connect, loadChatData, connectionError])

  useEffect(() => {
    if (!open) setInput('')
  }, [open])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    if (value.length <= MAX_MESSAGE_LENGTH) {
      setInput(value)
    }
  }

  const handleSend = async () => {
    if (!input.trim() || !isConnected) return
    if (messages.length >= 6) {
      setShowClearDialog(true)
      return
    }
    await sendMessage(input.trim())
    setInput('')
  }

  const handleSuggestedClick = (q: string) => {
    setInput(q.slice(0, MAX_MESSAGE_LENGTH))
  }

  const isOverLimit = input.length > MAX_MESSAGE_LENGTH
  const remainingChars = MAX_MESSAGE_LENGTH - input.length
  const isSendDisabled =
    isLoading ||
    !input.trim() ||
    !isConnected ||
    !!connectionError ||
    isOverLimit

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-md p-2 sm:p-4">
      <div className="bg-gradient-to-br from-background via-background to-muted/50 w-full max-w-md sm:max-w-5xl h-[90vh] max-h-[800px] flex flex-col rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-300 border border-white/10 dark:border-white/5">
        {/* Header */}
        <div className="relative flex items-center justify-between px-4 sm:px-6 py-4 sm:py-5 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-b border-white/10 dark:border-white/5">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl" />
              <div className="relative bg-gradient-to-br from-primary to-primary/70 p-1.5 sm:p-2 rounded-xl shadow-lg">
                <Sparkles className="size-4 sm:size-5 text-white" />
              </div>
            </div>
            <div>
              <h2 className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent truncate">
                Финансовый помощник
              </h2>
              <div className="flex items-center gap-1.5 sm:gap-2 mt-0.5">
                <div
                  className={`size-1.5 rounded-full ${
                    connectionError
                      ? 'bg-destructive'
                      : isConnected
                        ? 'bg-success'
                        : 'bg-muted-foreground'
                  } animate-pulse`}
                />
                <p className="text-xs text-muted-foreground truncate">
                  {connectionError
                    ? 'Ошибка подключения'
                    : isConnected
                      ? 'Активен'
                      : 'Подключение...'}
                </p>
              </div>
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="rounded-full hover:bg-muted/50 transition-all duration-300 hover:scale-110 cursor-pointer"
          >
            <X className="size-4 sm:size-5" />
          </Button>
        </div>

        {/* Error */}
        {connectionError && (
          <div className="mx-4 sm:mx-6 mt-3 sm:mt-4 p-3 sm:p-4 bg-destructive/10 backdrop-blur-sm border border-destructive/20 rounded-xl text-destructive text-xs sm:text-sm flex items-center justify-between">
            <span className="flex items-center gap-2">
              <div className="size-2 bg-destructive rounded-full animate-pulse" />
              <span className="truncate">{connectionError}</span>
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.location.reload()}
              className="text-destructive hover:bg-destructive/10"
            >
              Перезагрузить
            </Button>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
          <ChatMessages
            messages={messages}
            isLoading={isLoading}
            isThinking={isThinking}
          />

          {messages.length < 3 && (
            <div className="px-4 sm:px-6 pb-4 sm:pb-6">
              <p className="text-xs text-muted-foreground mb-2 sm:mb-3 ml-1">
                Быстрые вопросы
              </p>
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                {suggestedQuestions.map(({ icon, text }) => (
                  <button
                    key={text}
                    onClick={() => handleSuggestedClick(text)}
                    className="group flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-muted/50 hover:bg-muted border border-white/10 dark:border-white/5 text-xs sm:text-sm transition-all duration-300 hover:scale-105 hover:shadow-md cursor-pointer"
                  >
                    <span className="text-primary transition-transform group-hover:rotate-12">
                      {icon}
                    </span>
                    <span className="text-foreground/80 group-hover:text-foreground truncate max-w-[180px] sm:max-w-none">
                      {text}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="border-t border-white/10 dark:border-white/5 bg-gradient-to-t from-background to-transparent p-4 sm:p-6">
          <div className="relative flex flex-col gap-1.5 sm:gap-2">
            <div className="relative flex gap-2 sm:gap-3">
              <div className="relative flex-1">
                <Input
                  value={input}
                  onChange={handleInputChange}
                  placeholder={`Напишите ваш вопрос...`}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      e.stopPropagation()
                      handleSend()
                    }
                  }}
                  disabled={isLoading || !isConnected || !!connectionError}
                  className={`text-xs sm:text-base h-12 sm:h-14 px-3 sm:px-6 pr-10 sm:pr-20 rounded-xl bg-muted/30 border-white/10 dark:border-white/5 focus:border-primary/50 transition-all duration-300 ${
                    isOverLimit
                      ? 'border-destructive focus:border-destructive'
                      : ''
                  }`}
                />
                <div className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  {input.length > 0 && (
                    <div
                      className={`text-[10px] sm:text-xs font-mono px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md ${
                        remainingChars <= 10
                          ? 'text-destructive bg-destructive/10'
                          : remainingChars <= 20
                            ? 'text-warning bg-warning/10'
                            : 'text-muted-foreground bg-muted/50'
                      }`}
                    >
                      {remainingChars}
                    </div>
                  )}
                </div>
              </div>

              <Button
                onClick={handleSend}
                disabled={isSendDisabled}
                size="lg"
                className="h-12 sm:h-14 w-12 sm:w-auto sm:px-6 rounded-xl bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
              >
                {isLoading ? (
                  <Loader2 className="size-4 sm:size-5 animate-spin" />
                ) : (
                  <Send className="size-4 sm:size-5" />
                )}
              </Button>
            </div>

            {isOverLimit && (
              <div className="flex items-center gap-1.5 sm:gap-2 text-xs text-destructive animate-in slide-in-from-top-1 fade-in duration-200">
                <AlertCircle className="size-3 sm:size-3.5" />
                <span className="truncate">
                  Превышен лимит в {MAX_MESSAGE_LENGTH} символов
                </span>
              </div>
            )}

            {/* Прогресс-бар лимита */}
            {input.length > 0 && (
              <div className="relative h-1 rounded-full bg-muted overflow-hidden animate-in fade-in duration-300">
                <div
                  className={`h-full transition-all duration-300 rounded-full ${
                    remainingChars >= 20
                      ? 'bg-primary'
                      : remainingChars >= 10
                        ? 'bg-warning'
                        : 'bg-destructive'
                  }`}
                  style={{
                    width: `${(input.length / MAX_MESSAGE_LENGTH) * 100}%`
                  }}
                />
              </div>
            )}
          </div>

          <div className="flex items-center justify-center gap-1.5 sm:gap-2 mt-3 sm:mt-4">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
            <p className="text-[10px] sm:text-xs text-muted-foreground flex items-center gap-1 truncate">
              <Sparkles className="size-2.5 sm:size-3" />
              Помощник анализирует ваши данные
            </p>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
          </div>
        </div>
      </div>

      <ConfirmAlert
        open={showClearDialog}
        onOpenChange={setShowClearDialog}
        title="Очистить чат?"
        description="Чтобы задать новый вопрос, необходимо очистить историю."
        confirmText="Очистить"
        cancelText="Отмена"
        onConfirm={async () => {
          await clearChat()
          setShowClearDialog(false)
        }}
      />
    </div>
  )
}
