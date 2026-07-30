import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const textVariants = cva("w-fit h-fit", {
  variants: {
    // 文本大小
    size: {
      xs: "text-xs",
      sm: "text-sm",
      base: "text-base",
      lg: "text-lg",
      xl: "text-xl",
      "2xl": "text-2xl",
      "3xl": "text-3xl",
      "4xl": "text-4xl",
    },
    // 字重
    weight: {
      thin: "font-thin",
      light: "font-light",
      normal: "font-normal",
      medium: "font-medium",
      semibold: "font-semibold",
      bold: "font-bold",
      extrabold: "font-extrabold",
    },
    // 文本对齐
    align: {
      left: "text-left",
      center: "text-center",
      right: "text-right",
      justify: "text-justify",
    },
    // 文本颜色
    color: {
      default: "text-gray-900",
      muted: "text-gray-500",
      primary: "text-blue-600",
      secondary: "text-gray-600",
      success: "text-green-600",
      warning: "text-yellow-600",
      danger: "text-red-600",
    },
    // 文本装饰
    decoration: {
      none: "no-underline",
      underline: "underline",
      lineThrough: "line-through",
    },
    // 文本转换
    transform: {
      none: "normal-case",
      uppercase: "uppercase",
      lowercase: "lowercase",
      capitalize: "capitalize",
    },
  },
  defaultVariants: {
    size: "base",
    weight: "normal",
    align: "left",
    color: "default",
    decoration: "none",
    transform: "none",
  },
});

export interface TextProps
  extends Omit<React.HTMLAttributes<HTMLElement>, "color">,
    VariantProps<typeof textVariants> {
  /**
   * 文本内容
   */
  children?: React.ReactNode;
  /**
   * HTML 标签类型
   */
  as?: "p" | "span" | "div" | "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "label";
  /**
   * 是否截断文本
   */
  truncate?: boolean;
  /**
   * 行数限制（多行截断）
   */
  lineClamp?: number;
}

const Text = React.forwardRef<HTMLElement, TextProps>(
  (
    {
      className,
      size,
      weight,
      align,
      color,
      decoration,
      transform,
      as: Component = "p",
      truncate = false,
      lineClamp,
      children,
      ...props
    },
    ref
  ) => {
    const truncateClass = truncate ? "truncate" : "";
    const lineClampClass = lineClamp ? `line-clamp-${lineClamp}` : "";

    return (
      <Component
        ref={ref as any}
        className={cn(
          textVariants({ size, weight, align, color, decoration, transform }),
          truncateClass,
          lineClampClass,
          className
        )}
        {...props}
      >
        {children}
      </Component>
    );
  }
);

Text.displayName = "Text";

export { Text, textVariants };
