import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          'h-9 w-full px-3 py-1 rounded-lg border border-border bg-background',
          'text-foreground text-sm placeholder:text-muted-foreground',
          'shadow-sm transition-all duration-200',
          'hover:border-primary/50',
          'focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:outline-none',
          'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-muted',
          className
        )}
        {...props}
      />
    );
  }
);

Input.displayName = 'Input';
