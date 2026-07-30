"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { useDrag, useDrop } from "react-dnd";
import type { DropTargetMonitor } from "react-dnd";
import { cn } from "@/lib/utils";
import {
  IconChevronRight,
  IconChevronDown,
  IconEye,
  IconEyeOff,
  IconLock,
  IconLockOpen,
  IconBox,
  IconSquare,
} from "@tabler/icons-react";
import { NodePositon } from "../types";

// 类型定义
interface DesignerNode {
  id: string;
  title?: string;
  componentName: string;
  isContainer?: boolean;
  props?: Record<string, any>;
  style?: React.CSSProperties;
  children?: DesignerNode[];
}

interface DragItem {
  id: string;
  type: string;
  depth?: number;
  parentId?: string | null;
  isContainer?: boolean;
  source?: "panel" | "tree";
  nodeData?: DesignerNode;
}

interface OutlinePanelProps {
  items: DesignerNode[];
  selectedNodeId: string | null;
  onSelect: (node: DesignerNode) => void;
  onMove: (dragId: string, targetId: string, position: NodePositon) => void;
  // 新增:拖拽悬停反馈
  onHover?: (dragId: string, targetId: string, position: NodePositon) => void;
  onHoverEnd?: () => void;
  // 新增:接收画布的拖拽状态
  canvasDropInfo?: { nodeId: string; position: NodePositon } | null;
}

export const OutlinePanel: React.FC<OutlinePanelProps> = ({
  items,
  selectedNodeId,
  onSelect,
  onMove,
  onHover,
  onHoverEnd,
  canvasDropInfo,
}) => {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(
    new Set(["root"])
  );
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(new Set());
  const [lockedIds, setLockedIds] = useState<Set<string>>(new Set());
  const [outlineDropInfo, setOutlineDropInfo] = useState<{
    nodeId: string;
    position: NodePositon;
  } | null>(null);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const nodeRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  const toggleExpand = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const toggleVisibility = useCallback((id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setHiddenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const toggleLock = useCallback((id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setLockedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  // 处理大纲内拖拽悬停
  const handleOutlineHover = useCallback(
    (dragId: string, targetId: string, position: NodePositon) => {
      setOutlineDropInfo({ nodeId: targetId, position });
      // 同时通知画布显示位置指示器
      onHover?.(dragId, targetId, position);
    },
    [onHover]
  );

  const handleOutlineHoverEnd = useCallback(() => {
    setOutlineDropInfo(null);
    onHoverEnd?.();
  }, [onHoverEnd]);

  // 合并大纲和画布的drop信息(优先显示大纲的)
  const activeDropInfo = outlineDropInfo || canvasDropInfo;

  // 获取节点的所有祖先ID
  const getAncestorIds = useCallback(
    (nodeId: string, nodes: DesignerNode[]): string[] => {
      const ancestors: string[] = [];

      const findAncestors = (
        id: string,
        tree: DesignerNode[],
        path: string[] = []
      ): boolean => {
        for (const node of tree) {
          if (node.id === id) {
            ancestors.push(...path);
            return true;
          }
          if (node.children) {
            if (findAncestors(id, node.children, [...path, node.id])) {
              return true;
            }
          }
        }
        return false;
      };

      findAncestors(nodeId, nodes);
      return ancestors;
    },
    []
  );

  // 滚动到指定节点
  const scrollToNode = useCallback((nodeId: string) => {
    const nodeEl = nodeRefs.current.get(nodeId);
    const container = scrollContainerRef.current;

    if (!nodeEl || !container) return;

    const containerRect = container.getBoundingClientRect();
    const nodeRect = nodeEl.getBoundingClientRect();

    // 计算相对于容器的位置
    const relativeTop = nodeRect.top - containerRect.top + container.scrollTop;
    const relativeBottom = relativeTop + nodeRect.height;

    // 检查是否在可视区域
    const isAboveView = relativeTop < container.scrollTop;
    const isBelowView =
      relativeBottom > container.scrollTop + container.clientHeight;

    if (isAboveView) {
      // 滚动到顶部附近
      container.scrollTo({
        top: relativeTop - 20,
        behavior: "smooth",
      });
    } else if (isBelowView) {
      // 滚动到底部附近
      container.scrollTo({
        top: relativeBottom - container.clientHeight + 20,
        behavior: "smooth",
      });
    }
  }, []);

  // 展开到指定节点
  const expandToNode = useCallback(
    (nodeId: string) => {
      const ancestors = getAncestorIds(nodeId, items);

      if (ancestors.length > 0) {
        setExpandedIds((prev) => {
          const next = new Set(prev);
          ancestors.forEach((id) => next.add(id));
          return next;
        });
      }
    },
    [items, getAncestorIds]
  );

  // 当选中节点变化时,展开并滚动到该节点
  useEffect(() => {
    if (selectedNodeId) {
      expandToNode(selectedNodeId);

      // 延迟滚动,等待展开动画完成
      setTimeout(() => {
        scrollToNode(selectedNodeId);
      }, 100);
    }
  }, [selectedNodeId, expandToNode, scrollToNode]);

  // 当画布拖拽的dropInfo变化时,展开并滚动到目标节点
  useEffect(() => {
    if (canvasDropInfo?.nodeId) {
      expandToNode(canvasDropInfo.nodeId);

      setTimeout(() => {
        scrollToNode(canvasDropInfo.nodeId);
      }, 100);
    }
  }, [canvasDropInfo?.nodeId, expandToNode, scrollToNode]);

  return (
    <div className="h-full flex flex-col bg-background">
      {/* 头部 */}
      <div className="p-4 border-b border-border bg-card">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-foreground">页面大纲</h3>
            <p className="mt-1 text-xs text-muted-foreground">组件结构树视图</p>
          </div>
          <div className="flex gap-1">
            <button
              onClick={() => setExpandedIds(new Set([...getAllNodeIds(items)]))}
              className="px-2 py-1 text-xs rounded hover:bg-accent transition-colors"
              title="全部展开"
            >
              展开
            </button>
            <button
              onClick={() => setExpandedIds(new Set(["root"]))}
              className="px-2 py-1 text-xs rounded hover:bg-accent transition-colors"
              title="全部折叠"
            >
              折叠
            </button>
          </div>
        </div>
      </div>

      {/* 树形列表 */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto p-2 space-y-0.5"
      >
        {items.map((item) => (
          <OutlineTreeNode
            key={item.id}
            node={item}
            depth={0}
            selectedNodeId={selectedNodeId}
            expandedIds={expandedIds}
            hiddenIds={hiddenIds}
            lockedIds={lockedIds}
            onSelect={onSelect}
            onToggleExpand={toggleExpand}
            onToggleVisibility={toggleVisibility}
            onToggleLock={toggleLock}
            onMove={onMove}
            onHover={handleOutlineHover}
            onHoverEnd={handleOutlineHoverEnd}
            activeDropInfo={activeDropInfo}
            nodeRefs={nodeRefs}
          />
        ))}
      </div>
    </div>
  );
};

// 获取所有节点ID
function getAllNodeIds(nodes: DesignerNode[]): string[] {
  const ids: string[] = [];
  const traverse = (items: DesignerNode[]) => {
    items.forEach((item) => {
      ids.push(item.id);
      if (item.children) {
        traverse(item.children);
      }
    });
  };
  traverse(nodes);
  return ids;
}

// 树节点组件
interface OutlineTreeNodeProps {
  node: DesignerNode;
  depth: number;
  selectedNodeId: string | null;
  expandedIds: Set<string>;
  hiddenIds: Set<string>;
  lockedIds: Set<string>;
  onSelect: (node: DesignerNode) => void;
  onToggleExpand: (id: string) => void;
  onToggleVisibility: (id: string, e: React.MouseEvent) => void;
  onToggleLock: (id: string, e: React.MouseEvent) => void;
  onMove: (dragId: string, targetId: string, position: NodePositon) => void;
  onHover?: (dragId: string, targetId: string, position: NodePositon) => void;
  onHoverEnd?: () => void;
  activeDropInfo?: { nodeId: string; position: NodePositon } | null;
  nodeRefs?: React.RefObject<Map<string, HTMLDivElement>>;
}

const OutlineTreeNode: React.FC<OutlineTreeNodeProps> = ({
  node,
  depth,
  selectedNodeId,
  expandedIds,
  hiddenIds,
  lockedIds,
  onSelect,
  onToggleExpand,
  onToggleVisibility,
  onToggleLock,
  onMove,
  onHover,
  onHoverEnd,
  activeDropInfo,
  nodeRefs,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [localDropPosition, setLocalDropPosition] =
    useState<NodePositon | null>(null);

  const isExpanded = expandedIds.has(node.id);
  const isHidden = hiddenIds.has(node.id);
  const isLocked = lockedIds.has(node.id);
  const isSelected = selectedNodeId === node.id;
  const hasChildren =
    node.isContainer && node.children && node.children.length > 0;

  // 判断当前节点是否是拖拽目标
  const isDropTarget = activeDropInfo?.nodeId === node.id;
  const dropPosition = isDropTarget ? activeDropInfo.position : null;

  // 注册节点ref
  useEffect(() => {
    if (ref.current && nodeRefs) {
      const currentRefs = nodeRefs.current;
      const nodeId = node.id;

      currentRefs.set(nodeId, ref.current);
      return () => {
        currentRefs.delete(nodeId);
      };
    }
  }, [node.id, nodeRefs]);

  // 拖拽配置
  const [{ isDragging }, drag] = useDrag({
    type: "outline-item",
    item: (): DragItem => ({
      id: node.id,
      type: "outline-item",
      depth,
      parentId: null,
      isContainer: node.isContainer || false,
      source: "tree",
      nodeData: node,
    }),
    canDrag: () => !isLocked && node.id !== "root",
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  // 放置配置
  const [{ isOver, canDrop }, drop] = useDrop({
    accept: ["outline-item", "tree-item"],
    canDrop: (dragItem: DragItem) => {
      if (dragItem.id === node.id) return false;
      if (isLocked) return false;
      // 检查是否拖拽到自己的子节点
      return !isDescendant(node, dragItem.id);
    },
    hover: (dragItem: DragItem, monitor: DropTargetMonitor) => {
      if (!monitor.isOver({ shallow: true }) || !monitor.canDrop()) {
        setLocalDropPosition(null);
        onHoverEnd?.();
        return;
      }

      if (dragItem.id === node.id) return;

      const hoverBoundingRect = ref.current?.getBoundingClientRect();
      if (!hoverBoundingRect) return;

      const clientOffset = monitor.getClientOffset();
      if (!clientOffset) return;

      const hoverClientY = clientOffset.y - hoverBoundingRect.top;
      const hoverHeight = hoverBoundingRect.height;

      // 计算位置
      let position: "before" | "after" | "inside" | null = null;

      if (node.isContainer && isExpanded) {
        // 容器且展开:上1/3为before,下2/3为inside
        if (hoverClientY < hoverHeight / 3) {
          position = "before";
        } else {
          position = "inside";
        }
      } else if (node.isContainer && !isExpanded) {
        // 容器但未展开:上1/3为before,中1/3为inside,下1/3为after
        if (hoverClientY < hoverHeight / 3) {
          position = "before";
        } else if (hoverClientY < (hoverHeight * 2) / 3) {
          position = "inside";
        } else {
          position = "after";
        }
      } else {
        // 非容器:上半部分before,下半部分after
        position = hoverClientY < hoverHeight / 2 ? "before" : "after";
      }

      setLocalDropPosition(position);

      // 通知父组件,触发画布的位置指示器
      if (position) {
        onHover?.(dragItem.id, node.id, position);
      }
    },
    drop: (dragItem: DragItem, monitor) => {
      if (!monitor.canDrop() || !localDropPosition) return;
      onMove(dragItem.id, node.id, localDropPosition);
      setLocalDropPosition(null);
      onHoverEnd?.();
    },
    collect: (monitor) => ({
      isOver: monitor.isOver({ shallow: true }),
      canDrop: monitor.canDrop(),
    }),
  });

  // 合并refs
  const setRefs = useCallback(
    (el: HTMLDivElement | null) => {
      ref.current = el;
      drag(el);
      drop(el);
    },
    [drag, drop]
  );

  // 检查是否是后代节点
  function isDescendant(parent: DesignerNode, childId: string): boolean {
    if (parent.id === childId) return true;
    if (!parent.children) return false;
    return parent.children.some((child) => isDescendant(child, childId));
  }

  return (
    <>
      <div
        ref={setRefs}
        className={cn(
          "group relative flex items-center gap-1 px-2 py-1 rounded-md cursor-pointer transition-colors",
          "hover:bg-accent/50",
          isSelected && "bg-accent text-accent-foreground",
          isDragging && "opacity-40",
          isHidden && "opacity-50",
          isLocked && "cursor-not-allowed"
        )}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
        onClick={() => !isLocked && onSelect(node)}
      >
        {/* 拖拽指示器 - 显示来自大纲或画布的drop信息 */}
        {dropPosition && (
          <div
            className={cn(
              "absolute left-0 right-0 pointer-events-none z-10",
              dropPosition === "before" && "top-0 h-0.5 bg-primary",
              dropPosition === "after" && "bottom-0 h-0.5 bg-primary",
              dropPosition === "inside" &&
                "inset-0 bg-primary/10 border-2 border-primary rounded-md"
            )}
          />
        )}

        {/* 展开/折叠按钮 */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (hasChildren) onToggleExpand(node.id);
          }}
          className={cn(
            "shrink-0 w-4 h-4 flex items-center justify-center rounded hover:bg-accent transition-colors",
            !hasChildren && "invisible"
          )}
        >
          {hasChildren &&
            (isExpanded ? (
              <IconChevronDown className="w-3 h-3" />
            ) : (
              <IconChevronRight className="w-3 h-3" />
            ))}
        </button>

        {/* 图标 */}
        <div className={cn("shrink-0 text-muted-foreground")}>
          {node.isContainer ? (
            <IconBox className="w-4 h-4" />
          ) : (
            <IconSquare className="w-4 h-4" />
          )}
        </div>

        {/* 标题 */}
        <div className="flex-1 min-w-0">
          <div className="text-sm truncate">{node.title || node.id}</div>
          <div className="text-xs text-muted-foreground truncate">
            {node.componentName}
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="shrink-0 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          {/* 可见性 */}
          <button
            onClick={(e) => onToggleVisibility(node.id, e)}
            className="w-6 h-6 flex items-center justify-center rounded hover:bg-accent/50 transition-colors"
            title={isHidden ? "显示" : "隐藏"}
          >
            {isHidden ? (
              <IconEyeOff className="w-3.5 h-3.5" />
            ) : (
              <IconEye className="w-3.5 h-3.5" />
            )}
          </button>

          {/* 锁定 */}
          {node.id !== "root" && (
            <button
              onClick={(e) => onToggleLock(node.id, e)}
              className="w-6 h-6 flex items-center justify-center rounded hover:bg-accent/50 transition-colors"
              title={isLocked ? "解锁" : "锁定"}
            >
              {isLocked ? (
                <IconLock className="w-3.5 h-3.5" />
              ) : (
                <IconLockOpen className="w-3.5 h-3.5" />
              )}
            </button>
          )}
        </div>
      </div>

      {/* 子节点 */}
      {hasChildren && isExpanded && (
        <div className="ml-0">
          {node.children!.map((child) => (
            <OutlineTreeNode
              key={child.id}
              node={child}
              depth={depth + 1}
              selectedNodeId={selectedNodeId}
              expandedIds={expandedIds}
              hiddenIds={hiddenIds}
              lockedIds={lockedIds}
              onSelect={onSelect}
              onToggleExpand={onToggleExpand}
              onToggleVisibility={onToggleVisibility}
              onToggleLock={onToggleLock}
              onMove={onMove}
              onHover={onHover}
              onHoverEnd={onHoverEnd}
              activeDropInfo={activeDropInfo}
              nodeRefs={nodeRefs}
            />
          ))}
        </div>
      )}
    </>
  );
};
