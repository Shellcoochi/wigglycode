import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

// 预设的 width/height 语义值 → 映射到 Tailwind 类
const widthMap: Record<string, string> = {
  auto: "w-auto",
  full: "w-full",
  screen: "w-screen",
  fit: "w-fit",
  min: "w-min",
  max: "w-max",
  fill: "w-full", // 语义化 alias
}

const heightMap: Record<string, string> = {
  auto: "h-auto",
  full: "h-full",
  screen: "h-screen",
  fit: "h-fit",
  min: "h-min",
  max: "h-max",
  fill: "h-full",
}

const containerVariants = cva("flex", {
  variants: {
    direction: {
      row: "flex-row",
      col: "flex-col",
      "row-reverse": "flex-row-reverse",
      "col-reverse": "flex-col-reverse",
    },
    gap: {
      none: "gap-0",
      xs: "gap-1",
      sm: "gap-2",
      md: "gap-4",
      lg: "gap-6",
      xl: "gap-8",
      "2xl": "gap-12",
    },
    justify: {
      start: "justify-start",
      center: "justify-center",
      end: "justify-end",
      between: "justify-between",
      around: "justify-around",
      evenly: "justify-evenly",
    },
    align: {
      start: "items-start",
      center: "items-center",
      end: "items-end",
      stretch: "items-stretch",
      baseline: "items-baseline",
    },
    position: {
      static: "static",
      relative: "relative",
      absolute: "absolute",
      fixed: "fixed",
      sticky: "sticky",
    },
  },
  defaultVariants: {
    direction: "row",
    gap: "md",
    justify: "start",
    align: "stretch",
    position: "relative",
  },
})

export interface ContainerProps
  extends React.HTMLAttributes<HTMLDivElement>,
    Omit<VariantProps<typeof containerVariants>, "width" | "height"> {
  /**
   * 宽度：支持预设值（'full', 'fit'...）或任意字符串（'50%', '200px', '12rem'）
   */
  width?: keyof typeof widthMap | string
  /**
   * 高度：支持预设值（'full', 'fit'...）或任意字符串（'50%', '200px', '100vh'）
   */
  height?: keyof typeof heightMap | string
  asChild?: boolean
}

const Container = React.forwardRef<HTMLDivElement, ContainerProps>(
  (
    {
      className,
      direction,
      gap,
      justify,
      align,
      position,
      width,
      height,
      style,
      ...props
    },
    ref
  ) => {

    // 处理 width：优先查预设，否则当作任意值
    let widthClass = ""
    if (width) {
      if (typeof width === "string") {
        if (width in widthMap) {
          widthClass = widthMap[width as keyof typeof widthMap]
        } else {
          // 任意值：使用 Tailwind 任意值语法 w-[...]
          // 注意：需要确保值合法，避免 XSS（但 className 一般安全）
          widthClass = `w-[${width}]`
        }
      }
    }

    // 处理 height
    let heightClass = ""
    if (height) {
      if (typeof height === "string") {
        if (height in heightMap) {
          heightClass = heightMap[height as keyof typeof heightMap]
        } else {
          heightClass = `h-[${height}]`
        }
      }
    }

    return (
      <div
        ref={ref}
        className={cn(
          containerVariants({ direction, gap, justify, align, position }),
          widthClass,
          heightClass,
          className
        )}
        style={style}
        {...props}
      />
    )
  }
)

Container.displayName = "Container"

export { Container, containerVariants }