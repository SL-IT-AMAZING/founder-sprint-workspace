import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'

interface AnimatedArrowLinkProps {
  to: string
  children: string
  className?: string
}

export function AnimatedArrowLink({
  to,
  children,
  className = '',
}: AnimatedArrowLinkProps) {
  return (
    <Link to={to} className={`arrow-link w-inline-block ${className}`}>
      <div>{children}</div>
      <motion.div
        className="arrow-link-icon-wrapper"
        whileHover={{ x: -18 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
      >
        <img
          src="/images/icon-interface-arrow-up-right.svg"
          alt="Arrow up right icon"
          className="arrow-link-initial"
        />
        <img
          src="/images/icon-interface-arrow-up-right.svg"
          alt="Arrow up right icon"
          className="arrow-link-reveal"
        />
      </motion.div>
    </Link>
  )
}

export function AnimatedArrowLinkExternal({
  href,
  children,
  className = '',
}: Omit<AnimatedArrowLinkProps, 'to'> & { href: string }) {
  return (
    <a href={href} className={`arrow-link w-inline-block ${className}`}>
      <div>{children}</div>
      <motion.div
        className="arrow-link-icon-wrapper"
        whileHover={{ x: -18 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
      >
        <img
          src="/images/icon-interface-arrow-up-right.svg"
          alt="Arrow up right icon"
          className="arrow-link-initial"
        />
        <img
          src="/images/icon-interface-arrow-up-right.svg"
          alt="Arrow up right icon"
          className="arrow-link-reveal"
        />
      </motion.div>
    </a>
  )
}
