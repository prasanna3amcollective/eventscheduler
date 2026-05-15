'use client';

import type { SVGProps } from 'react';

// ---------------------------------------------------------------------------
// Icon set
// ---------------------------------------------------------------------------
// Hand-drawn / brutalist SVG icon set.
// Slightly irregular shapes, uneven strokes, honest asymmetry.
// No pixel-perfect corporate vector design — each icon feels drawn by hand.
// ---------------------------------------------------------------------------

interface IconProps extends SVGProps<SVGSVGElement> {
  size?: number;
}

/** Shared base props for all icons */
function base(size = 20): SVGProps<SVGSVGElement> {
  return {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };
}

// ---- Navigation ----

/** Left arrow */
export function ArrowLeft({ size, ...props }: IconProps) {
  return (
    <svg {...base(size)} {...props}>
      <path d="M18 12H6" />
      <path d="M10 17l-5-5 5-5" />
    </svg>
  );
}

/** Right arrow */
export function ArrowRight({ size, ...props }: IconProps) {
  return (
    <svg {...base(size)} {...props}>
      <path d="M6 12h12" />
      <path d="M14 7l5 5-5 5" />
    </svg>
  );
}

// ---- Calendar ----

/** Calendar with a date selected */
export function CalendarFill({ size, ...props }: IconProps) {
  return (
    <svg {...base(size)} {...props}>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4" />
      <path d="M8 2v4" />
      <path d="M3 10h18" />
      <circle cx="12" cy="15" r="1.5" />
    </svg>
  );
}

/** Calendar showing multiple days */
export function CalendarDays({ size, ...props }: IconProps) {
  return (
    <svg {...base(size)} {...props}>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4" />
      <path d="M8 2v4" />
      <path d="M3 10h18" />
      <path d="M8 14h2" />
      <path d="M14 14h2" />
      <path d="M8 18h2" />
      <path d="M14 18h2" />
    </svg>
  );
}

// ---- Check / Validation ----

/** Check mark */
export function Check({ size, ...props }: IconProps) {
  return (
    <svg {...base(size)} {...props}>
      <path d="M4 13l5 5 11-11" />
    </svg>
  );
}

/** Check inside a circle */
export function CheckCircle({ size, ...props }: IconProps) {
  return (
    <svg {...base(size)} {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M8 12l3 3 5-5" />
    </svg>
  );
}

// ---- Arrows / Controls ----

/** Down chevron */
export function ChevronDown({ size, ...props }: IconProps) {
  return (
    <svg {...base(size)} {...props}>
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

/** Left chevron */
export function ChevronLeft({ size, ...props }: IconProps) {
  return (
    <svg {...base(size)} {...props}>
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );
}

/** Right chevron */
export function ChevronRight({ size, ...props }: IconProps) {
  return (
    <svg {...base(size)} {...props}>
      <path d="M9 6l6 6-6 6" />
    </svg>
  );
}

/** Up chevron */
export function ChevronUp({ size, ...props }: IconProps) {
  return (
    <svg {...base(size)} {...props}>
      <path d="M18 15l-6-6-6 6" />
    </svg>
  );
}

// ---- Utility ----

/** Clock / time icon */
export function Clock({ size, ...props }: IconProps) {
  return (
    <svg {...base(size)} {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 3" />
    </svg>
  );
}

/** Pencil / edit icon */
export function Edit({ size, ...props }: IconProps) {
  return (
    <svg {...base(size)} {...props}>
      <path d="M16.5 3.5l4 4L8 20H4v-4L16.5 3.5z" />
    </svg>
  );
}

/** Eye / visibility icon */
export function Eye({ size, ...props }: IconProps) {
  return (
    <svg {...base(size)} {...props}>
      <path d="M1 12c2-5 6-8 11-8s9 3 11 8c-2 5-6 8-11 8s-9-3-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

/** Info / help icon */
export function Info({ size, ...props }: IconProps) {
  return (
    <svg {...base(size)} {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v1" />
      <path d="M12 12v5" />
    </svg>
  );
}

// ---- Layout ----

/** Layout / grid icon */
export function Layout({ size, ...props }: IconProps) {
  return (
    <svg {...base(size)} {...props}>
      <rect x="3" y="3" width="7" height="9" rx="1" />
      <rect x="14" y="3" width="7" height="5" rx="1" />
      <rect x="14" y="12" width="7" height="9" rx="1" />
      <rect x="3" y="16" width="7" height="5" rx="1" />
    </svg>
  );
}

/** Loading spinner icon */
export function Loader({ size, ...props }: IconProps) {
  return (
    <svg {...base(size)} {...props}>
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
    </svg>
  );
}

// ---- Security ----

/** Lock / locked icon */
export function Lock({ size, ...props }: IconProps) {
  return (
    <svg {...base(size)} {...props}>
      <rect x="7" y="11" width="10" height="10" rx="2" />
      <path d="M8 11V8a4 4 0 118 0v3" />
    </svg>
  );
}

/** Login arrow icon */
export function LogIn({ size, ...props }: IconProps) {
  return (
    <svg {...base(size)} {...props}>
      <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4" />
      <path d="M10 17l5-5-5-5" />
      <path d="M15 12H3" />
    </svg>
  );
}

/** Logout arrow icon */
export function LogOut({ size, ...props }: IconProps) {
  return (
    <svg {...base(size)} {...props}>
      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
      <path d="M16 17l5-5-5-5" />
      <path d="M21 12H9" />
    </svg>
  );
}

// ---- Communication ----

/** Mail / envelope icon */
export function Mail({ size, ...props }: IconProps) {
  return (
    <svg {...base(size)} {...props}>
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <path d="M2 7l10 7 10-7" />
    </svg>
  );
}

/** Phone handset icon */
export function Phone({ size, ...props }: IconProps) {
  return (
    <svg {...base(size)} {...props}>
      <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" />
    </svg>
  );
}

// ---- People ----

/** Single person with "+" icon */
export function PlusCircle({ size, ...props }: IconProps) {
  return (
    <svg {...base(size)} {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M8 12h8" />
      <path d="M12 8v8" />
    </svg>
  );
}

/** Refresh / reload icon */
export function Refresh({ size, ...props }: IconProps) {
  return (
    <svg {...base(size)} {...props}>
      <path d="M23 4v6h-6" />
      <path d="M1 20v-6h6" />
      <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
    </svg>
  );
}

/** Save / floppy disk icon */
export function Save({ size, ...props }: IconProps) {
  return (
    <svg {...base(size)} {...props}>
      <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" />
      <path d="M17 21v-8H7v8" />
      <path d="M7 3v5h8" />
    </svg>
  );
}

/** Search / magnifying glass icon */
export function Search({ size, ...props }: IconProps) {
  return (
    <svg {...base(size)} {...props}>
      <circle cx="11" cy="11" r="7" />
      <path d="M16.5 16.5L21 21" />
    </svg>
  );
}

/** Shield with checkmark icon */
export function ShieldCheck({ size, ...props }: IconProps) {
  return (
    <svg {...base(size)} {...props}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  );
}

/** Tag / label icon */
export function Tag({ size, ...props }: IconProps) {
  return (
    <svg {...base(size)} {...props}>
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" />
      <path d="M7 7h.01" />
    </svg>
  );
}

/** Umbrella icon (holidays) */
export function Umbrella({ size, ...props }: IconProps) {
  return (
    <svg {...base(size)} {...props}>
      <path d="M23 12a11 11 0 00-22 0" />
      <path d="M12 12v7a2 2 0 004 0" />
      <path d="M12 5v3" />
    </svg>
  );
}

// ---- User ----

/** Single person silhouette */
export function User({ size, ...props }: IconProps) {
  return (
    <svg {...base(size)} {...props}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21v-2a5 5 0 015-5h6a5 5 0 015 5v2" />
    </svg>
  );
}

/** Person with "+" icon (add user) */
export function UserPlus({ size, ...props }: IconProps) {
  return (
    <svg {...base(size)} {...props}>
      <circle cx="10" cy="8" r="4" />
      <path d="M2 21v-2a5 5 0 015-5h6a5 5 0 015 5v2" />
      <path d="M19 8v6" />
      <path d="M22 11h-6" />
    </svg>
  );
}

/** Group of people icon */
export function Users({ size, ...props }: IconProps) {
  return (
    <svg {...base(size)} {...props}>
      <circle cx="9" cy="7" r="4" />
      <path d="M1 18v-2a5 5 0 015-5h6a5 5 0 015 5v2" />
      <circle cx="18" cy="6" r="3" />
      <path d="M23 17v-1a4 4 0 00-4-4h-1" />
    </svg>
  );
}

// ---- Other ----

/** X / close icon */
export function X({ size, ...props }: IconProps) {
  return (
    <svg {...base(size)} {...props}>
      <path d="M18 6L6 18" />
      <path d="M6 6l12 12" />
    </svg>
  );
}

/** X inside a circle */
export function XCircle({ size, ...props }: IconProps) {
  return (
    <svg {...base(size)} {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M9 9l6 6" />
      <path d="M15 9l-6 6" />
    </svg>
  );
}

/** Alert circle icon */
export function AlertCircle({ size, ...props }: IconProps) {
  return (
    <svg {...base(size)} {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v4" />
      <path d="M12 16h.01" />
    </svg>
  );
}

/** Warning triangle icon */
export function AlertTriangle({ size, ...props }: IconProps) {
  return (
    <svg {...base(size)} {...props}>
      <path d="M12 3L2 21h20L12 3z" />
      <path d="M12 10v4" />
      <path d="M12 17h.01" />
    </svg>
  );
}

/** Filter / funnel icon */
export function Filter({ size, ...props }: IconProps) {
  return (
    <svg {...base(size)} {...props}>
      <path d="M4 7h16" />
      <path d="M8 12h8" />
      <path d="M11 17h2" />
    </svg>
  );
}

/** Key icon (ACLs/permissions) */
export function Key({ size, ...props }: IconProps) {
  return (
    <svg {...base(size)} {...props}>
      <circle cx="7" cy="12" r="4" />
      <path d="M10 12l10-8v4l-4 4 4 4v4l-10-8" />
    </svg>
  );
}

/** Layers / stacked icon */
export function Layers({ size, ...props }: IconProps) {
  return (
    <svg {...base(size)} {...props}>
      <path d="M12 2L2 7l10 5 10-5-10-5z" />
      <path d="M2 12l10 5 10-5" />
      <path d="M2 17l10 5 10-5" />
    </svg>
  );
}

/** Chain link icon */
export function Link({ size, ...props }: IconProps) {
  return (
    <svg {...base(size)} {...props}>
      <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
    </svg>
  );
}

/** Plus icon */
export function Plus({ size, ...props }: IconProps) {
  return (
    <svg {...base(size)} {...props}>
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </svg>
  );
}

/** Repeat / loop icon */
export function Repeat({ size, ...props }: IconProps) {
  return (
    <svg {...base(size)} {...props}>
      <path d="M17 2l4 4-4 4" />
      <path d="M3 11v-1a4 4 0 014-4h14" />
      <path d="M7 22l-4-4 4-4" />
      <path d="M21 13v1a4 4 0 01-4 4H3" />
    </svg>
  );
}

/** Shield icon */
export function Shield({ size, ...props }: IconProps) {
  return (
    <svg {...base(size)} {...props}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

/** Target / bullseye icon */
export function Target({ size, ...props }: IconProps) {
  return (
    <svg {...base(size)} {...props}>
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  );
}

/** Trash / delete icon */
export function Trash({ size, ...props }: IconProps) {
  return (
    <svg {...base(size)} {...props}>
      <path d="M3 6h18" />
      <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6" />
      <path d="M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2" />
    </svg>
  );
}

/** Clock with fill */
export function ClockFill({ size, ...props }: IconProps) {
  return (
    <svg {...base(size)} {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 3" />
      <path d="M12 2v3" />
      <path d="M12 19v3" />
    </svg>
  );
}