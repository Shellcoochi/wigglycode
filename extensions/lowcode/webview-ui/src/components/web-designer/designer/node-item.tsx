import { useCallback, useRef, useState, useMemo } from "react";
import { DesignerNode, DragItem, DropResult, Positon } from "../types";
import { useDrag, useDrop } from "react-dnd";
import type { DropTargetMonitor } from "react-dnd";
import { findAsset } from "../utils/tools";
import { resolveNodeBindings } from "../renderer";
import { cn } from "@/lib/utils";

// 常量定义
const INDENT_SIZE = 20;

/** 点到矩形包络的最短距离（点在矩形内为 0）；间隙里选最近子元素更准确 */
const distancePointToRect = (
  px: number,
  py: number,
  rect: DOMRectReadOnly
): number => {
  const cx = Math.min(Math.max(px, rect.left), rect.right);
  const cy = Math.min(Math.max(py, rect.top), rect.bottom);
  const dx = px - cx;
  const dy = py - cy;
  return Math.sqrt(dx * dx + dy * dy);
};


// 工具函数：判断位置
const getPosition = (
  element: Element,
  point: { x: number; y: number },
  direction: "row" | "col"
): "left" | "right" | "top" | "bottom" => {
  const rect = element.getBoundingClientRect();
  const { x, y } = point;

  if (direction === "row") {
    const distanceToLeft = Math.abs(x - rect.left);
    const distanceToRight = Math.abs(x - rect.right);
    return distanceToLeft < distanceToRight ? "left" : "right";
  } else {
    const distanceToTop = Math.abs(y - rect.top);
    const distanceToBottom = Math.abs(y - rect.bottom);
    return distanceToTop < distanceToBottom ? "top" : "bottom";
  }
};

interface NodeItemProps {
  item: DesignerNode;
  depth: number;
  index: number;
  parentId: string | null;
  selectedNodeId: string | null;
  onSelect: (node: DesignerNode) => void;
  onDrop: (
    dragId: string,
    position: DropResult,
    source: "panel" | "tree",
    nodeData?: DesignerNode
  ) => void;
  findItem: (id: string) => DesignerNode | undefined;
  moveItem: (dragId: string, hoverId: string, position: DropResult) => void;
  bindingContext: {
    variables: Record<string, any>;
    dataSources: Record<string, any>;
  };
}

export const NodeItem: React.FC<NodeItemProps> = ({
  item,
  depth,
  parentId,
  selectedNodeId,
  onSelect,
  onDrop,
  findItem,
  moveItem,
  bindingContext,
}) => {
  const { id, children, isContainer, title, componentName, props, style } =
    item;
  const [dropPosition, setDropPosition] = useState<DropResult | null>(null);
  const isSelected = selectedNodeId === id;
  const dragRef = useRef<HTMLDivElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);
  // 移除未使用的 lastHoverTime ref

  // 拖拽配置
  const [{ isDragging }, drag] = useDrag({
    type: "tree-item",
    item: (): DragItem => ({
      id,
      type: "tree-item",
      depth,
      parentId,
      isContainer,
      source: "tree",
      nodeData: item,
    }),
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  // 放置配置
  const [{ isOver, canDrop }, drop] = useDrop({
    accept: ["tree-item", "component-panel-item"],
    canDrop: (dragItem: DragItem) => {
      if (dragItem.source === "panel") return true;
      if (dragItem.id === id) return false;
      // 仅当 depth 存在时比较；勿用 ??0，否则 undefined 会被当成 0 误伤合法放置
      if (
        dragItem.parentId === id &&
        dragItem.depth !== undefined &&
        dragItem.depth < depth
      ) {
        return false;
      }
      return true;
    },
    hover: (dragItem: DragItem, monitor: DropTargetMonitor) => {
      if (!monitor.isOver({ shallow: true }) || !monitor.canDrop()) {
        setDropPosition(null);
        return;
      }

      if (dragItem.source !== "panel" && dragItem.id === id) return;

      const clientOffset = monitor.getClientOffset();
      if (!clientOffset) return;

      // 计算放置位置
      const result = calculateDropPosition(clientOffset);
      setDropPosition(result);

      // 只通知位置变化，不执行实际移动
      moveItem(dragItem.id, id, result);
    },
    drop: (dragItem: DragItem, monitor): DropResult | undefined => {
      if (!monitor.canDrop()) return undefined;
      if (!isContainer && dropPosition?.position === "inside") {
        return undefined;
      }

      const position = dropPosition || { id, position: "inside" };
      onDrop(
        dragItem.id,
        position,
        dragItem.source || "tree",
        dragItem.nodeData
      );
      return position;
    },
    collect: (monitor) => ({
      isOver: monitor.isOver({ shallow: true }),
      canDrop: monitor.canDrop(),
    }),
  });

  // 在组件内解析绑定
  const resolvedProps = useMemo(
    () => resolveNodeBindings(item, bindingContext),
    [item, bindingContext]
  );

  // 计算放置位置
  const calculateDropPosition = useCallback(
    (clientOffset: { x: number; y: number }): DropResult => {
      // 一个“永远可执行”的兜底（不会产生非法语义）
      const result: DropResult = {
        id,
        position: "inside",
      };

      const el = document.querySelector(
        `[data-node-id="${id}"]`
      ) as Element | null;

      if (!el) {
        return result;
      }

      const layout = (props?.direction as "row" | "col") || "row";

      /** --------------------------------
       * 1️⃣ 空容器：必须优先 inside，否则 getPosition 只会得到四边，handleDrop 会当成 before/after
       * -------------------------------- */
      if (isContainer && (!children || children.length === 0)) {
        return {
          id,
          position: "inside",
        };
      }

      /** --------------------------------
       * 2️⃣ 非容器：在四边上插入为 before/after
       * -------------------------------- */
      if (!isContainer) {
        const position = getPosition(el, clientOffset, layout);

        return {
          id,
          position,
        };
      }

      /** --------------------------------
       * 3️⃣ 容器 + 有子节点：矩形内相对该子；间隙用点到子矩形最短距离再 getPosition（子容器四边也有蓝线）
       * -------------------------------- */
      type ClosestChild = {
        id: string;
        element: Element;
        distance: number;
      };

      const childList = children ?? [];
      if (childList.length === 0) {
        return { id, position: "inside" };
      }

      const px = clientOffset.x;
      const py = clientOffset.y;

      for (const child of childList) {
        const childEl = document.querySelector(
          `[data-node-id="${child.id}"]`,
        ) as Element | null;
        if (!childEl) continue;
        const r = childEl.getBoundingClientRect();
        if (
          px >= r.left &&
          px <= r.right &&
          py >= r.top &&
          py <= r.bottom
        ) {
          const position = getPosition(childEl, clientOffset, layout);
          return { id: child.id, position };
        }
      }

      let closest: ClosestChild | null = null;
      for (const child of childList) {
        const childEl = document.querySelector(
          `[data-node-id="${child.id}"]`,
        ) as Element | null;
        if (!childEl) continue;
        const r = childEl.getBoundingClientRect();
        const d = distancePointToRect(px, py, r);
        if (!closest || d < closest.distance) {
          closest = {
            id: child.id,
            element: childEl,
            distance: d,
          };
        }
      }

      if (!closest) {
        return { id, position: "inside" };
      }

      const edgePosition = getPosition(closest.element, clientOffset, layout);
      return { id: closest.id, position: edgePosition };
    },
    [id, isContainer, children, props?.direction]
  );

  // 合并 refs
  const setRefs = useCallback(
    (node: HTMLDivElement | null) => {
      dragRef.current = node;
      dropRef.current = node;
      drag(node);
      drop(node);
    },
    [drag, drop]
  );

  // 容器样式
  const containerStyle = useMemo((): React.CSSProperties => {
    const baseStyle: React.CSSProperties = {
      position: "relative",
      marginLeft: `${depth * INDENT_SIZE}px`,
      opacity: isDragging ? 0.5 : 1,
      padding: "8px",
      border: "1px solid #ddd",
      marginBottom: "4px",
      background: "#fff",
      cursor: "move",
      borderRadius: "4px",
    };

    if (isOver && !isSelected) {
      if (dropPosition?.position === "inside" && isContainer) {
        baseStyle.background = "#f0f9ff";
        baseStyle.border = "2px dashed #1890ff";
      } else {
        baseStyle.background = "#f5f5f5";
      }
    }

    if (!canDrop && isOver) {
      baseStyle.border = "1px solid #ff4d4f";
      baseStyle.background = "#fff2f0";
    }

    return baseStyle;
  }, [
    depth,
    isDragging,
    isOver,
    isSelected,
    dropPosition,
    isContainer,
    canDrop,
  ]);

  // 渲染子元素
  const renderChildren = useCallback(() => {
    if (!isContainer || !children || children.length === 0) {
      return null;
    }

    return children.map((child, childIndex) => (
      <NodeItem
        key={child.id}
        item={child}
        depth={depth + 1}
        index={childIndex}
        parentId={id}
        selectedNodeId={selectedNodeId}
        onSelect={onSelect}
        onDrop={onDrop}
        findItem={findItem}
        moveItem={moveItem}
        bindingContext={bindingContext}
      />
    ));
  }, [
    isContainer,
    children,
    depth,
    id,
    selectedNodeId,
    onSelect,
    onDrop,
    findItem,
    moveItem,
    bindingContext,
  ]);

  // 空容器占位符
  const renderEmptyPlaceholder = useCallback(() => {
    if (!isContainer || (children && children.length > 0)) {
      return null;
    }

    return (
      <div
        className={cn(
          "flex items-center justify-center w-full",
          "min-h-12", // 👈 关键：撑开容器
          "m-2 p-3",
          "rounded-md border border-dashed",
          "text-xs text-muted-foreground",
          "transition-colors",
          isOver && dropPosition?.position === "inside"
            ? "bg-accent/50 border-primary text-foreground"
            : "bg-muted/30 border-border"
        )}
      >
        {isOver && dropPosition?.position === "inside"
          ? "释放以添加到此容器"
          : "拖拽组件到此容器"}
      </div>
    );
  }, [isContainer, children, isOver, dropPosition]);

  // 获取组件资源
  const asset = useMemo(() => findAsset(componentName), [componentName]);

  // ============================================
  // 核心改进：统一的组件渲染逻辑
  // ============================================

  // 如果找到了对应的组件库
  if (asset?.library) {
    const Com = asset.library;

    // 容器组件：需要渲染子元素
    if (isContainer) {
      return (
        <Com {...resolvedProps} ref={setRefs} data-node-id={id} style={style}>
          {renderChildren()}
          {renderEmptyPlaceholder()}
        </Com>
      );
    }

    // 非容器组件：直接渲染
    return (
      <Com {...resolvedProps} style={style} ref={setRefs} data-node-id={id} />
    );
  }

  // ============================================
  // 降级方案：树形视图展示（用于调试或未找到组件时）
  // ============================================

  return (
    <div
      ref={setRefs}
      style={containerStyle}
      data-node-id={id}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(item);
      }}
    >
      {/* 节点信息 */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <div
          style={{
            width: "8px",
            height: "8px",
            borderRadius: "50%",
            background: isContainer ? "#1890ff" : "#52c41a",
          }}
        />
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: "bold" }}>{title || id}</div>
          <div style={{ fontSize: "12px", color: "#666" }}>{componentName}</div>
        </div>
        {isContainer && (
          <span
            style={{
              fontSize: "12px",
              color: "#1890ff",
              background: "#e6f7ff",
              padding: "2px 8px",
              borderRadius: "3px",
            }}
          >
            容器
          </span>
        )}
      </div>

      {/* 子元素 */}
      {isContainer && children && children.length > 0 && (
        <div style={{ marginTop: "8px" }}>{renderChildren()}</div>
      )}

      {/* 空容器占位符 */}
      {renderEmptyPlaceholder()}
    </div>
  );
};
