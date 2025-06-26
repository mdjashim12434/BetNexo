import type { SVGProps } from 'react';

export function CricketIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="m14.33 4.14-3.52 3.52.9.9 3.52-3.52a2.5 2.5 0 0 0-3.52-3.52L8.17 5.06l.9.9 3.52-3.52" />
      <path d="m12.02 12.02 3.52-3.52-.9-.9-3.52 3.52" />
      <path d="M8.17 17.66 12 21.5h.5l3.88-3.88" />
      <path d="m17.66 8.17-3.52 3.52.9.9 3.52-3.52" />
      <path d="M12.02 12.02 8.5 15.54l-.9-.9 3.52-3.52" />
      <circle cx="6.5" cy="17.5" r="2.5" />
    </svg>
  );
}
