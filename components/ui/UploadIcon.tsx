export function UploadIcon({ uploaded = false }: { uploaded?: boolean }) {
  if (uploaded) {
    return (
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden>
        <rect width="40" height="40" rx="10" fill="rgba(34,197,94,0.12)" />
        <path
          d="M12 21L17 26L28 15"
          stroke="#22c55e"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  return (
    <svg width="44" height="44" viewBox="0 0 44 44" fill="none" aria-hidden>
      <rect width="44" height="44" rx="12" fill="rgba(252,163,17,0.10)" stroke="rgba(252,163,17,0.25)" strokeWidth="1" />
      <rect x="13" y="10" width="18" height="22" rx="3" stroke="#FCA311" strokeWidth="1.5" fill="none" />
      <path d="M17 10V8" stroke="#FCA311" strokeWidth="1.5" strokeLinecap="round" />
      <path
        d="M22 19V28M22 19L19 22M22 19L25 22"
        stroke="#FCA311"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M17 32H27" stroke="#FCA311" strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
    </svg>
  );
}
