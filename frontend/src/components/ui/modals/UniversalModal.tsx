'use client'

import { Button } from '../buttons/Button'
import styles from './UniversalModal.module.scss'
import { X } from 'lucide-react'
import { ReactNode, useEffect, useState } from 'react'

export interface FieldConfig {
  name: string
  label: string
  type:
    | 'text'
    | 'number'
    | 'email'
    | 'password'
    | 'select'
    | 'textarea'
    | 'checkbox'
  placeholder?: string
  required?: boolean
  options?: Array<{ value: string | number; label: string }>
  defaultValue?: any
  validation?: (value: any) => string | null
}

export interface UniversalModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  headerActions?: ReactNode
  fields: FieldConfig[]
  onSubmit: (data: Record<string, any>) => Promise<void> | void
  submitText?: string
  cancelText?: string
  loading?: boolean
  children?: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

export const UniversalModal: React.FC<UniversalModalProps> = ({
  isOpen,
  onClose,
  title,
  headerActions, // Добавлено в деструктуризацию
  fields,
  onSubmit,
  submitText = 'Сохранить',
  cancelText = 'Отмена',
  loading = false,
  children,
  size = 'lg'
}) => {
  const [formData, setFormData] = useState<Record<string, any>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    if (!isOpen) return
    const initialData: Record<string, any> = {}
    fields.forEach(field => {
      initialData[field.name] = field.defaultValue ?? ''
    })
    setFormData(initialData)
  }, [isOpen])

  useEffect(() => {
    const checkScreen = () => setIsMobile(window.innerWidth < 768)
    checkScreen()
    window.addEventListener('resize', checkScreen)
    return () => window.removeEventListener('resize', checkScreen)
  }, [])

  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  const handleChange = (name: string, value: any, type?: string) => {
    const newValue = type === 'number' ? Number(value) : value
    setFormData(prev => ({ ...prev, [name]: newValue }))
    if (errors[name]) {
      const fieldConfig = fields.find(f => f.name === name)
      if (fieldConfig?.validation) {
        const error = fieldConfig.validation(newValue)
        setErrors(prev => ({ ...prev, [name]: error || '' }))
      }
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}
    fields.forEach(field => {
      if (field.required && !formData[field.name]) {
        newErrors[field.name] = 'Это поле обязательно'
      } else if (field.validation) {
        const error = field.validation(formData[field.name])
        if (error) {
          newErrors[field.name] = error
        }
      }
    })
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return
    try {
      await onSubmit(formData)
    } catch (error) {
      console.error('Ошибка при отправке формы:', error)
    }
  }

  if (!isOpen) return null

  return (
    <div
      className={styles.overlay}
      onClick={onClose}
    >
      <div
        className={`${styles.modal} ${styles[size]} ${isMobile ? styles.mobile : styles.desktop}`}
        onClick={e => e.stopPropagation()}
      >
        <div className={styles.header}>
          <h3 className={styles.title}>{title}</h3>
          {headerActions && (
            <div className={styles.headerActions}>{headerActions}</div>
          )}
          <button
            className={styles.closeButton}
            onClick={onClose}
            type="button"
          >
            <X size={20} />
          </button>
        </div>
        <form
          onSubmit={handleSubmit}
          className={styles.form}
        >
          <div className={styles.fields}>
            {fields.map(field => (
              <div
                key={field.name}
                className={styles.field}
              >
                <label className={styles.label}>
                  {field.label}
                  {field.required && <span className={styles.required}>*</span>}
                </label>
                {field.type === 'select' ? (
                  <select
                    name={field.name}
                    value={formData[field.name] || ''}
                    onChange={e => handleChange(field.name, e.target.value)}
                    className={`${styles.selectField} ${errors[field.name] ? styles.error : ''}`}
                  >
                    <option value="">Выберите...</option>
                    {field.options?.map(option => (
                      <option
                        key={String(option.value)}
                        value={option.value}
                      >
                        {option.label}
                      </option>
                    ))}
                  </select>
                ) : field.type === 'textarea' ? (
                  <textarea
                    name={field.name}
                    placeholder={field.placeholder}
                    value={formData[field.name] || ''}
                    onChange={e => handleChange(field.name, e.target.value)}
                    className={`${styles.textareaField} ${errors[field.name] ? styles.error : ''}`}
                    rows={4}
                  />
                ) : field.type === 'checkbox' ? (
                  <div>
                    <input
                      type="checkbox"
                      name={field.name}
                      checked={!!formData[field.name]}
                      onChange={e => handleChange(field.name, e.target.checked)}
                      className={styles.checkbox}
                    />
                  </div>
                ) : (
                  <input
                    type={field.type}
                    name={field.name}
                    placeholder={field.placeholder}
                    value={formData[field.name] ?? ''}
                    onChange={e =>
                      handleChange(field.name, e.target.value, field.type)
                    }
                    className={`${styles.inputField} ${errors[field.name] ? styles.error : ''}`}
                  />
                )}
                {errors[field.name] && (
                  <span className={styles.errorText}>{errors[field.name]}</span>
                )}
              </div>
            ))}
          </div>
          {children && <div className={styles.children}>{children}</div>}
          <div className={styles.actions}>
            <Button
              type="button"
              onClick={onClose}
              disabled={loading}
            >
              {cancelText}
            </Button>
            <Button
              type="submit"
              disabled={loading}
              isPending={loading}
            >
              {submitText}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
