import { cn } from '@/lib/utils';

interface BrandLogoProps {
  className?: string;
  /** Accessible name; pass an empty string when the logo sits next to the visible "TrackMyApps" text */
  title?: string;
}

// Same drawing as public/logo.svg (light) and public/logo-dark.svg (dark), inlined so it renders
// crisp with no extra request and follows the theme. Colors come from the "Sillage" brand kit.
export function BrandLogo({ className, title = 'TrackMyApps' }: BrandLogoProps) {
  return (
    <svg
      viewBox="0 0 64 64"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('shrink-0', className)}
      role={title ? 'img' : undefined}
      aria-label={title || undefined}
      aria-hidden={title ? undefined : true}
    >
      <rect width="64" height="64" rx="14" className="fill-[#0F6E66] dark:fill-[#3FC2B2]" />
      <g fill="none" strokeLinecap="round" strokeLinejoin="round">
        <g strokeWidth="3.5" className="stroke-white dark:stroke-[#0C1312]">
          <rect x="10" y="22" width="38" height="28" rx="4" />
          <path d="M11.5 24 L29 37 L46.5 24" />
        </g>
        <path d="M37 25 L43 31 L55 14" strokeWidth="10" className="stroke-[#0F6E66] dark:stroke-[#3FC2B2]" />
        <path d="M37 25 L43 31 L55 14" strokeWidth="4.5" className="stroke-[#F5A524] dark:stroke-[#0C1312]" />
      </g>
    </svg>
  );
}

/** "TrackMyApps" wordmark, Instrument Sans 600 with "My" in primary (composed in HTML so the web font applies) */
export function BrandName({ className }: { className?: string }) {
  return (
    <span className={cn('font-semibold tracking-tight', className)}>
      <span className="sr-only">TrackMyApps</span>
      <span aria-hidden="true">
        Track<span className="text-primary">My</span>Apps
      </span>
    </span>
  );
}
