import { Link } from 'react-router-dom'

const hoverStyle = {
  transition: 'opacity 0.2s ease',
}

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
    <Link
      to={to}
      className={`arrow-link w-inline-block ${className}`}
      style={hoverStyle}
      onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.7')}
      onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
    >
      <div>{children}</div>
      <div className="arrow-link-icon-wrapper">
        <img
          src="/images/icon-interface-arrow-up-right.svg"
          alt=""
          className="arrow-link-initial"
        />
      </div>
    </Link>
  )
}

export function AnimatedArrowLinkExternal({
  href,
  children,
  className = '',
}: Omit<AnimatedArrowLinkProps, 'to'> & { href: string }) {
  return (
    <a
      href={href}
      className={`arrow-link w-inline-block ${className}`}
      style={hoverStyle}
      onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.7')}
      onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
    >
      <div>{children}</div>
      <div className="arrow-link-icon-wrapper">
        <img
          src="/images/icon-interface-arrow-up-right.svg"
          alt=""
          className="arrow-link-initial"
        />
      </div>
    </a>
  )
}
