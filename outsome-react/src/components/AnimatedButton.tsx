import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'

interface AnimatedButtonProps {
  to: string
  children: string
  className?: string
  variant?: 'dark' | 'light' | 'light-2'
  size?: 'default' | 'small'
}

export function AnimatedButton({
  to,
  children,
  className = '',
  variant = 'dark',
  size = 'default',
}: AnimatedButtonProps) {
  const variantClasses = {
    dark: '',
    light: 'light',
    'light-2': 'bg-light-2',
  }

  const sizeClasses = {
    default: '',
    small: 'small',
  }

  const combinedClassName = [
    'button',
    'w-inline-block',
    variantClasses[variant],
    sizeClasses[size],
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <motion.div
      style={{ display: 'inline-block' }}
      initial="rest"
      whileHover="hover"
      animate="rest"
    >
      <Link to={to} className={combinedClassName}>
        <div style={{ overflow: 'hidden', height: '1.4em' }}>
          <motion.div
            style={{ 
              display: 'flex', 
              flexDirection: 'column',
            }}
            variants={{
              rest: { y: 0 },
              hover: { y: '-50%' },
            }}
            transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <div style={{ height: '1.4em', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{children}</div>
            <div style={{ height: '1.4em', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{children}</div>
          </motion.div>
        </div>
      </Link>
    </motion.div>
  )
}

export function AnimatedButtonExternal({
  href,
  children,
  className = '',
  variant = 'dark',
  size = 'default',
}: Omit<AnimatedButtonProps, 'to'> & { href: string }) {
  const variantClasses = {
    dark: '',
    light: 'light',
    'light-2': 'bg-light-2',
  }

  const sizeClasses = {
    default: '',
    small: 'small',
  }

  const combinedClassName = [
    'button',
    'w-inline-block',
    variantClasses[variant],
    sizeClasses[size],
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <motion.div
      style={{ display: 'inline-block' }}
      initial="rest"
      whileHover="hover"
      animate="rest"
    >
      <a href={href} className={combinedClassName}>
        <div style={{ overflow: 'hidden', height: '1.4em' }}>
          <motion.div
            style={{ 
              display: 'flex', 
              flexDirection: 'column',
            }}
            variants={{
              rest: { y: 0 },
              hover: { y: '-50%' },
            }}
            transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <div style={{ height: '1.4em', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{children}</div>
            <div style={{ height: '1.4em', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{children}</div>
          </motion.div>
        </div>
      </a>
    </motion.div>
  )
}
