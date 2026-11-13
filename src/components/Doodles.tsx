type DoodleProps = { className?: string };

/** Loose dashed spiral used above the hero eyebrow. */
export function DoodleSpiral({ className = "" }: DoodleProps) {
  return (
    <svg viewBox="0 0 150 132" fill="none" className={className} aria-hidden="true">
      <path
        d="M7 124c27-2 50-15 61-36 10-19 3-41-15-47-16-5-33 4-35 21-2 14 11 25 24 23 12-2 20-13 17-25-3-14-19-21-32-14"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeDasharray="3 6"
      />
      <path
        d="M15 129c-11-7-17-20-14-33 4-19 24-32 43-28"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeDasharray="3 6"
      />
      <path
        d="M73 43c9-3 19-2 26 3"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeDasharray="3 6"
      />
    </svg>
  );
}

/** Hand-drawn dashed asterisk. */
export function DoodleStar({ className = "" }: DoodleProps) {
  return (
    <svg viewBox="0 0 60 60" fill="none" className={className} aria-hidden="true">
      <path
        d="M30 3v54M4 30h52M11 11l38 38M49 11 11 49"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeDasharray="3 5"
      />
      <circle cx="46" cy="14" r="4" stroke="currentColor" strokeWidth="1.2" strokeDasharray="2 4" />
    </svg>
  );
}

/** Wavy dashed divider / accent. */
export function DoodleSquiggle({ className = "" }: DoodleProps) {
  return (
    <svg viewBox="0 0 128 22" fill="none" className={className} aria-hidden="true">
      <path
        d="M3 13c9-11 18-11 27 0s18 11 27 0 18-11 27 0 18 11 27 0"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeDasharray="3 6"
      />
    </svg>
  );
}

/** Curved dashed arrow for pointing at a neighbouring block. */
export function DoodleArrow({ className = "" }: DoodleProps) {
  return (
    <svg viewBox="0 0 96 70" fill="none" className={className} aria-hidden="true">
      <path
        d="M5 8c31 2 56 16 63 42"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeDasharray="3 6"
      />
      <path
        d="M56 44l12 9 9-12"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray="3 6"
      />
    </svg>
  );
}

/** Double loop for softer section accents. */
export function DoodleLoop({ className = "" }: DoodleProps) {
  return (
    <svg viewBox="0 0 120 60" fill="none" className={className} aria-hidden="true">
      <path
        d="M4 39c5-24 28-34 45-21 14 11 8 33-10 33-15 0-22-18-11-28 12-11 35-7 43 8 5 9 4 19-2 25"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeDasharray="3 6"
      />
    </svg>
  );
}

/** Short underline scroll beneath the hero actions. */
export function DoodleUnderline({ className = "" }: DoodleProps) {
  return (
    <svg viewBox="0 0 120 32" fill="none" className={className} aria-hidden="true">
      <path
        d="M3 19c13-15 29-15 42-3s27 8 36-7"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeDasharray="4 6"
      />
      <path
        d="M2 29c9-6 19-5 26 1"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeDasharray="4 6"
      />
    </svg>
  );
}
