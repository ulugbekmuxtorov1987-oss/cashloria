import { useId } from "react";

export function BrandMark({ size = 32, className }: { size?: number; className?: string }) {
  const uid = useId().replace(/:/g, "");
  const bgId = `${uid}bg`;
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
          <stop offset="0" stopColor="#A45BFF" />
          <stop offset="1" stopColor="#873BFA" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="16" fill={`url(#${bgId})`} />
      {/* Ascending bars — growth you can learn. */}
      <rect x="14" y="36" width="9" height="14" rx="4.5" fill="#FBF8F1" />
      <rect x="27.5" y="27" width="9" height="23" rx="4.5" fill="#FBF8F1" />
      <rect x="41" y="16" width="9" height="34" rx="4.5" fill="#FBF8F1" />
    </svg>
  );
}
