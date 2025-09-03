'use client'

import styles from './DeleteButton.module.scss'
import { Trash2 } from 'lucide-react'
import { ButtonHTMLAttributes, PropsWithChildren } from 'react'

export interface DeleteButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  isPending?: boolean
}

export function DeleteButton({
  children,
  className = '',
  isPending = false,
  disabled,
  ...rest
}: PropsWithChildren<DeleteButtonProps>) {
  return (
    <button
      className={`${styles.deleteButton} ${className} ${disabled || isPending ? styles.disabled : ''}`}
      disabled={disabled || isPending}
      {...rest}
    >
      {isPending ? (
        <svg
          className="animate-spin h-5 w-5 text-white mr-2"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
      ) : (
        <Trash2
          size={18}
          className={styles.icon}
        />
      )}
      {children}
    </button>
  )
}
