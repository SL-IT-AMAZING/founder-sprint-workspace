import { type ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
}

interface CardHeaderProps {
  children: ReactNode;
  className?: string;
}

interface CardBodyProps {
  children: ReactNode;
  className?: string;
}

interface CardFooterProps {
  children: ReactNode;
  className?: string;
}

export function Card({ children, className = '' }: CardProps) {
  return (
    <div
      className={`
        flex flex-col gap-6
        border border-[#2f2c251f]
        rounded-[6px]
        bg-[#fefaf399]
        shadow-[0_4px_18px_0_#0000001f]
        backdrop-blur-[12px]
        overflow-hidden
        ${className}
      `}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '' }: CardHeaderProps) {
  return (
    <div className={`px-6 pt-6 ${className}`}>
      {children}
    </div>
  );
}

export function CardBody({ children, className = '' }: CardBodyProps) {
  return (
    <div className={`px-6 flex-1 ${className}`}>
      {children}
    </div>
  );
}

export function CardFooter({ children, className = '' }: CardFooterProps) {
  return (
    <div className={`px-6 pb-6 border-t border-[#2f2c251f] pt-4 ${className}`}>
      {children}
    </div>
  );
}

export function CardImage({ 
  src, 
  alt, 
  className = '' 
}: { 
  src: string; 
  alt: string; 
  className?: string 
}) {
  return (
    <div className="relative w-full h-[120px] overflow-hidden">
      <img 
        src={src} 
        alt={alt} 
        className={`w-full h-full object-cover ${className}`}
      />
    </div>
  );
}

export function GlassCard({ children, className = '' }: CardProps) {
  return (
    <div
      className={`
        flex flex-col gap-4
        p-[18px]
        border border-[#fff6]
        rounded-[12px]
        bg-[#fefaf399]
        shadow-[0_4px_18px_0_#0000001f]
        backdrop-blur-[12px]
        ${className}
      `}
    >
      {children}
    </div>
  );
}

export function Widget({ children, className = '' }: CardProps) {
  return (
    <div
      className={`
        flex flex-col gap-6
        p-[18px]
        border border-[#fff6]
        rounded-[12px]
        bg-[#fefaf399]
        shadow-[0_2px_18px_0_#0003]
        backdrop-blur-[12px]
        max-w-[330px]
        w-full
        ${className}
      `}
    >
      {children}
    </div>
  );
}

export default Card;
