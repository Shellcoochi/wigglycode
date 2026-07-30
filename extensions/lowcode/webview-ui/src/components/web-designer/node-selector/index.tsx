"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { cn } from "@/lib/utils";

type ResizeHandle =
  | "top"
  | "right"
  | "bottom"
  | "left"
  | "top-left"
  | "top-right"
  | "bottom-left"
  | "bottom-right";

interface ResizeHandleProps {
  position: ResizeHandle;
  onResizeStart: (e: React.MouseEvent, handle: ResizeHandle) => void;
}

const ResizeHandleComponent: React.FC<ResizeHandleProps> = ({
  position,
  onResizeStart,
}) => {
  const isCorner = position.includes("-");

  const positionStyles: Record<ResizeHandle, string> = {
    top: "top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 cursor-n-resize w-full h-2",
    right:
      "right-0 top-1/2 translate-x-1/2 -translate-y-1/2 cursor-e-resize w-2 h-full",
    bottom:
      "bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 cursor-s-resize w-full h-2",
    left: "left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 cursor-w-resize w-2 h-full",
    "top-left":
      "top-0 left-0 -translate-x-1/2 -translate-y-1/2 cursor-nw-resize",
    "top-right":
      "top-0 right-0 translate-x-1/2 -translate-y-1/2 cursor-ne-resize",
    "bottom-left":
      "bottom-0 left-0 -translate-x-1/2 translate-y-1/2 cursor-sw-resize",
    "bottom-right":
      "bottom-0 right-0 translate-x-1/2 translate-y-1/2 cursor-se-resize",
  };

  return (
    <div
      className={cn(
        "absolute z-10",
        positionStyles[position],
        isCorner && "w-3 h-3"
      )}
      style={{
        // 🔧 关键: 手柄需要启用 pointer-events 来接收点击
        pointerEvents: "auto",
      }}
      onMouseDown={(e) => {
        e.stopPropagation();
        onResizeStart(e, position);
      }}
    >
      {isCorner && (
        <div className="w-full h-full bg-white border-2 border-primary rounded-full hover:scale-125 transition-transform" />
      )}
    </div>
  );
};

export const NodeSelector: React.FC<{
  nodeId: string;
  canvasRef: React.RefObject<HTMLDivElement | null>;
  isSelected?: boolean;
  zoom?: number;
  onResize?: (
    nodeId: string,
    updates: {
      width?: string;
      height?: string;
    }
  ) => void;
}> = ({ nodeId, canvasRef, isSelected = false, zoom = 100, onResize }) => {
  const boxRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const prevZoomRef = useRef<number>(zoom);

  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<ResizeHandle | null>(null);
  const [keepAspectRatio, setKeepAspectRatio] = useState(false);

  const resizeDataRef = useRef<{
    startX: number;
    startY: number;
    startWidth: number;
    startHeight: number;
    aspectRatio: number;
    startTop: number;
    startLeft: number;
  } | null>(null);

  // 同步选择框位置到元素
  const syncBoxPosition = useCallback(() => {
    const canvas = canvasRef.current;
    const box = boxRef.current;
    if (!canvas || !box) return;

    const targetEl = canvas.querySelector<HTMLElement>(
      `[data-node-id="${nodeId}"]`
    );
    if (!targetEl) return;

    const canvasRect = canvas.getBoundingClientRect();
    const targetRect = targetEl.getBoundingClientRect();

    const top = targetRect.top - canvasRect.top + canvas.scrollTop;
    const left = targetRect.left - canvasRect.left + canvas.scrollLeft;

    box.style.position = "absolute";
    box.style.top = `${top}px`;
    box.style.left = `${left}px`;
    box.style.width = `${targetRect.width}px`;
    box.style.height = `${targetRect.height}px`;
    // 🔧 关键修复: 选择框本身始终不阻挡事件,只有手柄可以交互
    box.style.pointerEvents = "none";
    box.style.zIndex = "1000";
    box.style.boxSizing = "border-box";
  }, [nodeId, canvasRef]);

  const handleResizeStart = useCallback(
    (e: React.MouseEvent, handle: ResizeHandle) => {
      e.preventDefault();
      e.stopPropagation();

      const canvas = canvasRef.current;
      const box = boxRef.current;
      if (!canvas || !box) return;

      const targetEl = canvas.querySelector<HTMLElement>(
        `[data-node-id="${nodeId}"]`
      );
      if (!targetEl) return;

      targetEl.style.transition = "none";
      const rect = targetEl.getBoundingClientRect();
      const canvasRect = canvas.getBoundingClientRect();

      setKeepAspectRatio(e.shiftKey);

      resizeDataRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        startWidth: rect.width,
        startHeight: rect.height,
        aspectRatio: rect.width / rect.height,
        // 🔧 记录初始位置
        startTop: rect.top - canvasRect.top + canvas.scrollTop,
        startLeft: rect.left - canvasRect.left + canvas.scrollLeft,
      };

      setIsResizing(true);
      setResizeHandle(handle);
    },
    [nodeId, canvasRef]
  );

  // 拖拽改变大小
  useEffect(() => {
    if (!isResizing || !resizeHandle || !resizeDataRef.current) return;

    let rafId: number | null = null;

    const handleMouseMove = (e: MouseEvent) => {
      if (!resizeDataRef.current) return;

      const canvas = canvasRef.current;
      if (!canvas) return;

      const targetEl = canvas.querySelector<HTMLElement>(
        `[data-node-id="${nodeId}"]`
      );
      if (!targetEl) return;

      const { startX, startY, startWidth, startHeight, aspectRatio } =
        resizeDataRef.current;

      const deltaX = e.clientX - startX;
      const deltaY = e.clientY - startY;

      let newWidth = startWidth;
      let newHeight = startHeight;

      const shouldKeepRatio = keepAspectRatio || e.shiftKey;

      // 根据拖拽手柄计算新的宽高
      if (resizeHandle === "right") {
        newWidth = Math.max(50, startWidth + deltaX);
        if (shouldKeepRatio) {
          newHeight = newWidth / aspectRatio;
        }
      } else if (resizeHandle === "left") {
        newWidth = Math.max(50, startWidth - deltaX);
        if (shouldKeepRatio) {
          newHeight = newWidth / aspectRatio;
        }
      } else if (resizeHandle === "bottom") {
        newHeight = Math.max(50, startHeight + deltaY);
        if (shouldKeepRatio) {
          newWidth = newHeight * aspectRatio;
        }
      } else if (resizeHandle === "top") {
        newHeight = Math.max(50, startHeight - deltaY);
        if (shouldKeepRatio) {
          newWidth = newHeight * aspectRatio;
        }
      } else if (resizeHandle === "bottom-right") {
        newWidth = Math.max(50, startWidth + deltaX);
        newHeight = Math.max(50, startHeight + deltaY);

        if (shouldKeepRatio) {
          const avgDelta = (deltaX + deltaY) / 2;
          newWidth = Math.max(50, startWidth + avgDelta);
          newHeight = newWidth / aspectRatio;
        }
      } else if (resizeHandle === "bottom-left") {
        newWidth = Math.max(50, startWidth - deltaX);
        newHeight = Math.max(50, startHeight + deltaY);

        if (shouldKeepRatio) {
          const avgDelta = (-deltaX + deltaY) / 2;
          newHeight = Math.max(50, startHeight + avgDelta);
          newWidth = newHeight * aspectRatio;
        }
      } else if (resizeHandle === "top-right") {
        newWidth = Math.max(50, startWidth + deltaX);
        newHeight = Math.max(50, startHeight - deltaY);

        if (shouldKeepRatio) {
          const avgDelta = (deltaX - deltaY) / 2;
          newWidth = Math.max(50, startWidth + avgDelta);
          newHeight = newWidth / aspectRatio;
        }
      } else if (resizeHandle === "top-left") {
        newWidth = Math.max(50, startWidth - deltaX);
        newHeight = Math.max(50, startHeight - deltaY);

        if (shouldKeepRatio) {
          const avgDelta = (-deltaX - deltaY) / 2;
          newWidth = Math.max(50, startWidth + avgDelta);
          newHeight = newWidth / aspectRatio;
        }
      }

      // 取消之前的动画帧
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }

      // 使用 RAF 更新
      rafId = requestAnimationFrame(() => {
        // 🔧 修复2: 使用 minWidth/maxWidth 确保宽度可以改变
        targetEl.style.width = `${Math.round(newWidth)}px`;
        targetEl.style.height = `${Math.round(newHeight)}px`;
        targetEl.style.minWidth = "unset";
        targetEl.style.maxWidth = "unset";
        targetEl.style.minHeight = "unset";
        targetEl.style.maxHeight = "unset";
        targetEl.style.flexShrink = "0";
        targetEl.style.flexGrow = "0";

        // 立即同步选择框位置
        syncBoxPosition();
      });
    };

    const handleMouseUp = () => {
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }

      if (!resizeDataRef.current) return;

      const canvas = canvasRef.current;
      if (!canvas) return;

      const targetEl = canvas.querySelector<HTMLElement>(
        `[data-node-id="${nodeId}"]`
      );
      if (!targetEl) return;
      targetEl.style.transition = "";
      // 收集实际应用的样式变化
      const updates: Parameters<NonNullable<typeof onResize>>[1] = {};

      if (targetEl.style.width) {
        updates.width = targetEl.style.width;
      }
      if (targetEl.style.height) {
        updates.height = targetEl.style.height;
      }

      // 🔧 保存完成后清理临时样式,让组件使用设置的宽高
      targetEl.style.minWidth = "";
      targetEl.style.maxWidth = "";
      targetEl.style.minHeight = "";
      targetEl.style.maxHeight = "";
      targetEl.style.flexShrink = "";
      targetEl.style.flexGrow = "";

      // 通知父组件保存到 Schema
      if (Object.keys(updates).length > 0) {
        onResize?.(nodeId, updates);
      }

      setIsResizing(false);
      setResizeHandle(null);
      resizeDataRef.current = null;

      // 最后同步一次
      syncBoxPosition();
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [
    isResizing,
    resizeHandle,
    keepAspectRatio,
    nodeId,
    onResize,
    canvasRef,
    syncBoxPosition,
  ]);

  // 监听位置变化
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const zoomChanged = prevZoomRef.current !== zoom;
    prevZoomRef.current = zoom;

    if (zoomChanged) {
      const startTime = Date.now();
      const continuousUpdate = () => {
        syncBoxPosition();
        if (Date.now() - startTime < 300) {
          animationFrameRef.current = requestAnimationFrame(continuousUpdate);
        }
      };
      continuousUpdate();
    } else {
      syncBoxPosition();
    }

    const targetEl = canvas.querySelector<HTMLElement>(
      `[data-node-id="${nodeId}"]`
    );

    // 🔧 只在非拖拽改变大小时监听变化
    if (!isResizing) {
      // 使用 MutationObserver 监听属性变化
      const mutationObserver = new MutationObserver(() => {
        syncBoxPosition();
      });

      if (targetEl) {
        mutationObserver.observe(targetEl, {
          attributes: true,
          childList: true,
          subtree: true,
        });
      }

      // 监听父容器的变化
      const parentEl = targetEl?.parentElement;
      const parentObserver = new MutationObserver(() => {
        syncBoxPosition();
      });

      if (parentEl) {
        parentObserver.observe(parentEl, {
          attributes: true,
          childList: true,
          subtree: false,
        });
      }

      const resizeObserver = new ResizeObserver(() => {
        syncBoxPosition();
      });

      if (targetEl) {
        resizeObserver.observe(targetEl);
      }

      // 定时器后备
      const intervalId = setInterval(() => {
        syncBoxPosition();
      }, 100);

      canvas.addEventListener("scroll", syncBoxPosition);
      window.addEventListener("resize", syncBoxPosition);

      return () => {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
        mutationObserver.disconnect();
        parentObserver.disconnect();
        resizeObserver.disconnect();
        clearInterval(intervalId);
        canvas.removeEventListener("scroll", syncBoxPosition);
        window.removeEventListener("resize", syncBoxPosition);
      };
    }
  }, [nodeId, zoom, canvasRef, syncBoxPosition, isResizing]);

  return (
    <div
      ref={boxRef}
      className={cn(
        "absolute",
        isSelected
          ? "border-2 border-primary"
          : "border border-dashed border-blue-400",
        "rounded-md",
        isResizing && "border-primary border-2"
      )}
      style={{
        boxSizing: "border-box",
      }}
    >
      {isSelected && (
        <>
          <ResizeHandleComponent
            position="top-left"
            onResizeStart={handleResizeStart}
          />
          <ResizeHandleComponent
            position="top-right"
            onResizeStart={handleResizeStart}
          />
          <ResizeHandleComponent
            position="bottom-left"
            onResizeStart={handleResizeStart}
          />
          <ResizeHandleComponent
            position="bottom-right"
            onResizeStart={handleResizeStart}
          />
          <ResizeHandleComponent
            position="top"
            onResizeStart={handleResizeStart}
          />
          <ResizeHandleComponent
            position="right"
            onResizeStart={handleResizeStart}
          />
          <ResizeHandleComponent
            position="bottom"
            onResizeStart={handleResizeStart}
          />
          <ResizeHandleComponent
            position="left"
            onResizeStart={handleResizeStart}
          />
        </>
      )}
    </div>
  );
};
