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
      <path d="M12 2a10 10 0 1 0 10 10H12V2z" />
      <path d="M12 12l6 6" />
      <path d="M12 12l-6 6" />
      <path d="M12 12l6-6" />
      <path d="M12 12l-6-6" />
      <circle cx="12" cy="12" r="2" fill="currentColor" />
    </svg>
  );
}
