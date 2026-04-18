import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useIsMobile } from '@/hooks/use-mobile'

interface Particle {
  id: number
  x: number
  y: number
  size: number
  color: string
  rotation: number
  delay: number
}

export function CursorSparkles() {
  const [particles, setParticles] = useState<Particle[]>([])
  const particleIdRef = useRef(0)
  const lastEmitTime = useRef(0)
  const isMobile = useIsMobile()

  useEffect(() => {
    if (isMobile) return

    const colors = [
      'oklch(0.75 0.20 330)',
      'oklch(0.70 0.25 190)',
      'oklch(0.70 0.28 60)',
      'oklch(0.80 0.30 330)',
      'oklch(0.65 0.22 280)',
      'oklch(0.98 0.02 280)',
    ]

    const handleMouseMove = (e: MouseEvent) => {
      const now = Date.now()
      if (now - lastEmitTime.current < 30) return
      lastEmitTime.current = now

      const newParticles: Particle[] = []
      const particleCount = Math.random() > 0.7 ? 2 : 1

      for (let i = 0; i < particleCount; i++) {
        newParticles.push({
          id: particleIdRef.current++,
          x: e.clientX + (Math.random() - 0.5) * 10,
          y: e.clientY + (Math.random() - 0.5) * 10,
          size: Math.random() * 6 + 4,
          color: colors[Math.floor(Math.random() * colors.length)],
          rotation: Math.random() * 360,
          delay: Math.random() * 0.1,
        })
      }

      setParticles((prev) => [...prev, ...newParticles].slice(-50))
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [isMobile])

  useEffect(() => {
    if (particles.length === 0) return

    const timeout = setTimeout(() => {
      setParticles((prev) => prev.slice(1))
    }, 1000)

    return () => clearTimeout(timeout)
  }, [particles])

  if (isMobile) return null

  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      <AnimatePresence>
        {particles.map((particle) => (
          <motion.div
            key={particle.id}
            initial={{
              x: particle.x,
              y: particle.y,
              scale: 0,
              opacity: 1,
              rotate: particle.rotation,
            }}
            animate={{
              x: particle.x + (Math.random() - 0.5) * 100,
              y: particle.y - Math.random() * 100 - 50,
              scale: [0, 1, 0],
              opacity: [0, 1, 0],
              rotate: particle.rotation + (Math.random() - 0.5) * 180,
            }}
            exit={{
              opacity: 0,
              scale: 0,
            }}
            transition={{
              duration: 0.8,
              delay: particle.delay,
              ease: 'easeOut',
            }}
            className="absolute"
            style={{
              width: particle.size,
              height: particle.size,
            }}
          >
            <svg
              width={particle.size}
              height={particle.size}
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M10 0L11.5 7.5L10 10L8.5 7.5L10 0Z"
                fill={particle.color}
                opacity={0.9}
              />
              <path
                d="M10 10L11.5 12.5L10 20L8.5 12.5L10 10Z"
                fill={particle.color}
                opacity={0.9}
              />
              <path
                d="M0 10L7.5 8.5L10 10L7.5 11.5L0 10Z"
                fill={particle.color}
                opacity={0.9}
              />
              <path
                d="M10 10L12.5 8.5L20 10L12.5 11.5L10 10Z"
                fill={particle.color}
                opacity={0.9}
              />
              <circle
                cx="10"
                cy="10"
                r="2"
                fill={particle.color}
                opacity={1}
              />
            </svg>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
