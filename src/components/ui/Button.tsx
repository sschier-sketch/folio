import React from 'react';

export type ButtonVariant =
  | 'primary'
  | 'dark'
  | 'pro'
  | 'secondary'
  | 'cancel'
  | 'outlined'
  | 'danger'
  | 'text-danger'
  | 'warning'
  | 'dashed';

export type ButtonSize = 'sm' | 'md';

const sizes: Record<ButtonSize, string> = {
  sm: 'h-[34px] px-3.5 rounded-lg text-xs gap-1.5',
  md: 'h-[42px] px-5 rounded-xl text-sm gap-2',
};

const base =
  'font-semibold leading-none inline-flex items-center justify-center transition-all duration-150 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2';

const variants: Record<ButtonVariant, string> = {
  primary:
    'bg-[#3c8af7] text-white hover:bg-[#3579de] active:bg-[#2d6bc8] focus:ring-[#3c8af7]/50',
  dark:
    'bg-gray-900 text-white hover:bg-gray-800 active:bg-gray-950 focus:ring-gray-700/50',
  pro:
    'bg-[#3c8af7] text-white hover:bg-[#3579de] active:bg-[#2d6bc8] focus:ring-[#3c8af7]/50',
  secondary:
    'bg-gray-100 text-gray-700 hover:bg-gray-200 active:bg-gray-300 focus:ring-gray-400/50',
  cancel:
    'bg-[#faf8f8] text-gray-900 hover:bg-gray-200 active:bg-gray-300 focus:ring-gray-400/50',
  outlined:
    'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 active:bg-gray-100 focus:ring-gray-400/50',
  danger:
    'bg-red-600 text-white hover:bg-red-700 active:bg-red-800 focus:ring-red-500/50',
  'text-danger':
    'bg-transparent text-red-600 hover:bg-red-50 active:bg-red-100 focus:ring-red-500/50',
  warning:
    'bg-amber-500 text-white hover:bg-amber-600 active:bg-amber-700 focus:ring-amber-400/50',
  dashed:
    'bg-white text-gray-500 border-2 border-dashed border-gray-300 hover:border-[#3c8af7] hover:text-[#3c8af7] hover:bg-blue-50/50 focus:ring-[#3c8af7]/50',
};

function cls(variant: ButtonVariant, size: ButtonSize, fullWidth?: boolean, className?: string) {
  return [base, sizes[size], variants[variant], fullWidth ? 'w-full' : '', className ?? '']
    .filter(Boolean)
    .join(' ');
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', fullWidth, className, children, ...rest }, ref) => (
    <button ref={ref} className={cls(variant, size, fullWidth, className)} {...rest}>
      {children}
    </button>
  )
);
Button.displayName = 'Button';
