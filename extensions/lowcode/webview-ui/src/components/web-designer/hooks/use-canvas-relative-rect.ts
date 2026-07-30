import { RefObject, useCallback } from "react";

export function useCanvasRelativeRect(
  canvasRef: RefObject<HTMLDivElement | null>
) {
  const getRect = useCallback(
    (target: HTMLElement | null) => {
      const canvas = canvasRef.current;
      if (!canvas || !target) return null;

      const canvasRect = canvas.getBoundingClientRect();
      const rect = target.getBoundingClientRect();

      return {
        top: rect.top - canvasRect.top + canvas.scrollTop,
        left: rect.left - canvasRect.left + canvas.scrollLeft,
        width: rect.width,
        height: rect.height,
      };
    },
    [canvasRef]
  );

  return getRect;
}
