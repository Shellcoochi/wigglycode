import { useEffect, useRef } from "react";
import { Positon } from "../types";
import { useCanvasRelativeRect } from "../hooks/use-canvas-relative-rect";

type IndicatorVariant = "target" | "context";

const getStyles = (
  position: Positon,
  rect: { top: number; left: number; width: number; height: number },
  variant: IndicatorVariant
) => {
  const top = rect.top;
  const left = rect.left;
  const width = rect.width;
  const height = rect.height;

  const baseStyles: React.CSSProperties = {
    position: "absolute",
    pointerEvents: "none",
    zIndex: variant === "context" ? 998 : 1000,
    boxSizing: "border-box",
    transition: "opacity 0.12s ease, box-shadow 0.12s ease",
  };

  const positionConfigs: Record<
    Positon,
    React.CSSProperties | undefined
  > = {
    left: {
      top: `${top}px`,
      left: `${left - 4}px`,
      width: "4px",
      height: `${height}px`,
      borderLeft: "2px solid #1890ff",
      borderRight: "2px solid #1890ff",
      backgroundColor: "#1890ff33",
    },
    right: {
      top: `${top}px`,
      left: `${left + width}px`,
      width: "4px",
      height: `${height}px`,
      borderLeft: "2px solid #1890ff",
      borderRight: "2px solid #1890ff",
      backgroundColor: "#1890ff33",
    },
    top: {
      top: `${top - 4}px`,
      left: `${left}px`,
      width: `${width}px`,
      height: "4px",
      borderTop: "2px solid #1890ff",
      borderBottom: "2px solid #1890ff",
      backgroundColor: "#1890ff33",
    },
    bottom: {
      top: `${top + height}px`,
      left: `${left}px`,
      width: `${width}px`,
      height: "4px",
      borderTop: "2px solid #1890ff",
      borderBottom: "2px solid #1890ff",
      backgroundColor: "#1890ff33",
    },
    inside:
      variant === "context"
        ? {
            top: `${top}px`,
            left: `${left}px`,
            width: `${width}px`,
            height: `${height}px`,
            border: "2px dashed rgba(16, 185, 129, 0.75)",
            backgroundColor: "rgba(16, 185, 129, 0.07)",
            boxShadow: "inset 0 0 0 1px rgba(16, 185, 129, 0.25)",
          }
        : {
            top: `${top}px`,
            left: `${left}px`,
            width: `${width}px`,
            height: `${height}px`,
            border: "2px solid #1890ff",
            backgroundColor: "#1890ff11",
          },
  };

  return {
    ...baseStyles,
    ...(positionConfigs[position] || {}),
  };
};

export const PositionIndicator: React.FC<{
  nodeId: string;
  canvasRef: React.RefObject<HTMLDivElement | null>;
  position: Positon;
  /** target: 精确落点；context: 父容器范围提示（通常配合 inside） */
  variant?: IndicatorVariant;
}> = ({ nodeId, canvasRef, position, variant = "target" }) => {
  const boxRef = useRef<HTMLDivElement>(null);
  const getRect = useCanvasRelativeRect(canvasRef);

  useEffect(() => {
    const updatePosition = () => {
      const canvas = canvasRef.current;
      const targetEl = canvas?.querySelector<HTMLElement>(
        `[data-node-id="${nodeId}"]`
      );
      const box = boxRef.current;

      if (!canvas || !targetEl || !box) return;

      const rect = getRect(targetEl);
      if (!rect) return;

      const styles = getStyles(position, rect, variant);
      Object.assign(box.style, styles);
    };

    updatePosition();

    const canvas = canvasRef.current;
    if (canvas) {
      canvas.addEventListener("scroll", updatePosition);
      window.addEventListener("resize", updatePosition);
    }

    return () => {
      if (canvas) {
        canvas.removeEventListener("scroll", updatePosition);
      }
      window.removeEventListener("resize", updatePosition);
    };
  }, [nodeId, position, variant, canvasRef, getRect]);

  return <div ref={boxRef} aria-hidden />;
};
