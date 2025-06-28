import type { SVGProps } from 'react';
import { Disc } from 'lucide-react';

const BasketballIcon = (props: SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="10"></circle>
      <path d="M4.2 14.2l5.6-5.6"></path>
      <path d="M14.2 4.2l5.6 5.6"></path>
      <path d="M4.2 9.8l5.6 5.6"></path>
      <path d="M9.8 4.2l5.6 5.6"></path>
    </svg>
);

const FootballIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <circle cx="12" cy="12" r="10" />
    <path d="m15.5 12-2.5-2.5" />
    <path d="m8.5 12 2.5 2.5" />
    <path d="m12 15.5 2.5-2.5" />
    <path d="m12 8.5 2.5 2.5" />
    <path d="m12 8.5-2.5 2.5" />
    <path d="m8.5 12-2.5-2.5" />
    <path d="m15.5 12 2.5 2.5" />
    <path d="M12 15.5 8.5 19" />
    <path d="M12 8.5 8.5 5" />
    <path d="m19 8.5-3.5-3.5" />
    <path d="m5 15.5 3.5 3.5" />
  </svg>
);


export function SportIcon({ sportKey, ...props }: SVGProps<SVGSVGElement> & { sportKey?: string }) {
    switch (sportKey) {
        case 'football':
            return <FootballIcon {...props} />;
        case 'basketball':
            return <BasketballIcon {...props} />;
        default:
            return <FootballIcon {...props} />; // Football as default as it's the main sport
    }
}
