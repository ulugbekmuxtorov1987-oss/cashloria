import { useId } from "react";

export function BrandMark({ size = 32, className }: { size?: number; className?: string }) {
  const uid = useId().replace(/:/g, "");
  const bgId = `${uid}bg`;
  const goldId = `${uid}gold`;
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 64 64"
      width={size}
      height={size}
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      <defs>
        <linearGradient id={bgId} x1="8" y1="4" x2="58" y2="62" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#23836A" />
          <stop offset="1" stopColor="#0F4A39" />
        </linearGradient>
        <linearGradient id={goldId} x1="42" y1="25" x2="54" y2="39" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#FFD66B" />
          <stop offset="1" stopColor="#E5A52B" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="15" fill={`url(#${bgId})`} />
      <path
        d="M45.8 43.6A18 18 0 1 1 45.8 20.4"
        fill="none"
        stroke="#F7F3E6"
        strokeWidth="8.5"
        strokeLinecap="round"
      />
      <circle cx="48" cy="32" r="6.6" fill={`url(#${goldId})`} />
    </svg>
  );
}
