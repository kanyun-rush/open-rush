import { cn } from '@/lib/utils';

interface AvatarProps {
  src?: string | null;
  alt?: string;
  fallback?: string;
  className?: string;
}

export function Avatar({ src, alt = '', fallback, className }: AvatarProps) {
  if (src) {
    return (
      // biome-ignore lint/performance/noImgElement: MVP simplicity
      <img src={src} alt={alt} className={cn('h-8 w-8 rounded-full object-cover', className)} />
    );
  }

  const initials = fallback
    ? fallback
        .split(' ')
        .map((w) => w[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '?';

  return (
    <div
      className={cn(
        'h-8 w-8 rounded-full bg-muted flex items-center justify-center',
        'text-xs font-medium text-muted-foreground',
        className
      )}
      role="img"
      aria-label={alt || fallback || 'Avatar'}
    >
      {initials}
    </div>
  );
}
