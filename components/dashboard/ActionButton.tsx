// Dark pill buttons shown at bottom of each card

const BUTTON_STYLES = [
  "bg-red-900 hover:bg-red-800", // First button — most urgent
  "bg-stone-800 hover:bg-stone-700",
  "bg-stone-700 hover:bg-stone-600",
  "bg-stone-600 hover:bg-stone-500",
];

export default function ActionButton({ label, index }: { label: string; index: number }) {
  const style = BUTTON_STYLES[Math.min(index, BUTTON_STYLES.length - 1)];
  return (
    <button
      className={`${style} cursor-default rounded-full px-4 py-2 text-xs font-semibold text-white transition-colors`}
    >
      {label}
    </button>
  );
}
