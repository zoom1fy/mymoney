'use client'

import styles from './Home.module.scss'
import { Github } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

const benefits = [
  'Управляйте своими финансами легко',
  'Отслеживайте доходы и расходы',
  'Ставьте цели и планируйте сбережения',
  'Будьте в курсе всех своих счетов'
]

export default function Home() {
  const [text, setText] = useState('')
  const [index, setIndex] = useState(0)
  const [isDeleting, setIsDeleting] = useState(false)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const wrapperRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  // Эффект набора текста
  useEffect(() => {
    const current = benefits[index % benefits.length]
    let speed = 100

    const timer = setTimeout(
      () => {
        if (isDeleting) {
          setText(prev => prev.slice(0, -1))
        } else {
          setText(prev => current.slice(0, prev.length + 1))
        }

        if (!isDeleting && text === current) {
          setTimeout(() => setIsDeleting(true), 1500)
        } else if (isDeleting && text === '') {
          setIsDeleting(false)
          setIndex(prev => prev + 1)
        }
      },
      isDeleting ? speed / 2 : speed
    )

    return () => clearTimeout(timer)
  }, [text, isDeleting, index])

  // Параллакс-эффект для фона
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (wrapperRef.current) {
        const rect = wrapperRef.current.getBoundingClientRect()
        const x = (e.clientX - rect.left) / rect.width
        const y = (e.clientY - rect.top) / rect.height
        setMousePos({ x, y })
      }
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  return (
    <div
      className={styles.wrapper}
      ref={wrapperRef}
      style={{
        backgroundPosition: `${50 + mousePos.x * 10}% ${50 + mousePos.y * 10}%`
      }}
    >
      <div className={styles.hero}>
        <h1 className={styles.title}>MyMoney</h1>
        <div className={styles.typing}>{text}</div>
        <button
          className={styles.button}
          onClick={() => router.push('/me')}
        >
          Перейти к моим счетам
        </button>
      </div>

      <a
        href="https://github.com/zoom1fy/mymoney"
        target="_blank"
        rel="noopener noreferrer"
        className={styles.githubBadge}
      >
        <Github size={24} />
      </a>
    </div>
  )
}
