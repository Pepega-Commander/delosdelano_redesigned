type DoodleProps = { className?: string };

/** Loose dashed flourish traced from the approved hero reference. */
export function DoodleFlourish({ className = "" }: DoodleProps) {
  return (
    <svg viewBox="0 0 150 132" fill="none" className={className} aria-hidden="true">
      <path
        d="M106 30C96 42 82 52 66 58C60 60 56 59 52 57C46 52 39 52 32 58C20 50 16 34 24 24C31 14 45 15 49 26C53 37 44 49 33 51C37 58 44 62 52 66C46 78 34 89 18 95C12 97 8 99 4 100"
        stroke="currentColor"
        strokeWidth="1.35"
        strokeLinecap="round"
        strokeDasharray="4 7"
      />
      <path
        d="M112 115c6 5 11 10 15 14"
        stroke="currentColor"
        strokeWidth="1.35"
        strokeLinecap="round"
        strokeDasharray="4 7"
        opacity="0.65"
      />
      <circle cx="128" cy="129" r="1.5" fill="currentColor" />
    </svg>
  );
}

/** Hand-drawn four-point sparkle used as a small section accent. */
export function DoodleStar({ className = "" }: DoodleProps) {
  return (
    <svg viewBox="0 0 64 64" fill="none" className={className} aria-hidden="true">
      <path
        d="M31 4C33 16 37 23 46 27C37 32 33 39 31 53C29 39 25 32 16 27C25 23 29 16 31 4Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray="3 5"
      />
      <path
        d="M49 41C50 46 52 49 56 51C52 53 50 56 49 61C48 56 46 53 42 51C46 49 48 46 49 41Z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray="2 4"
        opacity="0.6"
      />
      <circle cx="13" cy="14" r="1.6" fill="currentColor" />
    </svg>
  );
}

/** Wavy dashed divider with a soft second stroke. */
export function DoodleSquiggle({ className = "" }: DoodleProps) {
  return (
    <svg viewBox="0 0 128 22" fill="none" className={className} aria-hidden="true">
      <path
        d="M3 13c9-11 18-11 27 0s18 11 27 0 18-11 27 0 18 11 27 0"
        stroke="currentColor"
        strokeWidth="1.35"
        strokeLinecap="round"
        strokeDasharray="4 6"
      />
      <path
        d="M14 20c7-4 14-4 21 1"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeDasharray="2 5"
        opacity="0.55"
      />
      <circle cx="121" cy="8" r="1.5" fill="currentColor" />
    </svg>
  );
}

/** Curved dashed arrow with an open, hand-drawn head. */
export function DoodleArrow({ className = "" }: DoodleProps) {
  return (
    <svg viewBox="0 0 96 70" fill="none" className={className} aria-hidden="true">
      <path
        d="M6 10C30 8 54 16 66 34C72 43 74 51 73 59"
        stroke="currentColor"
        strokeWidth="1.35"
        strokeLinecap="round"
        strokeDasharray="4 6"
      />
      <path
        d="M60 49C64 52 68 55 73 59C76 54 79 49 81 44"
        stroke="currentColor"
        strokeWidth="1.35"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray="4 6"
      />
      <circle cx="6" cy="10" r="1.6" fill="currentColor" />
    </svg>
  );
}

/** Double loop with a trailing flick for softer section accents. */
export function DoodleLoop({ className = "" }: DoodleProps) {
  return (
    <svg viewBox="0 0 120 60" fill="none" className={className} aria-hidden="true">
      <path
        d="M4 40C8 17 31 6 48 18C62 28 57 48 40 50C26 52 16 40 23 29C31 16 53 18 63 32C69 41 69 52 63 59"
        stroke="currentColor"
        strokeWidth="1.35"
        strokeLinecap="round"
        strokeDasharray="4 6"
      />
      <path
        d="M64 59c8-1 15-4 20-8"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeDasharray="2 5"
        opacity="0.55"
      />
      <circle cx="90" cy="48" r="1.5" fill="currentColor" />
    </svg>
  );
}

/** Short underline scroll beneath the hero actions. */
export function DoodleUnderline({ className = "" }: DoodleProps) {
  return (
    <svg viewBox="0 0 120 32" fill="none" className={className} aria-hidden="true">
      <path
        d="M3 19C15 7 29 6 41 15C53 24 67 22 77 10C80 6 81 3 81 1"
        stroke="currentColor"
        strokeWidth="1.45"
        strokeLinecap="round"
        strokeDasharray="4 6"
      />
      <path
        d="M5 29C13 24 22 24 29 30"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeDasharray="3 5"
        opacity="0.65"
      />
      <circle cx="84" cy="2" r="1.4" fill="currentColor" />
    </svg>
  );
}
