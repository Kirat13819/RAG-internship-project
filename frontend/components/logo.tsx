export function Logo({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 512 512" aria-hidden="true">
      <rect width="512" height="512" rx="116" fill="#141E3C" />
      <path
        d="M130 388 L184 388 L184 227 L130 282 Z"
        fill="#FFFFFF"
        stroke="#FFFFFF"
        strokeWidth="24"
        strokeLinejoin="round"
      />
      <path
        d="M382 124 L328 124 L328 285 L382 230 Z"
        fill="#FFFFFF"
        stroke="#FFFFFF"
        strokeWidth="24"
        strokeLinejoin="round"
      />
      <path
        d="M150 120 L297 224 L362 392 L215 288 Z"
        fill="#2E6FE8"
        stroke="#2E6FE8"
        strokeWidth="10"
        strokeLinejoin="round"
      />
    </svg>
  );
}
