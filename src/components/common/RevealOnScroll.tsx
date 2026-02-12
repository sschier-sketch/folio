import { ReactNode } from 'react';
import { useRevealOnScroll } from '../../hooks/useRevealOnScroll';

interface RevealOnScrollProps {
  children: ReactNode;
  delay?: number;
  threshold?: number;
  rootMargin?: string;
  className?: string;
}

export function RevealOnScroll({
  children,
  delay = 0,
  threshold = 0.15,
  rootMargin = '0px 0px -10% 0px',
  className = '',
}: RevealOnScrollProps) {
  const ref = useRevealOnScroll<HTMLDivElement>({
    threshold,
    rootMargin,
    once: true,
    delay,
  });

  return (
    <div ref={ref} className={className} data-reveal>
      {children}
    </div>
  );
}
