'use client'

import { cn } from '@/lib/utils'
import { Bot, Sparkles, User } from 'lucide-react'
import { useEffect, useRef } from 'react'
import ReactMarkdown from 'react-markdown'

import type { ChatMessage } from '@/types/chat.types'

export default function ChatMessages({
  messages,
  isLoading,
  isThinking
}: {
  messages: ChatMessage[]
  isLoading: boolean
  isThinking: boolean
}) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Компоненты для кастомизации рендеринга Markdown
  const markdownComponents = {
    p: ({ node, className, children, ...props }: any) => (
      <p
        className={cn('mb-2 last:mb-0', className)}
        {...props}
      >
        {children}
      </p>
    ),
    code: ({ node, className, children, ...props }: any) => (
      <code
        className={cn(
          'bg-muted px-2 py-0.5 rounded-md text-xs font-mono',
          className
        )}
        {...props}
      >
        {children}
      </code>
    ),
    pre: ({ node, className, children, ...props }: any) => (
      <pre
        className={cn(
          'bg-muted p-3 rounded-md overflow-x-auto text-xs my-2',
          className
        )}
        {...props}
      >
        {children}
      </pre>
    ),
    a: ({ node, className, children, ...props }: any) => (
      <a
        className={cn('text-primary underline hover:no-underline', className)}
        {...props}
      >
        {children}
      </a>
    ),
    ul: ({ node, className, children, ...props }: any) => (
      <ul
        className={cn('list-disc list-inside my-2 pl-4', className)}
        {...props}
      >
        {children}
      </ul>
    ),
    ol: ({ node, className, children, ...props }: any) => (
      <ol
        className={cn('list-decimal list-inside my-2 pl-4', className)}
        {...props}
      >
        {children}
      </ol>
    ),
    li: ({ node, className, children, ...props }: any) => (
      <li
        className={cn('my-1', className)}
        {...props}
      >
        {children}
      </li>
    ),
    blockquote: ({ node, className, children, ...props }: any) => (
      <blockquote
        className={cn(
          'border-l-2 border-primary pl-3 my-2 text-muted-foreground',
          className
        )}
        {...props}
      >
        {children}
      </blockquote>
    ),
    h1: ({ node, className, children, ...props }: any) => (
      <h1
        className={cn('text-xl font-bold my-2', className)}
        {...props}
      >
        {children}
      </h1>
    ),
    h2: ({ node, className, children, ...props }: any) => (
      <h2
        className={cn('text-lg font-bold my-2', className)}
        {...props}
      >
        {children}
      </h2>
    ),
    h3: ({ node, className, children, ...props }: any) => (
      <h3
        className={cn('text-base font-bold my-2', className)}
        {...props}
      >
        {children}
      </h3>
    ),
    hr: ({ node, className, ...props }: any) => (
      <hr
        className={cn('border-t border-muted my-3', className)}
        {...props}
      />
    ),
    strong: ({ node, className, children, ...props }: any) => (
      <strong
        className={cn('font-bold', className)}
        {...props}
      >
        {children}
      </strong>
    ),
    em: ({ node, className, children, ...props }: any) => (
      <em
        className={cn('italic', className)}
        {...props}
      >
        {children}
      </em>
    )
  }

  return (
    <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 space-y-3 sm:space-y-4 scrollbar-thin flex flex-col">
      {messages.length === 0 && !isLoading && !isThinking && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-3 sm:space-y-4 max-w-md mx-auto">
            <div className="relative inline-block">
              <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl" />
              <div className="relative bg-gradient-to-br from-primary/10 to-primary/5 p-4 sm:p-6 rounded-full">
                <Sparkles className="size-8 sm:size-12 text-primary" />
              </div>
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-semibold mb-1 sm:mb-2">
                Начните общение
              </h3>
              <p className="text-muted-foreground text-xs sm:text-sm">
                Задайте вопрос о ваших финансах, и я помогу вам разобраться
              </p>
            </div>
          </div>
        </div>
      )}

      {messages.map((msg, index) => (
        <div
          key={msg.id}
          className={cn(
            'flex gap-2 sm:gap-3 animate-in slide-in-from-bottom-2 fade-in duration-300',
            msg.isUser ? 'justify-end' : 'justify-start'
          )}
          style={{ animationDelay: `${index * 50}ms` }}
        >
          {!msg.isUser && (
            <div className="flex-shrink-0 size-6 sm:size-8 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center mt-0.5 sm:mt-1">
              <Bot className="size-3 sm:size-4 text-primary" />
            </div>
          )}

          <div
            className={cn(
              'max-w-[90%] sm:max-w-[80%] rounded-2xl px-3 sm:px-5 py-2 sm:py-3 shadow-sm transition-all duration-200',
              msg.isUser
                ? 'bg-gradient-to-r from-primary to-primary/90 text-primary-foreground'
                : 'bg-muted/50 backdrop-blur-sm border border-white/10 dark:border-white/5'
            )}
          >
            {msg.content ? (
              <ReactMarkdown components={markdownComponents}>
                {msg.content}
              </ReactMarkdown>
            ) : (
              !msg.isUser &&
              msg.isPending && (
                <div className="mt-1.5 sm:mt-2 flex gap-1">
                  <div className="w-1.5 sm:w-2 h-1.5 sm:h-2 bg-muted-foreground rounded-full animate-bounce" />
                  <div className="w-1.5 sm:w-2 h-1.5 sm:h-2 bg-muted-foreground rounded-full animate-bounce delay-150" />
                  <div className="w-1.5 sm:w-2 h-1.5 sm:h-2 bg-muted-foreground rounded-full animate-bounce delay-300" />
                </div>
              )
            )}
            {msg.isPending && msg.content && (
              <span className="inline-block w-1.5 h-4 bg-current animate-pulse ml-1" />
            )}
          </div>

          {msg.isUser && (
            <div className="flex-shrink-0 size-6 sm:size-8 rounded-full bg-gradient-to-br from-primary/30 to-primary/20 flex items-center justify-center mt-0.5 sm:mt-1">
              <User className="size-3 sm:size-4 text-primary" />
            </div>
          )}
        </div>
      ))}

      {isLoading && !messages.some(m => m.isPending) && (
        <div className="flex justify-start gap-2 sm:gap-3 animate-in slide-in-from-bottom-2 fade-in duration-300">
          <div className="flex-shrink-0 size-6 sm:size-8 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
            <Bot className="size-3 sm:size-4 text-primary" />
          </div>
          <div className="bg-muted/50 backdrop-blur-sm rounded-2xl px-3 sm:px-5 py-2 sm:py-3 border border-white/10 dark:border-white/5">
            <div className="flex gap-1">
              <div className="w-1.5 sm:w-2 h-1.5 sm:h-2 bg-muted-foreground rounded-full animate-bounce" />
              <div className="w-1.5 sm:w-2 h-1.5 sm:h-2 bg-muted-foreground rounded-full animate-bounce delay-150" />
              <div className="w-1.5 sm:w-2 h-1.5 sm:h-2 bg-muted-foreground rounded-full animate-bounce delay-300" />
            </div>
          </div>
        </div>
      )}

      {isThinking && (
        <div className="flex justify-start gap-2 sm:gap-3 animate-in slide-in-from-bottom-2 fade-in duration-300">
          <div className="flex-shrink-0 size-6 sm:size-8 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
            <Bot className="size-3 sm:size-4 text-primary" />
          </div>
          <div className="bg-muted/50 backdrop-blur-sm rounded-2xl px-3 sm:px-5 py-2 sm:py-3 border border-white/10 dark:border-white/5">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="text-xs sm:text-sm text-muted-foreground">
                ИИ анализирует
              </span>
              <div className="flex gap-1">
                <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" />
                <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce delay-150" />
                <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce delay-300" />
              </div>
            </div>
          </div>
        </div>
      )}

      <div
        ref={bottomRef}
        className="h-2"
      />
    </div>
  )
}
