import type { ReactNode } from "react";

type PillProps = {
    children: ReactNode;
    className?: string;
};

export default function Pill({ children, className = "" }: PillProps) {
    return <span className={`Pill ${className}`.trim()}>{children}</span>;
}
