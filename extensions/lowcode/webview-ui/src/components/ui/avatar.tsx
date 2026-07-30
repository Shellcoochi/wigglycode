"use client";

import * as React from "react";
import * as AvatarPrimitive from "@radix-ui/react-avatar";

import { cn } from "@/lib/utils";

function AvatarRoot({
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Root>) {
  return (
    <AvatarPrimitive.Root
      data-slot="avatar"
      className={cn(
        "relative flex size-8 shrink-0 overflow-hidden rounded-full",
        className
      )}
      {...props}
    />
  );
}

function AvatarImage({
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Image>) {
  return (
    <AvatarPrimitive.Image
      data-slot="avatar-image"
      className={cn("aspect-square size-full", className)}
      {...props}
    />
  );
}

function AvatarFallback({
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Fallback>) {
  return (
    <AvatarPrimitive.Fallback
      data-slot="avatar-fallback"
      className={cn(
        "bg-muted flex size-full items-center justify-center rounded-full",
        className
      )}
      {...props}
    />
  );
}

type AvatarProps = {
  src?: string;
  alt?: string;
  fallback?: string | React.ReactNode;
  size?: "small" | "default" | "large" | number;
  shape?: "circle" | "square";
  className?: string;
};

const sizeMap = {
  small: "24px",
  default: "32px",
  large: "40px",
};

const Avatar = ({
  src,
  alt = "",
  fallback,
  size = "default",
  shape = "circle",
  className,
}: AvatarProps) => {
  const resolvedSize = typeof size === "number" ? `${size}px` : sizeMap[size];
  const radiusClass =
    shape === "circle" ? "rounded-full" : "rounded-[var(--radius)]";

  return (
    <AvatarRoot
      className={cn(radiusClass, className)}
      style={{
        width: resolvedSize,
        height: resolvedSize,
        fontSize: `calc(${resolvedSize} * 0.4)`,
      }}
    >
      <AvatarImage src={src} alt={alt} />
      <AvatarFallback className={radiusClass} delayMs={src ? 600 : 0}>{fallback}</AvatarFallback>
    </AvatarRoot>
  );
};

export { AvatarRoot, AvatarImage, AvatarFallback };
export default Avatar;
