import { motion } from 'framer-motion'

interface RotatingEmblemProps {
  className?: string
}

export function RotatingEmblem({ className = '' }: RotatingEmblemProps) {
  return (
    <div className={`emblem-wrap ${className}`}>
      <motion.img
        src="/images/photo-art-04.webp"
        srcSet="/images/photo-art-04-p-500.webp 500w, /images/photo-art-04-p-800.webp 800w, /images/photo-art-04-p-1080.webp 1080w, /images/photo-art-04.webp 1232w"
        sizes="100vw"
        alt=""
        className="outer-emblem-bg"
        animate={{ rotate: 360 }}
        transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}
      />
      <motion.img
        src="/images/photo-art-04.webp"
        srcSet="/images/photo-art-04-p-500.webp 500w, /images/photo-art-04-p-800.webp 800w, /images/photo-art-04-p-1080.webp 1080w, /images/photo-art-04.webp 1232w"
        sizes="100vw"
        alt=""
        className="outer-emblem-bg-2"
        animate={{ rotate: -360 }}
        transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}
      />
      <div className="emblem">
        <motion.img
          src="/images/photo-art-04.webp"
          srcSet="/images/photo-art-04-p-500.webp 500w, /images/photo-art-04-p-800.webp 800w, /images/photo-art-04-p-1080.webp 1080w, /images/photo-art-04.webp 1232w"
          sizes="100vw"
          alt=""
          className="inner-emblem-bg"
          animate={{ rotate: 360 }}
          transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
        />
        <motion.img
          src="/images/photo-art-04.webp"
          srcSet="/images/photo-art-04-p-500.webp 500w, /images/photo-art-04-p-800.webp 800w, /images/photo-art-04-p-1080.webp 1080w, /images/photo-art-04.webp 1232w"
          sizes="100vw"
          alt=""
          className="inner-emblem-bg-2"
          animate={{ rotate: -360 }}
          transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
        />
        <motion.div
          className="emblem-logo-wrap"
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
        >
          <img
            src="/images/Outsome-Symbol_White_Moving.svg"
            alt=""
            className="emblem-logo"
          />
        </motion.div>
      </div>
    </div>
  )
}
