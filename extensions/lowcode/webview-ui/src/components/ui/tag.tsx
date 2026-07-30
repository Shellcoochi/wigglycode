"use client";

import { ReactNode, MouseEvent } from "react";
import { IconX } from "@tabler/icons-react";
import { cn } from "@/lib/utils";

type TagProps = {
  color?: "default" | "primary" | "success" | "warning" | "error" ;
  closable?: boolean;
  onClose?: (e: MouseEvent<HTMLButtonElement>) => void;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
};

const colorMap = {
  default: "bg-[var(--color-bg-secondary)]",
  primary: "bg-[var(--color-primary-light)]",
  success: "bg-green-50",
  warning: "bg-yellow-50",
  error: "bg-[var(--color-danger-hover)]",
};

const borderColorMap = {
  default: "border-[var(--color-border-secondary)]",
  primary: "border-[var(--color-primary)]",
  success: "border-green-200",
  warning: "border-yellow-200",
  error: "border-[var(--color-danger)]",
};

const textColorMap = {
  default: "text-[var(--color-text-primary)]",
  primary: "text-[var(--color-primary)]",
  success: "text-bg-base",
  warning: "text-bg-base",
  error: "text-bg-base",
};

export function Tag({
  color = "default",
  closable,
  onClose,
  icon,
  children,
  className,
}: TagProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-lg border-border text-sm px-2 py-0.5 transition-all",
        colorMap[color],
        borderColorMap[color],
        textColorMap[color],
        className
      )}
    >
      {icon && <span className="flex items-center">{icon}</span>}
      <span>{children}</span>
      {closable && (
        <button
          type="button"
          className="ml-1 inline-flex items-center p-0.5 text-inherit hover:opacity-70 focus:outline-none"
          onClick={onClose}
        >
          <IconX name="ri-close-line" className="h-3.5 w-3.5" />
        </button>
      )}
    </span>
  );
}
