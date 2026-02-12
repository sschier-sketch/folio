import { useEffect, useRef } from 'react';

interface UseRevealOnScrollOptions {
  threshold?: number;
  rootMargin?: string;
  once?: boolean;
  delay?: number;
}

export function useRevealOnScroll<T extends HTMLElement>(
  options: UseRevealOnScrollOptions = {}
) {
  const {
    threshold = 0.15,
    rootMargin = '0px 0px -10% 0px',
    once = true,
    delay = 0,
  } = options;

  const ref = useRef<T>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;

    if (prefersReducedMotion) {
      element.style.opacity = '1';
      element.style.transform = 'none';
      return;
    }

    element.style.opacity = '0';
    element.style.transform = 'translateY(16px)';
    element.style.transition = `opacity 500ms cubic-bezier(0.2, 0.8, 0.2, 1) ${delay}ms, transform 500ms cubic-bezier(0.2, 0.8, 0.2, 1) ${delay}ms`;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.setAttribute('style', `
              opacity: 1;
              transform: translateY(0);
              transition: opacity 500ms cubic-bezier(0.2, 0.8, 0.2, 1) ${delay}ms, transform 500ms cubic-bezier(0.2, 0.8, 0.2, 1) ${delay}ms;
            `);
            if (once) {
              observer.unobserve(entry.target);
            }
          }
        });
      },
      {
        threshold,
        rootMargin,
      }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [threshold, rootMargin, once, delay]);

  return ref;
}
