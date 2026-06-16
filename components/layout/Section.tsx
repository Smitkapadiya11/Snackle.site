import { ReactNode } from "react";

interface SectionProps {
  id?: string;
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export function Section({ id, children, className = "", style }: SectionProps) {
  return (
    <section
      id={id}
      className={`snackle-section ${className}`}
      style={{
        padding: "80px 0",
        background: "transparent",
        position: "relative",
        overflow: "hidden",
        ...style,
      }}
    >
      <div className="section-wrap">{children}</div>
    </section>
  );
}
