import type { SVGProps } from 'react';

// This component is no longer used and can be considered deprecated.
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
      <path d="m13.23 10.83 6.18-6.18a2.5 2.5 0 0 0-3.54-3.54l-6.18 6.18" />
      <path d="m4.22 18.78 1.42-1.42" />
      <path d="m9.37 13.63 1.42-1.42" />
      <path d="M14.51 8.49l1.42-1.42" />
      <path d="M19.66 3.34l1.42-1.42" />
      <circle cx="6" cy="18" r="2" />
    </svg>
  );
}
