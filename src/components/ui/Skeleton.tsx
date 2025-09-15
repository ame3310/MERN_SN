import type { CSSProperties } from "react";

type Props = { className?: string; style?: CSSProperties };

export default function Skeleton({ className = "", style }: Props) {
  return <span className={`skeleton ${className}`} style={style} aria-hidden="true" />;
}
