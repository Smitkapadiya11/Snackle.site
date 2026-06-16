import { ReactNode } from "react";

interface SectionProps {
  id?: string;
  children: ReactNode;
  className?: string;
  dark?: boolean;
  style?: React.CSSProperties;
}

export function Section({ id, children, className = "", dark = false, style }: SectionProps) {
  return (
    <section
      id={id}
      className={`snackle-section ${className}`}
      style={{
        padding: "var(--section-py) var(--section-px)",
        background: dark ? "var(--black)" : "var(--navy)",
        position: "relative",
        overflow: "hidden",
        ...style,
      }}
    >
      <div className="container">{children}</div>
    </section>
  );
}
