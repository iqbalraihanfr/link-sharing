import type { SVGProps } from "react";

export function InstagramIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
      <rect x="3.5" y="3.5" width="17" height="17" rx="5" strokeWidth="1.8" />
      <circle cx="12" cy="12" r="4" strokeWidth="1.8" />
      <circle cx="17.25" cy="6.75" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function LinkedInIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M6.45 8.9H3.2V20h3.25V8.9ZM4.83 3.5a1.95 1.95 0 1 0 0 3.9 1.95 1.95 0 0 0 0-3.9ZM20.8 13.18c0-3.37-1.8-4.94-4.21-4.94-1.94 0-2.8 1.07-3.28 1.82V8.9H10.1c.04.76 0 11.1 0 11.1h3.2v-6.2c0-.33.03-.65.12-.89.26-.65.85-1.32 1.84-1.32 1.3 0 1.82.99 1.82 2.44V20H20.8v-6.82Z" />
    </svg>
  );
}

export function FlagIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
      <path
        d="M5 21V5.5c0-.28.22-.5.5-.5h8.12c.13 0 .25.05.35.15l.78.77c.1.1.22.15.35.15H19a1 1 0 0 1 .83 1.55L17.9 10.5l1.93 2.88A1 1 0 0 1 19 15h-3.9c-.13 0-.26.05-.35.15l-.78.77a.5.5 0 0 1-.35.15H5.5a.5.5 0 0 0-.5.5V21"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ShieldIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
      <path
        d="M12 3 5 6v5c0 5.25 3.57 8.95 7 10 3.43-1.05 7-4.75 7-10V6l-7-3Z"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="m9.6 12.3 1.6 1.6 3.2-3.7"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function SparkIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="m12 2 1.77 5.73L19.5 9.5l-5.73 1.77L12 17l-1.77-5.73L4.5 9.5l5.73-1.77L12 2ZM19 15l.93 3.07L23 19l-3.07.93L19 23l-.93-3.07L15 19l3.07-.93L19 15ZM5 14l.93 3.07L9 18l-3.07.93L5 22l-.93-3.07L1 18l3.07-.93L5 14Z" />
    </svg>
  );
}
