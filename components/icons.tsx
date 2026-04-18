import type { SVGProps } from "react";

export function InstagramIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      <defs>
        <radialGradient
          id="ig-gradient"
          cx="30%"
          cy="107%"
          r="150%"
          fx="30%"
          fy="107%"
        >
          <stop offset="0%" stopColor="#fdf497" />
          <stop offset="5%" stopColor="#fdf497" />
          <stop offset="45%" stopColor="#fd5949" />
          <stop offset="60%" stopColor="#d6249f" />
          <stop offset="90%" stopColor="#285AEB" />
        </radialGradient>
      </defs>
      <rect
        x="2"
        y="2"
        width="20"
        height="20"
        rx="6"
        stroke="url(#ig-gradient)"
        strokeWidth="2"
        fill="none"
      />
      <circle
        cx="12"
        cy="12"
        r="4.5"
        stroke="url(#ig-gradient)"
        strokeWidth="2"
        fill="none"
      />
      <circle cx="17.5" cy="6.5" r="1.25" fill="url(#ig-gradient)" />
    </svg>
  );
}

export function LinkedInIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" {...props}>
      <rect width="24" height="24" rx="4" fill="#0A66C2" />
      <path
        d="M8.75 10.5v5.25M8.75 7.5v.008"
        stroke="#fff"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <path
        d="M12.75 15.75v-3a1.5 1.5 0 0 1 3 0v3"
        stroke="#fff"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <path
        d="M12.75 12.38v-1.88"
        stroke="#fff"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
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
