export function Logo({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none" className={className}>
      <path d="M12 10 Q10 2 16 8 L20 16 Q18 22 14 20 Q10 18 12 10Z" fill="currentColor" />
      <path d="M13 11 Q12 4 16 9 L19 15 Q17 19 14 18 Q12 17 13 11Z" fill="var(--muted)" opacity="0.5" />
      <path d="M52 10 Q54 2 48 8 L44 16 Q46 22 50 20 Q54 18 52 10Z" fill="currentColor" />
      <path d="M51 11 Q52 4 48 9 L45 15 Q47 19 50 18 Q52 17 51 11Z" fill="var(--muted)" opacity="0.5" />
      <ellipse cx="32" cy="34" rx="20" ry="18" fill="currentColor" />
      <ellipse cx="32" cy="26" rx="10" ry="6" fill="var(--muted)" opacity="0.3" />
      <circle cx="24" cy="28" r="3.5" fill="var(--background)" />
      <circle cx="40" cy="28" r="3.5" fill="var(--background)" />
      <circle cx="25" cy="28" r="1.8" fill="currentColor" />
      <circle cx="41" cy="28" r="1.8" fill="currentColor" />
      <circle cx="23.5" cy="27" r="0.7" fill="var(--background)" />
      <circle cx="39.5" cy="27" r="0.7" fill="var(--background)" />
      <rect x="18" y="22.5" width="12" height="10" rx="3" stroke="var(--background)" strokeWidth="1.2" fill="none" />
      <rect x="34" y="22.5" width="12" height="10" rx="3" stroke="var(--background)" strokeWidth="1.2" fill="none" />
      <path d="M30 26 Q32 24 34 26" stroke="var(--background)" strokeWidth="1.2" fill="none" strokeLinecap="round" />
      <line x1="18" y1="25" x2="12" y2="22" stroke="var(--background)" strokeWidth="0.8" strokeLinecap="round" opacity="0.7" />
      <line x1="46" y1="25" x2="52" y2="22" stroke="var(--background)" strokeWidth="0.8" strokeLinecap="round" opacity="0.7" />
      <ellipse cx="32" cy="42" rx="11" ry="7.5" fill="var(--muted)" opacity="0.4" />
      <ellipse cx="32" cy="39" rx="4.5" ry="3.5" fill="currentColor" />
      <path d="M27 43 Q32 47 37 43" stroke="currentColor" strokeWidth="0.8" fill="none" strokeLinecap="round" />
    </svg>
  );
}
