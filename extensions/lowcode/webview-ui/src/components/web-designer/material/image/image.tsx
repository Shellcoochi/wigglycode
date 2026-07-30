import * as React from "react";
import { cn } from "@/lib/utils";

export interface ImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  /**
   * 图片地址
   */
  src?: string;
  /**
   * 替代文本
   */
  alt?: string;
  /**
   * 图片填充模式
   */
  objectFit?: "contain" | "cover" | "fill" | "none" | "scale-down";
  /**
   * 图片位置
   */
  objectPosition?: string;
  /**
   * 圆角
   */
  rounded?: "none" | "sm" | "md" | "lg" | "full";
  /**
   * 宽度
   */
  width?: string | number;
  /**
   * 高度
   */
  height?: string | number;
  /**
   * 是否显示加载状态
   */
  showLoading?: boolean;
  /**
   * 加载失败时的占位图
   */
  fallback?: string;
  /**
   * 是否填充父容器
   */
  fill?: boolean;
  /**
   * 图片优先级
   */
  priority?: boolean;
  /**
   * 图片大小
   */
  sizes?: string;
  /**
   * 质量
   */
  quality?: number;
}

// 圆角映射
const ROUNDED_MAP = {
  none: "",
  sm: "rounded-sm",
  md: "rounded-md",
  lg: "rounded-lg",
  full: "rounded-full",
};

// 填充模式映射
const OBJECT_FIT_MAP = {
  contain: "object-contain",
  cover: "object-cover",
  fill: "object-fill",
  none: "object-none",
  "scale-down": "object-scale-down",
};

export const DEFAULT_IMAGE_SRC =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'%3E%3Crect width='400' height='300' fill='%23e2e8f0'/%3E%3Ctext x='200' y='150' fill='%2364748b' font-family='Arial,sans-serif' font-size='24' text-anchor='middle' dominant-baseline='middle'%3EImage%3C/text%3E%3C/svg%3E";

export const DEFAULT_FALLBACK_SRC =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'%3E%3Crect width='400' height='300' fill='%23fecaca'/%3E%3Ctext x='200' y='150' fill='%23dc2626' font-family='Arial,sans-serif' font-size='24' font-weight='700' text-anchor='middle' dominant-baseline='middle'%3ELoad Failed%3C/text%3E%3C/svg%3E";

const Image = React.forwardRef<HTMLImageElement, ImageProps>(
  (
    {
      src = DEFAULT_IMAGE_SRC,
      alt = "图片",
      objectFit = "cover",
      objectPosition = "center",
      rounded = "md",
      width,
      height,
      showLoading = true,
      fallback = DEFAULT_FALLBACK_SRC,
      fill = false,
      priority = false,
      sizes = "100vw",
      quality = 75,
      className,
      style,
      ...props
    },
    ref
  ) => {
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState(false);
    const displaySrc = error ? fallback : src;

    React.useEffect(() => {
      setLoading(true);
      setError(false);
    }, [src]);

    const handleLoad = () => {
      setLoading(false);
    };

    const handleError = () => {
      setLoading(false);
      if (!error && fallback && fallback !== src) {
        setLoading(true);
        setError(true);
      }
    };

    // 解析宽度和高度
    const getNumberValue = (
      value: string | number | undefined
    ): number | undefined => {
      if (value === undefined) return undefined;
      if (typeof value === "number") return value;
      if (typeof value === "string") {
        const num = parseInt(value, 10);
        return isNaN(num) ? undefined : num;
      }
      return undefined;
    };

    const numericWidth = getNumberValue(width);
    const numericHeight = getNumberValue(height);

    // 计算容器样式
    const containerStyle: React.CSSProperties = {
      ...style,
    };

    if (!fill) {
      if (width) containerStyle.width = width;
      if (height) containerStyle.height = height;
    }

    // 如果 fill 为 true，容器需要有明确的尺寸
    const containerClassName = cn(
      "relative inline-block overflow-hidden",
      fill && "w-full h-full",
      ROUNDED_MAP[rounded],
      className
    );

    return (
      <div className={containerClassName} style={containerStyle}>
        {/* 加载状态 */}
        {loading && showLoading && (
          <div
            className={cn(
              "absolute inset-0 bg-muted animate-pulse flex items-center justify-center z-10",
              ROUNDED_MAP[rounded]
            )}
          >
            <span className="text-xs text-muted-foreground">加载中...</span>
          </div>
        )}

        {/* 图片 */}
        <img
          ref={ref}
          src={displaySrc}
          alt={alt}
          width={numericWidth}
          height={numericHeight}
          onLoad={handleLoad}
          onError={handleError}
          style={{
            objectFit,
            objectPosition,
          }}
          className={cn(
            'h-full',
            OBJECT_FIT_MAP[objectFit],
            loading && "opacity-0",
            ROUNDED_MAP[rounded],
            fill && "w-full h-full"
          )}
          // 排除 children 和其他可能导致问题的 props
          {...(({ children, dangerouslySetInnerHTML, ...rest }) => rest)(props)}
        />
      </div>
    );
  }
);

Image.displayName = "Image";

export { Image };
