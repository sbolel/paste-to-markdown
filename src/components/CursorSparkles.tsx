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
  velocityX: number
  velocityY: number
  type: 'sparkle' | 'star' | 'dot' | 'cross'
  glowIntensity: number
}

export function CursorSparkles() {
  const [particles, setParticles] = useState<Particle[]>([])
  const particleIdRef = useRef(0)
  const lastEmitTime = useRef(0)
  const isMobile = useIsMobile()

  useEffect(() => {
    if (isMobile) return

    const colors = [
      'oklch(0.80 0.25 330)',
      'oklch(0.75 0.28 190)',
      'oklch(0.78 0.30 60)',
      'oklch(0.85 0.32 330)',
      'oklch(0.72 0.26 280)',
      'oklch(0.98 0.05 280)',
      'oklch(0.88 0.28 350)',
      'oklch(0.82 0.30 200)',
    ]

    const particleTypes: Array<'sparkle' | 'star' | 'dot' | 'cross'> = ['sparkle', 'star', 'dot', 'cross']

    const handleMouseMove = (e: MouseEvent) => {
      const now = Date.now()
      if (now - lastEmitTime.current < 16) return
      lastEmitTime.current = now

      const newParticles: Particle[] = []
      const particleCount = Math.random() > 0.5 ? 3 : 2

      for (let i = 0; i < particleCount; i++) {
        const angle = Math.random() * Math.PI * 2
        const velocity = Math.random() * 3 + 1
        const spread = 20

        newParticles.push({
          id: particleIdRef.current++,
          x: e.clientX + (Math.random() - 0.5) * spread,
          y: e.clientY + (Math.random() - 0.5) * spread,
          size: Math.random() * 10 + 6,
          color: colors[Math.floor(Math.random() * colors.length)],
          rotation: Math.random() * 360,
          delay: Math.random() * 0.05,
          velocityX: Math.cos(angle) * velocity,
          velocityY: Math.sin(angle) * velocity,
          type: particleTypes[Math.floor(Math.random() * particleTypes.length)],
          glowIntensity: Math.random() * 0.5 + 0.5,
        })
      }

      setParticles((prev) => [...prev, ...newParticles].slice(-100))
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [isMobile])

  useEffect(() => {
    if (particles.length === 0) return

    const timeout = setTimeout(() => {
      setParticles((prev) => prev.slice(1))
    }, 1200)

    return () => clearTimeout(timeout)
  }, [particles])

  if (isMobile) return null

  const renderParticle = (particle: Particle) => {
    const { type, size, color } = particle

    switch (type) {
      case 'sparkle':
        return (
          <svg
            width={size}
            height={size}
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{
              filter: `drop-shadow(0 0 ${particle.glowIntensity * 4}px ${color}) drop-shadow(0 0 ${particle.glowIntensity * 2}px ${color})`,
            }}
          >
            <path
              d="M10 0L11.2 7.8L10 10L8.8 7.8L10 0Z"
              fill={color}
              opacity={0.95}
            />
            <path
              d="M10 10L11.2 12.2L10 20L8.8 12.2L10 10Z"
              fill={color}
              opacity={0.95}
            />
            <path
              d="M0 10L7.8 8.8L10 10L7.8 11.2L0 10Z"
              fill={color}
              opacity={0.95}
            />
            <path
              d="M10 10L12.2 8.8L20 10L12.2 11.2L10 10Z"
              fill={color}
              opacity={0.95}
            />
            <circle
              cx="10"
              cy="10"
              r="2.5"
              fill={color}
              opacity={1}
            />
          </svg>
        )
      case 'star':
        return (
          <svg
            width={size}
            height={size}
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{
              filter: `drop-shadow(0 0 ${particle.glowIntensity * 3}px ${color})`,
            }}
          >
            <path
              d="M10 2L11.5 8L10 10L8.5 8L10 2Z"
              fill={color}
              opacity={0.9}
            />
            <path
              d="M10 10L11.5 12L10 18L8.5 12L10 10Z"
              fill={color}
              opacity={0.9}
            />
            <path
              d="M2 10L8 8.5L10 10L8 11.5L2 10Z"
              fill={color}
              opacity={0.9}
            />
            <path
              d="M10 10L12 8.5L18 10L12 11.5L10 10Z"
              fill={color}
              opacity={0.9}
            />
            <path
              d="M4 4L7.5 7.5L10 10L7.5 7.5L4 4Z"
              fill={color}
              opacity={0.7}
            />
            <path
              d="M16 4L12.5 7.5L10 10L12.5 7.5L16 4Z"
              fill={color}
              opacity={0.7}
            />
            <path
              d="M4 16L7.5 12.5L10 10L7.5 12.5L4 16Z"
              fill={color}
              opacity={0.7}
            />
            <path
              d="M16 16L12.5 12.5L10 10L12.5 12.5L16 16Z"
              fill={color}
              opacity={0.7}
            />
          </svg>
        )
      case 'dot':
        return (
          <svg
            width={size}
            height={size}
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{
              filter: `drop-shadow(0 0 ${particle.glowIntensity * 5}px ${color}) drop-shadow(0 0 ${particle.glowIntensity * 3}px ${color})`,
            }}
          >
            <circle
              cx="10"
              cy="10"
              r="6"
              fill={color}
              opacity={0.95}
            />
            <circle
              cx="10"
              cy="10"
              r="3"
              fill="white"
              opacity={0.6}
            />
          </svg>
        )
      case 'cross':
        return (
          <svg
            width={size}
            height={size}
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{
              filter: `drop-shadow(0 0 ${particle.glowIntensity * 4}px ${color})`,
            }}
          >
            <rect
              x="8"
              y="2"
              width="4"
              height="16"
              fill={color}
              opacity={0.9}
              rx="2"
            />
            <rect
              x="2"
              y="8"
              width="16"
              height="4"
              fill={color}
              opacity={0.9}
              rx="2"
            />
          </svg>
        )
    }
  }

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
              opacity: 0,
              rotate: particle.rotation,
            }}
            animate={{
              x: particle.x + particle.velocityX * 40,
              y: particle.y + particle.velocityY * 40 - 60,
              scale: [0, 1.2, 1, 0.8, 0],
              opacity: [0, 1, 1, 0.8, 0],
              rotate: particle.rotation + particle.velocityX * 120,
            }}
            exit={{
              opacity: 0,
              scale: 0,
            }}
            transition={{
              duration: 1.2,
              delay: particle.delay,
              ease: [0.23, 1, 0.32, 1],
              scale: {
                times: [0, 0.2, 0.5, 0.8, 1],
                ease: 'easeOut',
              },
              opacity: {
                times: [0, 0.2, 0.6, 0.9, 1],
                ease: 'easeInOut',
              },
            }}
            className="absolute will-change-transform"
            style={{
              width: particle.size,
              height: particle.size,
            }}
          >
            {renderParticle(particle)}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
