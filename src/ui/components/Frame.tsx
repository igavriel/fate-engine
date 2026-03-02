"use client";

import { frame } from "@/src/ui/theme/classnames";

type FrameProps = {
  children: React.ReactNode;
  className?: string;
  /** Optional padding override; default is p-6 */
  padding?: "none" | "sm" | "md" | "lg";
};

const paddingMap = {
  none: "",
  sm: "p-4",
  md: "p-6",
  lg: "p-8",
} as const;

/**
 * Stone-frame wrapper: border, inner shadow, padding. Used on every page container.
 */
export function Frame({ children, className = "", padding = "md" }: FrameProps) {
  const pad = paddingMap[padding];
  return (
    <div className={`${frame()} ${pad} ${className}`.trim()} data-testid="frame">
      {children}
    </div>
  );
}
