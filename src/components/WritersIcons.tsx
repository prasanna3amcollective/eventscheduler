import React from 'react';

// Hand-drawn iron stylus (ancient engraving tool)
export function IronStylus({ className = '' }: { className?: string }) {
  return (
    <svg
      className={className}
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ display: 'inline-block', verticalAlign: 'middle' }}
    >
      {/* Tapered stylus shaft */}
      <path d="M4 20L18 6" />
      <path d="M18 6L20 4C20.5 3.5 21.3 3.5 21.8 4C22.3 4.5 22.3 5.3 21.8 5.8L19.8 7.8" />
      {/* Sharp etching point */}
      <path d="M4 20L2 22L3 21" />
      {/* Hand-wrapped grip thread */}
      <path d="M8 16L9 17 M9 15L10 16 M10 14L11 15 M11 13L12 14 M12 12L13 13" strokeWidth="1.2" opacity="0.8" />
    </svg>
  );
}

// Hand-drawn assembly circle (people gathered around a fire/hearth)
export function AssemblyCircle({ className = '' }: { className?: string }) {
  return (
    <svg
      className={className}
      width="32"
      height="32"
      viewBox="0 0 32 32"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ display: 'inline-block', verticalAlign: 'middle' }}
    >
      {/* Outer assembly ring of dots (representing people in council) */}
      <circle cx="16" cy="16" r="11" strokeDasharray="3 4" />
      {/* Central hearth / fire */}
      <path d="M13 18C13 18 14.5 14 16 11C17.5 14 19 18 19 18" />
      <path d="M15 18C15 18 15.5 16 16.5 14.5" strokeWidth="1.2" />
      {/* Base wood logs */}
      <path d="M11 19.5L21 19.5" strokeWidth="2.2" />
      <path d="M12.5 21L19.5 21" strokeWidth="1.5" />
    </svg>
  );
}

// Thread divider (simulating the thread that holds palm leaf pages/olaichuvadi together)
export function ThreadDivider({ className = '' }: { className?: string }) {
  return (
    <svg
      className={className}
      width="100%"
      height="24"
      viewBox="0 0 200 24"
      preserveAspectRatio="none"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
      style={{ display: 'block', margin: '1.5rem auto' }}
    >
      {/* Slightly uneven, organic spun thread line */}
      <path d="M0 12 C 30 14, 70 9, 100 12 C 130 15, 170 10, 200 12" />
      
      {/* Center binder hole (where thread passes through palm leaf) */}
      <circle cx="100" cy="12" r="4.5" fill="#dfd7c6" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="100" cy="12" r="1.5" fill="currentColor" />

      {/* Left decorative knot */}
      <path d="M40 12 Q 41 7, 43 12 T 46 12" strokeWidth="1" />
      <circle cx="43" cy="12" r="2" fill="currentColor" />

      {/* Right decorative knot */}
      <path d="M160 12 Q 161 7, 163 12 T 166 12" strokeWidth="1" />
      <circle cx="163" cy="12" r="2" fill="currentColor" />
    </svg>
  );
}
