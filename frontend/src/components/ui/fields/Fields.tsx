'use client'

import styles from './Field.module.scss'
import { forwardRef } from 'react'

// отдельный scss для полей или можно импортировать Auth.module.scss

interface InputFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  id: string
  label: string
  error?: string
  placeholder?: string
  variant?: 'default' | 'outlined'
  state?: 'error' | 'success'
  isNumber?: boolean
}

export const Field = forwardRef<HTMLInputElement, InputFieldProps>(
  (
    {
      id,
      label,
      error,
      placeholder,
      variant = 'default',
      state,
      isNumber,
      ...rest
    },
    ref
  ) => {
    const borderClass =
      state === 'error'
        ? 'border-[var(--accent-red)]'
        : state === 'success'
          ? 'border-[var(--accent-green)]'
          : ''

    return (
      <div className={`${styles.formField}`}>
        <label
          htmlFor={id}
          className="block text-sm font-medium mb-2"
        >
          {label}
        </label>
        <input
          ref={ref}
          id={id}
          placeholder={placeholder}
          type={isNumber ? 'number' : rest.type || 'text'}
          className={`${styles.input} w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent ${borderClass}`}
          {...rest}
        />

        {error && (
          <p
            className="mt-1 text-sm text-[var(--accent-red)]"
            id={`${id}-error`}
          >
            {error}
          </p>
        )}
      </div>
    )
  }
)

Field.displayName = 'Field'
