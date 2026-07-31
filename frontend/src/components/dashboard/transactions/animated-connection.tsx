'use client'

import {
  motion,
  useAnimationFrame,
  useMotionValue,
  useTransform,
  type MotionValue
} from 'framer-motion'
import { useEffect, useRef, useState, type RefObject } from 'react'

import { cn } from '@/lib/cn'

export interface ConnectionPoint {
  x: number
  y: number
}

export type ConnectionEdge = 'left' | 'right' | 'center'

interface ConnectionPoints {
  startX: number
  startY: number
  endX: number
  endY: number
}

interface AnimatedConnectionProps {
  className?: string
  from?: ConnectionPoint
  to?: ConnectionPoint
  fromRef?: RefObject<HTMLElement | null>
  toRef?: RefObject<HTMLElement | null>
  fromEdge?: ConnectionEdge
  toEdge?: ConnectionEdge
  duration?: number
  morphKey?: string | number
}

interface FlowParticleProps {
  pathRef: RefObject<SVGPathElement | null>
  duration: number
  offset: number
}

const PARTICLE_COUNT = 3
const PARTICLE_RADIUS = 2
const NODE_RADIUS = 2.5

const DEFAULT_FROM: ConnectionPoint = { x: 0, y: 50 }
const DEFAULT_TO: ConnectionPoint = { x: 100, y: 50 }

function usePathPoint(
  pathRef: RefObject<SVGPathElement | null>,
  progress: MotionValue<number>
) {
  const readPoint = (value: number) => {
    const path = pathRef.current
    if (!path) return { x: 0, y: 0 }
    const point = path.getPointAtLength(value * path.getTotalLength())
    return { x: point.x, y: point.y }
  }

  const x = useTransform(progress, (value) => readPoint(value).x)
  const y = useTransform(progress, (value) => readPoint(value).y)

  return { x, y }
}

function FlowParticle({ pathRef, duration, offset }: FlowParticleProps) {
  const progress = useMotionValue(offset)
  const { x, y } = usePathPoint(pathRef, progress)

  useAnimationFrame((_, delta) => {
    progress.set((progress.get() + delta / (duration * 1000)) % 1)
  })

  return (
    <motion.circle
      className="fill-primary opacity-70 transition-opacity duration-300 group-hover:opacity-100"
      cx={x}
      cy={y}
      r={PARTICLE_RADIUS}
    />
  )
}

function PulseNode({ cx, cy }: { cx: number; cy: number }) {
  return (
    <>
      <circle
        cx={cx}
        cy={cy}
        fill="var(--color-primary)"
        opacity={0.35}
        r={NODE_RADIUS}
      />
      <motion.circle
        animate={{ opacity: [0.35, 1, 0.35] }}
        cx={cx}
        cy={cy}
        fill="var(--color-primary)"
        r={NODE_RADIUS}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      />
    </>
  )
}

export function AnimatedConnection({
  className,
  from = DEFAULT_FROM,
  to = DEFAULT_TO,
  fromRef,
  toRef,
  fromEdge = 'center',
  toEdge = 'center',
  duration = 2.2,
  morphKey
}: AnimatedConnectionProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const pathRef = useRef<SVGPathElement>(null)
  const [points, setPoints] = useState<ConnectionPoints>({
    startX: 0,
    startY: 0,
    endX: 0,
    endY: 0
  })
  const [size, setSize] = useState({ width: 0, height: 0 })

  // Read the latest props from inside rAF/ResizeObserver callbacks without re-subscribing the effect
  const latestProps = useRef({ from, to, fromRef, toRef, fromEdge, toEdge })
  latestProps.current = { from, to, fromRef, toRef, fromEdge, toEdge }

  // Track the last measured values so unchanged frames can skip state updates entirely
  const lastPointsRef = useRef<ConnectionPoints>(points)
  const lastSizeRef = useRef(size)

  useEffect(() => {
    const svg = svgRef.current
    if (!svg) return

    let frame = 0
    let isMounted = true
    const startedAt = performance.now()
    let lastChangeAt = performance.now()

    const measure = () => {
      const { from, to, fromRef, toRef, fromEdge, toEdge } = latestProps.current
      const svgRect = svg.getBoundingClientRect()

      const getEdgeX = (rect: DOMRect, edge: ConnectionEdge) => {
        if (edge === 'left') return rect.left
        if (edge === 'right') return rect.right
        return rect.left + rect.width / 2
      }

      const measureAnchor = (
        ref: RefObject<HTMLElement | null>,
        edge: ConnectionEdge
      ) => {
        const element = ref?.current
        if (!element) return null
        const rect = element.getBoundingClientRect()
        return {
          x: getEdgeX(rect, edge) - svgRect.left,
          y: rect.top + rect.height / 2 - svgRect.top
        }
      }

      const fromPoint = fromRef ? measureAnchor(fromRef, fromEdge) : null
      const toPoint = toRef ? measureAnchor(toRef, toEdge) : null

      const nextSize = { width: svgRect.width, height: svgRect.height }
      const nextPoints: ConnectionPoints = {
        startX: fromPoint?.x ?? (from.x / 100) * svgRect.width,
        startY: fromPoint?.y ?? (from.y / 100) * svgRect.height,
        endX: toPoint?.x ?? (to.x / 100) * svgRect.width,
        endY: toPoint?.y ?? (to.y / 100) * svgRect.height
      }

      const sizeChanged =
        Math.abs(nextSize.width - lastSizeRef.current.width) > 0.5 ||
        Math.abs(nextSize.height - lastSizeRef.current.height) > 0.5

      const pointsChanged = (
        ['startX', 'startY', 'endX', 'endY'] as const
      ).some((key) => Math.abs(nextPoints[key] - lastPointsRef.current[key]) > 0.5)

      if (sizeChanged || pointsChanged) {
        lastChangeAt = performance.now()
        if (sizeChanged) {
          lastSizeRef.current = nextSize
          setSize(nextSize)
        }
        if (pointsChanged) {
          lastPointsRef.current = nextPoints
          setPoints(nextPoints)
        }
      }
    }

    // Re-measure on each frame until the layout stops shifting (modal open animation) or 1.5s elapses
    const settle = () => {
      if (!isMounted) return
      measure()
      const elapsed = performance.now() - startedAt
      const stableFor = performance.now() - lastChangeAt
      if (elapsed < 1500 && stableFor < 250) {
        frame = requestAnimationFrame(settle)
      }
    }
    frame = requestAnimationFrame(settle)

    const targets: (Element | null)[] = [
      svg,
      latestProps.current.fromRef?.current ?? null,
      latestProps.current.toRef?.current ?? null
    ]
    const observer = new ResizeObserver(measure)
    targets.forEach((target) => {
      if (target) observer.observe(target)
    })

    return () => {
      isMounted = false
      cancelAnimationFrame(frame)
      observer.disconnect()
    }
  }, [])

  const { startX, startY, endX, endY } = points
  const dx = endX - startX
  // Gentle vertical bulge proportional to the container height keeps the curve readable
  const curve = Math.min(18, Math.max(8, size.height * 0.12))

  const pathData =
    size.width > 0
      ? `M ${startX} ${startY} C ${startX + dx * 0.25} ${startY + curve}, ${
          startX + dx * 0.75
        } ${endY - curve}, ${endX} ${endY}`
      : 'M 0 0'

  return (
    <svg
      className={cn('absolute pointer-events-none overflow-visible', className)}
      fill="none"
      height="100%"
      ref={svgRef}
      width="100%"
    >
      <motion.path
        animate={{ pathLength: 1 }}
        className="stroke-border/40 transition-colors duration-300 group-hover:stroke-primary/50"
        d={pathData}
        initial={{ pathLength: 0 }}
        key={morphKey}
        ref={pathRef}
        strokeLinecap="round"
        strokeWidth={1.5}
        transition={{ duration: 0.6, ease: 'easeInOut' }}
        vectorEffect="non-scaling-stroke"
      />

      {Array.from({ length: PARTICLE_COUNT }).map((_, index) => (
        <FlowParticle
          duration={duration}
          key={index}
          offset={index / PARTICLE_COUNT}
          pathRef={pathRef}
        />
      ))}

      <PulseNode cx={startX} cy={startY} />
      <PulseNode cx={endX} cy={endY} />
    </svg>
  )
}
