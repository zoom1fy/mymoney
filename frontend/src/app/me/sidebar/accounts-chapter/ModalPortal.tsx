'use client'

import styles from './CreateAccountModal.module.scss'
import { FC, ReactNode, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

// можно использовать существующие стили

interface ModalPortalProps {
  isOpen: boolean
  onClose: () => void
  children: ReactNode
}

export const ModalPortal: FC<ModalPortalProps> = ({
  isOpen,
  onClose,
  children
}) => {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!isOpen || !mounted) return null

  return createPortal(
    <div
      className={styles.overlay}
      onClick={onClose}
    >
      <div
        className={styles.modal}
        onClick={e => e.stopPropagation()}
      >
        {children}
      </div>
    </div>,
    document.body
  )
}
