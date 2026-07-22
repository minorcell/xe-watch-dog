export function Logo({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none" className={className}>
      <path d="M8 18 Q6 8 14 14 Q18 18 18 24 Q17 30 12 28 Q8 26 8 18Z" fill="#c8963e" />
      <path d="M56 18 Q58 8 50 14 Q46 18 46 24 Q47 30 52 28 Q56 26 56 18Z" fill="#c8963e" />
      <ellipse cx="32" cy="34" rx="18" ry="16" fill="#d4a54a" />
      <ellipse cx="32" cy="26" rx="8" ry="5" fill="#e0b860" opacity="0.5" />
      <circle cx="22" cy="30" r="2.5" fill="#fff" />
      <circle cx="42" cy="30" r="2.5" fill="#fff" />
      <circle cx="22.5" cy="30" r="1.3" fill="#3a2a0a" />
      <circle cx="42.5" cy="30" r="1.3" fill="#3a2a0a" />
      <circle cx="21.5" cy="29" r="0.5" fill="#fff" />
      <circle cx="41.5" cy="29" r="0.5" fill="#fff" />
      <rect x="13" y="19" width="14" height="11" rx="4" fill="#2a2a2a" />
      <rect x="37" y="19" width="14" height="11" rx="4" fill="#2a2a2a" />
      <ellipse cx="20" cy="24.5" rx="4" ry="3.5" fill="#1a1a1a" />
      <ellipse cx="44" cy="24.5" rx="4" ry="3.5" fill="#1a1a1a" />
      <ellipse cx="18" cy="23" rx="1.2" ry="0.8" fill="#fff" opacity="0.25" />
      <ellipse cx="42" cy="23" rx="1.2" ry="0.8" fill="#fff" opacity="0.25" />
      <rect x="27" y="22" width="10" height="5" rx="2" fill="#333" />
      <ellipse cx="32" cy="44" rx="12" ry="7" fill="#e8c870" />
      <ellipse cx="32" cy="41" rx="5" ry="3.5" fill="#2a1a08" />
      <path d="M26 46 Q32 50 38 46" stroke="#8a6a2a" strokeWidth="0.7" fill="none" strokeLinecap="round" />
    </svg>
  );
}
