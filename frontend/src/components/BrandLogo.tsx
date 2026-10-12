import { cn } from '@/lib/utils';

interface BrandLogoProps {
  className?: string;
  /** Accessible name; pass an empty string when the logo sits next to the visible "TrackMyApps" text */
  title?: string;
}

// Same drawing as public/logo.svg (favicon), inlined so it renders crisp with no extra request
export function BrandLogo({ className, title = 'TrackMyApps' }: BrandLogoProps) {
  return (
    <svg
      viewBox="0 0 512 512"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('shrink-0', className)}
      role={title ? 'img' : undefined}
      aria-label={title || undefined}
      aria-hidden={title ? undefined : true}
    >
      <rect width="512" height="512" rx="112" fill="#066BFC" />
      <g fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="30">
        <rect x="113" y="161" width="285" height="233" rx="26" stroke="#FFF" />
        <path d="M126 170 342 170 224 268Z" fill="#FFF" stroke="#FFF" />
        <path d="M139 374 205 302M372 374 306 302" stroke="#FFF" />
        <path d="M211 237 254 283 424 118" stroke="#066BFC" strokeWidth="58" />
        <path d="M211 237 254 283 424 118" stroke="#10B9AB" />
      </g>
    </svg>
  );
}
