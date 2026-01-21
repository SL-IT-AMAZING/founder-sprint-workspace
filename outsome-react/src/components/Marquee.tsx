import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

interface MarqueeProps {
  children: ReactNode
  duration?: number
  reverse?: boolean
  className?: string
}

export function Marquee({
  children,
  duration = 40,
  reverse = false,
  className = '',
}: MarqueeProps) {
  return (
    <div className={`marquee ${className}`}>
      <motion.div
        className="marquee-group"
        animate={{ x: reverse ? ['0%', '100%'] : ['0%', '-100%'] }}
        transition={{
          x: {
            repeat: Infinity,
            repeatType: 'loop',
            duration,
            ease: 'linear',
          },
        }}
      >
        {children}
      </motion.div>
      <motion.div
        className="marquee-group"
        animate={{ x: reverse ? ['0%', '100%'] : ['0%', '-100%'] }}
        transition={{
          x: {
            repeat: Infinity,
            repeatType: 'loop',
            duration,
            ease: 'linear',
          },
        }}
      >
        {children}
      </motion.div>
    </div>
  )
}
