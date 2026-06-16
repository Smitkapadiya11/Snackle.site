"use client";

const BUTTON_STYLES = [
  "bg-red-900 hover:bg-red-800",
  "bg-stone-800 hover:bg-stone-700",
  "bg-stone-700 hover:bg-stone-600",
  "bg-stone-600 hover:bg-stone-500",
];

export default function ActionButton({ label, index }: { label: string; index: number }) {
  const style = BUTTON_STYLES[Math.min(index, BUTTON_STYLES.length - 1)];
  return (
    <span
      className={style}
      style={{
        display: "inline-block",
        color: "#fff",
        fontSize: 12,
        fontWeight: 600,
        padding: "8px 16px",
        borderRadius: 9999,
        cursor: "default",
      }}
    >
      {label}
    </span>
  );
}
