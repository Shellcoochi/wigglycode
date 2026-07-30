"use client";

import { useState, useCallback, useRef, useEffect, useMemo, type DragEvent, type MouseEvent as ReactMouseEvent, type WheelEvent as ReactWheelEvent } from "react";
import { DndProvider, useDragDropManager } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  DesignerNode,
  DropResult,
  NodePositon,
  PageSchema,
  ViewMode,
} from "../types";
import materials from "../material";
import { findNode, findParentNodeId, generateNodeId } from "../utils/tools";
import { NodeSelector } from "../node-selector";
import { NodeItem } from "./node-item";
import { PositionIndicator } from "../position-indicator";
import { initialPageSchema } from "./initial-schema";
import { useHistory } from "../hooks/use-history";
import { useClipboard } from "../hooks/use-clipboard";
import { SafeRenderer } from "../renderer";
import PropertyPanel from "../property-panel";

const { assets, snippets } = materials;
const nativeComponentDragMimeType = "application/vnd.wigglycode.snippet";
const designSurfaceWidth = 1200;
const designSurfaceMinHeight = 900;

interface DesignerProps {
  vscode?: {
    postMessage(message: unknown): void;
  };
}

const findAsset = (componentName: string) => {
  return assets.find((asset: any) => asset.componentName === componentName);
};

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

const getEdgePosition = (
  element: Element,
  point: { x: number; y: number },
  direction: "row" | "col"
): "left" | "right" | "top" | "bottom" => {
  const rect = element.getBoundingClientRect();
  const { x, y } = point;

  if (direction === "row") {
    return Math.abs(x - rect.left) < Math.abs(x - rect.right) ? "left" : "right";
  }

  return Math.abs(y - rect.top) < Math.abs(y - rect.bottom) ? "top" : "bottom";
};


/**
 * 必须在 DndProvider 内挂载：任意拖拽结束（释放、取消、放回不可投放处）时清空插入线状态。
 */
function ClearDropIndicatorOnDragEnd({
  setDropInfo,
}: {
  setDropInfo: React.Dispatch<React.SetStateAction<DropResult | null>>;
}) {
  const manager = useDragDropManager();
  const wasDraggingRef = useRef(false);

  useEffect(() => {
    const monitor = manager.getMonitor();
    return monitor.subscribeToStateChange(() => {
      const dragging = monitor.isDragging();
      if (wasDraggingRef.current && !dragging) {
        setDropInfo(null);
      }
      wasDraggingRef.current = dragging;
    });
  }, [manager, setDropInfo]);

  return null;
}

/** 主组件 **/
export default function Designer({ vscode }: DesignerProps) {
  // ✅ 使用 useHistory 管理 Schema
  const history = useHistory<PageSchema>(initialPageSchema);
  const schema = history.state;
  const setSchema = history.set;

  // UI 状态
  const [selectedNode, setSelectedNode] = useState<DesignerNode | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [dropInfo, setDropInfo] = useState<DropResult | null>(null);

  const [viewMode, setViewMode] = useState<ViewMode>("design");
  const [zoom, setZoom] = useState(100);
  const [viewportTool, setViewportTool] = useState<"select" | "pan">("select");
  const [spacePanActive, setSpacePanActive] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [panOffset, setPanOffset] = useState({ x: 96, y: 48 });

  const canvasRef = useRef<HTMLDivElement>(null);
  const panSessionRef = useRef<{
    lastClientX: number;
    lastClientY: number;
  } | null>(null);
  const viewportPanDeltaRef = useRef({ x: 0, y: 0 });
  const viewportPanRafRef = useRef<number | null>(null);
  const viewportPanIdleTimerRef = useRef<number | null>(null);
  const viewportZoomIdleTimerRef = useRef<number | null>(null);
  const [isViewportPanning, setIsViewportPanning] = useState(false);
  const [isWheelZooming, setIsWheelZooming] = useState(false);

  // ✅ 从 schema 中解构
  const items = schema.components;

  const dropContextContainerId = useMemo(() => {
    if (!dropInfo?.id) return null;
    if (dropInfo.position === "inside") return null;
    return findParentNodeId(items, dropInfo.id);
  }, [dropInfo, items]);

  const dropHintLabel = useMemo(() => {
    if (!dropInfo?.id) return null;
    const lbl = (n: DesignerNode | undefined) =>
      n?.title || n?.componentName || n?.id || "";
    const self = findNode(dropInfo.id, items);
    if (dropInfo.position === "inside") {
      return `放入容器内：${lbl(self)}`;
    }
    const pid = findParentNodeId(items, dropInfo.id);
    if (pid) {
      return `仍在父容器「${lbl(findNode(pid, items))}」内 · 蓝线为插入位置`;
    }
    return `在「${lbl(self)}」附近插入`;
  }, [dropInfo, items]);

  const selectedAsset = useMemo(() => {
    if (!selectedNode) return null;
    return findAsset(selectedNode.componentName);
  }, [selectedNode]);

  const isPanToolActive = viewportTool === "pan" || spacePanActive;
  const hideSelectionAffordance = isViewportPanning || !!dropInfo;
  const hideHoverAffordance = hideSelectionAffordance || isWheelZooming;

  useEffect(() => {
    vscode?.postMessage({
      command: "viewportState",
      payload: {
        tool: viewportTool,
        panActive: viewportTool === "pan",
        zoom,
      },
    });
  }, [viewportTool, vscode, zoom]);

  const setBoundedZoom = useCallback((nextZoom: number) => {
    setZoom(Math.min(200, Math.max(10, Math.round(nextZoom))));
  }, []);

  const queueViewportPan = useCallback((deltaX: number, deltaY: number) => {
    if (!deltaX && !deltaY) return;

    viewportPanDeltaRef.current.x += deltaX;
    viewportPanDeltaRef.current.y += deltaY;
    setIsViewportPanning(true);

    if (viewportPanRafRef.current === null) {
      viewportPanRafRef.current = requestAnimationFrame(() => {
        const delta = viewportPanDeltaRef.current;
        viewportPanDeltaRef.current = { x: 0, y: 0 };
        viewportPanRafRef.current = null;

        setPanOffset((prev) => ({
          x: prev.x + delta.x,
          y: prev.y + delta.y,
        }));
      });
    }

    if (viewportPanIdleTimerRef.current !== null) {
      window.clearTimeout(viewportPanIdleTimerRef.current);
    }
    viewportPanIdleTimerRef.current = window.setTimeout(() => {
      setIsViewportPanning(false);
      viewportPanIdleTimerRef.current = null;
    }, 80);
  }, []);

  const zoomViewportAtPoint = useCallback(
    (nextZoom: number, point: { clientX: number; clientY: number }) => {
      const canvas = canvasRef.current;
      if (!canvas) {
        setBoundedZoom(nextZoom);
        return;
      }

      const boundedZoom = Math.min(200, Math.max(10, Math.round(nextZoom)));
      if (boundedZoom === zoom) return;

      const canvasRect = canvas.getBoundingClientRect();
      const oldScale = zoom / 100;
      const nextScale = boundedZoom / 100;
      const pointerX = point.clientX - canvasRect.left;
      const pointerY = point.clientY - canvasRect.top;
      const worldX = (pointerX - panOffset.x) / oldScale;
      const worldY = (pointerY - panOffset.y) / oldScale;

      setZoom(boundedZoom);
      setPanOffset({
        x: pointerX - worldX * nextScale,
        y: pointerY - worldY * nextScale,
      });
    },
    [panOffset, setBoundedZoom, zoom]
  );

  const resetViewport = useCallback(() => {
    setPanOffset({ x: 96, y: 48 });
    setBoundedZoom(100);
  }, [setBoundedZoom]);

  // 变量运行时值
  const [variableValues, setVariableValues] = useState<Record<string, any>>(
    () => {
      const values: Record<string, any> = {};
      schema.variables.forEach((v) => {
        values[v.name] = v.defaultValue;
      });
      return values;
    }
  );

  // 数据源运行时值（新建数据源时合并进 map；已有 id 保留运行时缓存）
  const [dataSourceValues, setDataSourceValues] = useState<Record<string, any>>(
    () => {
      const values: Record<string, any> = {};
      schema.dataSources.forEach((ds) => {
        values[ds.id] = ds.config.data ?? null;
      });
      return values;
    }
  );

  useEffect(() => {
    setDataSourceValues((prev) => {
      const next = { ...prev };
      for (const ds of schema.dataSources) {
        if (!(ds.id in next)) {
          next[ds.id] = ds.config.data ?? null;
        }
      }
      return next;
    });
  }, [schema.dataSources]);

  const clipboard = useClipboard();

  // 创建绑定上下文
  const bindingContext = useMemo(
    () => ({
      variables: variableValues,
      dataSources: dataSourceValues,
    }),
    [variableValues, dataSourceValues]
  );

  // ============================================
  // Schema 更新方法
  // ============================================

  const setItems = useCallback(
    (
      newItemsOrUpdater:
        | DesignerNode[]
        | ((prev: DesignerNode[]) => DesignerNode[])
    ) => {
      setSchema((prev) => {
        const newComponents =
          typeof newItemsOrUpdater === "function"
            ? newItemsOrUpdater(prev.components)
            : newItemsOrUpdater;

        return {
          ...prev,
          components: newComponents,
          meta: {
            ...prev.meta,
            updatedAt: new Date().toISOString(),
          },
        };
      });
    },
    [setSchema]
  );

  // TODO: 数据源更新函数 - 在将来实现数据源编辑功能时使用
  // const setDataSources = useCallback(
  //   (newDataSources: DataSource[]) => {
  //     setSchema((prev) => ({
  //       ...prev,
  //       dataSources: newDataSources,
  //       meta: {
  //         ...prev.meta,
  //         updatedAt: new Date().toISOString(),
  //       },
  //     }));
  //   },
  //   [setSchema]
  // );

  const removeItem = useCallback(
    (id: string, tree: DesignerNode[]): DesignerNode[] => {
      const removeRecursive = (nodes: DesignerNode[]): DesignerNode[] => {
        return nodes
          .filter((item) => {
            if (item.id === id) {
              if (selectedNode?.id === id) {
                setSelectedNode(null);
              }
              return false;
            }
            return true;
          })
          .map((item) => {
            if (item.isContainer && item.children?.length) {
              return {
                ...item,
                children: removeRecursive(item.children),
              };
            }
            return item;
          });
      };
      return removeRecursive(tree);
    },
    [selectedNode]
  );

  const deleteNode = useCallback(
    (nodeId: string) => {
      setItems((prev) => removeItem(nodeId, prev));
      toast.success("删除成功");
    },
    [removeItem, setItems]
  );

  // ============================================
  // 画布交互监听
  // ============================================

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleMouseMove = (e: globalThis.MouseEvent) => {
      if (isPanToolActive || isPanning || hideHoverAffordance) {
        setHoveredNodeId(null);
        return;
      }

      const el = document.elementFromPoint(e.clientX, e.clientY);
      const nodeId = el
        ?.closest?.("[data-node-id]")
        ?.getAttribute("data-node-id");
      setHoveredNodeId(nodeId || null);
    };

    const handleClickCapture = (e: globalThis.MouseEvent) => {
      if (isPanToolActive) {
        return;
      }

      const el = e.target as HTMLElement;
      const nodeEl = el.closest?.("[data-node-id]");
      const id = nodeEl?.getAttribute("data-node-id");

      if (id) {
        const node = findNode(id, items);
        setSelectedNode(node || null);
      } else {
        setSelectedNode(null);
      }
    };

    canvas.addEventListener("mousemove", handleMouseMove, { capture: true });
    canvas.addEventListener("click", handleClickCapture, { capture: true });

    return () => {
      canvas.removeEventListener("mousemove", handleMouseMove, {
        capture: true,
      });
      canvas.removeEventListener("click", handleClickCapture, {
        capture: true,
      });
    };
  }, [items, viewMode, isPanToolActive, isPanning, hideHoverAffordance]);

  // ============================================
  // 节点操作辅助方法
  // ============================================

  const findItem = useCallback(
    function findItemRecursive(
      id: string,
      tree: DesignerNode[] = items
    ): DesignerNode | undefined {
      for (const item of tree) {
        if (item.id === id) return item;
        if (item.isContainer && item.children) {
          const found = findItemRecursive(id, item.children);
          if (found) return found;
        }
      }
      return undefined;
    },
    [items]
  );

  const insertItem = useCallback(
    (
      item: DesignerNode,
      targetId: string,
      position: NodePositon,
      tree: DesignerNode[]
    ): DesignerNode[] => {
      return tree.flatMap((node) => {
        if (node.id === targetId) {
          if (position === "inside") {
            if (!node.isContainer) {
              toast.warning(`元素 ${targetId} 不是容器,不能包含子元素`);
              return [node];
            }
            return [
              {
                ...node,
                children: [item, ...(node.children ?? [])],
              },
            ];
          } else if (position === "before") {
            return [item, node];
          } else {
            return [node, item];
          }
        }

        if (node.isContainer && node.children) {
          return [
            {
              ...node,
              children: insertItem(item, targetId, position, node.children),
            },
          ];
        }

        return [node];
      });
    },
    []
  );

  // ============================================
  // 拖拽处理
  // ============================================

  const handleDrop = useCallback(
    (dragId: string, result: DropResult, source: "panel" | "tree" = "tree") => {
      const dropId = result.id;
      let position: NodePositon = "inside";
      if (result.position === "left" || result.position === "top") {
        position = "before";
      }
      if (result.position === "right" || result.position === "bottom") {
        position = "after";
      }
      if (result.position === "inside") {
        position = "inside";
      }

      if (source === "tree" && dragId === dropId) {
        setDropInfo(null);
        return;
      }

      let draggedItem: DesignerNode;

      if (source === "panel") {
        const template = snippets.find((t: { id: string }) => t.id === dragId);
        if (!template) {
          toast.warning(`找不到组件模板: ${dragId}`);
          setDropInfo(null);
          return;
        }

        const asset = findAsset(template.schema.componentName);
        draggedItem = {
          id: generateNodeId(),
          title: template.title,
          componentName: template.schema.componentName,
          isContainer: asset?.configure?.component?.isContainer,
          props: { ...template.schema.props },
          style: { ...template.schema.style },
          children: asset?.configure?.component?.isContainer ? [] : undefined,
        };
      } else {
        draggedItem = findItem(dragId)!;
        if (!draggedItem) {
          toast.warning(`找不到拖拽的元素: ${dragId}`);
          setDropInfo(null);
          return;
        }
      }

      const dropItem = findItem(dropId);
      if (!dropItem) {
        toast.warning(`找不到目标元素: ${dropId}`);
        setDropInfo(null);
        return;
      }

      if (source === "tree") {
        const isDescendant = (parentId: string, childId: string): boolean => {
          const item = findItem(parentId);
          if (!item) return false;
          if (item.children?.some((child) => child.id === childId)) return true;
          return !!item.children?.some((child) =>
            isDescendant(child.id, childId)
          );
        };

        if (position === "inside" && isDescendant(dragId, dropId)) {
          toast.warning(`不能将父节点拖拽到子节点中`);
          setDropInfo(null);
          return;
        }
      }

      if (position === "inside" && !dropItem.isContainer) {
        toast.warning(`元素 ${dropId} 不是容器,不能包含子元素`);
        setDropInfo(null);
        return;
      }

      setItems((prevItems) => {
        let newItems = prevItems;

        if (source === "tree") {
          newItems = removeItem(dragId, prevItems);
        }

        return insertItem(draggedItem, dropId, position, newItems);
      });

      setSelectedNode(draggedItem);
      setDropInfo(null);
    },
    [findItem, removeItem, insertItem, setItems]
  );

  const moveItem = useCallback(
    (dragId: string, hoverId: string, dropResult: DropResult) => {
      setDropInfo(dropResult);
    },
    []
  );

  const insertSnippet = useCallback(
    (snippetId: string, dropResult?: DropResult) => {
      const template = snippets.find((t: { id: string }) => t.id === snippetId);
      if (!template) {
        toast.warning(`找不到组件模板: ${snippetId}`);
        return;
      }

      const asset = findAsset(template.schema.componentName);
      const newNode: DesignerNode = {
        id: generateNodeId(),
        title: template.title,
        componentName: template.schema.componentName,
        isContainer: asset?.configure?.component?.isContainer,
        props: { ...template.schema.props },
        style: { ...template.schema.style },
        children: asset?.configure?.component?.isContainer ? [] : undefined,
      };

      const fallbackTargetNode = selectedNode ? findItem(selectedNode.id) : undefined;
      const fallbackTargetId = fallbackTargetNode?.id ?? "root";
      const targetId = dropResult?.id ?? fallbackTargetId;
      const targetNode = findItem(targetId);

      if (!targetNode) {
        toast.warning(`找不到目标元素: ${targetId}`);
        return;
      }

      let position: NodePositon = targetNode.isContainer ? "inside" : "after";
      if (dropResult?.position === "left" || dropResult?.position === "top") {
        position = "before";
      }
      if (dropResult?.position === "right" || dropResult?.position === "bottom") {
        position = "after";
      }
      if (dropResult?.position === "inside") {
        position = "inside";
      }

      if (position === "inside" && !targetNode.isContainer) {
        position = "after";
      }

      setItems((prevItems) => insertItem(newNode, targetId, position, prevItems));
      setSelectedNode(newNode);
      setDropInfo(null);
      toast.success(`已插入 ${template.title}`);
    },
    [findItem, insertItem, selectedNode, setItems]
  );

  const calculateNativeComponentDropResult = useCallback(
    (event: DragEvent<HTMLDivElement>): DropResult | null => {
      const canvas = canvasRef.current;
      if (!canvas) return null;

      const point = { x: event.clientX, y: event.clientY };
      const rawElement = document.elementFromPoint(point.x, point.y) as HTMLElement | null;
      const nodeElement = rawElement?.closest?.("[data-node-id]") as HTMLElement | null;
      const targetElement = nodeElement && canvas.contains(nodeElement)
        ? nodeElement
        : canvas.querySelector<HTMLElement>('[data-node-id="root"]');

      if (!targetElement) return null;

      const targetId = targetElement.getAttribute("data-node-id");
      if (!targetId) return null;

      const targetNode = findItem(targetId);
      if (!targetNode) return null;

      const layout = (targetNode.props?.direction as "row" | "col") || "row";

      if (!targetNode.isContainer) {
        return {
          id: targetId,
          position: getEdgePosition(targetElement, point, layout),
        };
      }

      const children = targetNode.children ?? [];
      if (children.length === 0) {
        return {
          id: targetId,
          position: "inside",
        };
      }

      let closest: { id: string; element: Element; distance: number } | null = null;
      for (const child of children) {
        const childElement = canvas.querySelector(`[data-node-id="${child.id}"]`);
        if (!childElement) continue;

        const rect = childElement.getBoundingClientRect();
        const isInsideChild =
          point.x >= rect.left &&
          point.x <= rect.right &&
          point.y >= rect.top &&
          point.y <= rect.bottom;

        if (isInsideChild) {
          return {
            id: child.id,
            position: getEdgePosition(childElement, point, layout),
          };
        }

        const distance = distancePointToRect(point.x, point.y, rect);
        if (!closest || distance < closest.distance) {
          closest = { id: child.id, element: childElement, distance };
        }
      }

      if (!closest) {
        return {
          id: targetId,
          position: "inside",
        };
      }

      return {
        id: closest.id,
        position: getEdgePosition(closest.element, point, layout),
      };
    },
    [findItem]
  );

  const handleNativeComponentDragOver = useCallback((event: DragEvent<HTMLDivElement>) => {
    if (event.dataTransfer.types.includes(nativeComponentDragMimeType)) {
      event.preventDefault();
      event.dataTransfer.dropEffect = "copy";
      const result = calculateNativeComponentDropResult(event);
      setDropInfo(result);
      setHoveredNodeId(result?.id ?? null);
    }
  }, [calculateNativeComponentDropResult]);

  const handleNativeComponentDragLeave = useCallback((event: DragEvent<HTMLDivElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
      setDropInfo(null);
    }
  }, []);

  const handleNativeComponentDrop = useCallback((event: DragEvent<HTMLDivElement>) => {
    const raw = event.dataTransfer.getData(nativeComponentDragMimeType);
    if (!raw) return;

    event.preventDefault();

    try {
      const payload = JSON.parse(raw) as { snippetId?: string };
      if (!payload.snippetId) return;

      insertSnippet(payload.snippetId, dropInfo ?? calculateNativeComponentDropResult(event) ?? undefined);
    } catch (error) {
      console.error("[WigglyCode] Invalid component drag payload:", error);
      toast.error("组件拖拽数据无效");
    }
  }, [calculateNativeComponentDropResult, dropInfo, insertSnippet]);

  // ============================================
  // 节点更新和删除
  // ============================================

  const updateNode = useCallback(
    (nodeId: string, updates: Partial<DesignerNode>) => {
      const updateNodeInTree = (tree: DesignerNode[]): DesignerNode[] => {
        return tree.map((item) => {
          if (item.id === nodeId) {
            const updated = { ...item, ...updates };
            if (selectedNode?.id === nodeId) {
              setSelectedNode(updated);
            }
            return updated;
          }
          if (item.isContainer && item.children) {
            return {
              ...item,
              children: updateNodeInTree(item.children),
            };
          }
          return item;
        });
      };

      setItems((prev) => updateNodeInTree(prev));
    },
    [selectedNode?.id, setItems]
  );

  // 调整大小功能
  // ============================================

   const handleSmartResize = useCallback((
    nodeId: string, 
    updates: {
      width?: string;
      height?: string;
      marginLeft?: string;
      marginRight?: string;
      marginTop?: string;
      marginBottom?: string;
      flexGrow?: number;
    }
  ) => {
    const node = findItem(nodeId);
    if (!node) return;

    const newStyle = { ...node.style };
    
    // 应用所有更新
    if (updates.width) newStyle.width = updates.width;
    if (updates.height) newStyle.height = updates.height;
    if (updates.marginLeft) newStyle.marginLeft = updates.marginLeft;
    if (updates.marginRight) newStyle.marginRight = updates.marginRight;
    if (updates.marginTop) newStyle.marginTop = updates.marginTop;
    if (updates.marginBottom) newStyle.marginBottom = updates.marginBottom;
    if (updates.flexGrow !== undefined) newStyle.flexGrow = updates.flexGrow;

    updateNode(nodeId, { style: newStyle });

    console.log('智能调整:', {
      nodeId,
      updates,
      newStyle
    });
  }, [findItem, updateNode]);

  // 防抖版本的调整大小(可选,用于优化性能)
  // const debouncedResize = useMemo(
  //   () =>
  //     debounce((nodeId: string, width: number, height: number) => {
  //       handleResize(nodeId, width, height);
  //     }, 100),
  //   [handleResize]
  // );

  // ============================================
  // 保存/导出/导入
  // ============================================

  const handleSave = useCallback(() => {
    const updatedSchema = {
      ...schema,
      meta: {
        ...schema.meta,
        updatedAt: new Date().toISOString(),
      },
    };

    localStorage.setItem("page-schema", JSON.stringify(updatedSchema));

    console.log("保存的 Schema:", updatedSchema);
    toast.success("保存成功");
  }, [schema]);

  const handlePublish = useCallback(() => {
    console.log("发布 Schema:", schema);
    toast.success("发布成功");
  }, [schema]);

  const handleShare = useCallback(() => {
    const json = JSON.stringify(schema, null, 2);

    if (navigator.clipboard) {
      navigator.clipboard.writeText(json).then(() => {
        toast.success("Schema 已复制到剪贴板");
      });
    } else {
      console.log("分享 Schema:", json);
      toast.success("Schema 已输出到控制台");
    }
  }, [schema]);

  const handleCopy = useCallback(() => {
    if (!selectedNode || selectedNode.id === "root") {
      toast.warning("请先选择要复制的组件");
      return;
    }
    clipboard.copy([selectedNode]);
    toast.success("已复制");
  }, [selectedNode, clipboard]);

  // 剪切
  const handleCut = useCallback(() => {
    if (!selectedNode || selectedNode.id === "root") {
      toast.warning("请先选择要剪切的组件");
      return;
    }
    clipboard.cut([selectedNode]);
    toast.success("已剪切");
  }, [selectedNode, clipboard]);

  // 粘贴
  const handlePaste = useCallback(() => {
    if (!clipboard.hasClipboard) {
      toast.warning("剪贴板为空");
      return;
    }

    const result = clipboard.paste();
    if (!result) return;

    const targetId = selectedNode?.id || "root";

    setItems((prevItems) => {
      let newItems = prevItems;

      // 如果是剪切,先删除原节点
      if (result.operation === "cut") {
        result.sourceIds.forEach((id) => {
          newItems = removeItem(id, newItems);
        });
      }

      // 插入新节点
      const targetNode = findItem(targetId, newItems);
      result.nodes.forEach((node) => {
        if (targetNode?.isContainer) {
          newItems = insertItem(node, targetId, "inside", newItems);
        } else {
          newItems = insertItem(node, targetId, "after", newItems);
        }
      });

      return newItems;
    });

    if (result.operation === "cut") {
      clipboard.clear();
    }

    toast.success(`已粘贴 ${result.nodes.length} 个组件`);
  }, [clipboard, selectedNode, findItem, setItems, removeItem, insertItem]);

  // ============================================
  // 快捷键支持
  // ============================================

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 检查是否在输入框中
      const target = e.target as HTMLElement;
      const isInput =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable;

      if (isInput) return;

      // Ctrl+Z / Cmd+Z - 撤销
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        if (history.canUndo) {
          history.undo();
          toast.success("撤销成功");
        }
      }

      // Ctrl+Shift+Z / Cmd+Shift+Z - 重做
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && e.shiftKey) {
        e.preventDefault();
        if (history.canRedo) {
          history.redo();
          toast.success("重做成功");
        }
      }

      // Ctrl+Y / Cmd+Y - 重做(备选)
      if ((e.ctrlKey || e.metaKey) && e.key === "y") {
        e.preventDefault();
        if (history.canRedo) {
          history.redo();
          toast.success("重做成功");
        }
      }

      // Delete - 删除选中元素
      if (e.key === "Delete" && selectedNode && selectedNode.id !== "root") {
        e.preventDefault();
        deleteNode(selectedNode.id);
      }

      // Escape - 取消选中
      if (e.key === "Escape") {
        e.preventDefault();
        setSelectedNode(null);
        setViewportTool("select");
        setSpacePanActive(false);
      }

      // Ctrl+C - 复制
      if ((e.ctrlKey || e.metaKey) && e.key === "c") {
        e.preventDefault();
        handleCopy();
      }

      // Ctrl+X - 剪切
      if ((e.ctrlKey || e.metaKey) && e.key === "x") {
        e.preventDefault();
        handleCut();
      }

      // Ctrl+V - 粘贴
      if ((e.ctrlKey || e.metaKey) && e.key === "v") {
        e.preventDefault();
        handlePaste();
      }

      // Space - 临时平移工具
      if (e.code === "Space" && viewMode === "design") {
        e.preventDefault();
        setSpacePanActive(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [deleteNode, handleCopy, handleCut, handlePaste, history, selectedNode, viewMode]);

  useEffect(() => {
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        setSpacePanActive(false);
      }
    };
    const handleWindowBlur = () => {
      setSpacePanActive(false);
      panSessionRef.current = null;
      setIsPanning(false);
    };

    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("blur", handleWindowBlur);

    return () => {
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("blur", handleWindowBlur);
    };
  }, []);

  const handleViewportMouseDown = useCallback((event: ReactMouseEvent<HTMLDivElement>) => {
    if (!isPanToolActive || event.button !== 0) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    panSessionRef.current = {
      lastClientX: event.clientX,
      lastClientY: event.clientY,
    };
    setIsPanning(true);
    setIsViewportPanning(true);
  }, [isPanToolActive]);

  useEffect(() => {
    if (!isPanning) return;

    const handleMouseMove = (event: globalThis.MouseEvent) => {
      const session = panSessionRef.current;
      if (!session) return;

      queueViewportPan(
        event.clientX - session.lastClientX,
        event.clientY - session.lastClientY
      );
      panSessionRef.current = {
        lastClientX: event.clientX,
        lastClientY: event.clientY,
      };
    };

    const handleMouseUp = () => {
      panSessionRef.current = null;
      setIsPanning(false);
      setIsViewportPanning(false);
      if (viewportPanIdleTimerRef.current !== null) {
        window.clearTimeout(viewportPanIdleTimerRef.current);
        viewportPanIdleTimerRef.current = null;
      }
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isPanning, queueViewportPan]);

  const handleViewportWheel = useCallback(
    (event: ReactWheelEvent<HTMLDivElement>) => {
      if (viewMode !== "design") return;

      const shouldZoom = event.metaKey || event.ctrlKey || event.altKey;

      event.preventDefault();
      event.stopPropagation();

      if (!shouldZoom) {
        queueViewportPan(-event.deltaX, -event.deltaY);
        return;
      }

      setIsWheelZooming(true);
      if (viewportZoomIdleTimerRef.current !== null) {
        window.clearTimeout(viewportZoomIdleTimerRef.current);
      }
      viewportZoomIdleTimerRef.current = window.setTimeout(() => {
        setIsWheelZooming(false);
        viewportZoomIdleTimerRef.current = null;
      }, 100);

      const direction = event.deltaY > 0 ? -1 : 1;
      const factor = direction > 0 ? 1.08 : 0.92;
      zoomViewportAtPoint(zoom * factor, {
        clientX: event.clientX,
        clientY: event.clientY,
      });
    },
    [queueViewportPan, viewMode, zoom, zoomViewportAtPoint]
  );

  useEffect(() => {
    return () => {
      if (viewportPanRafRef.current !== null) {
        cancelAnimationFrame(viewportPanRafRef.current);
      }
      if (viewportPanIdleTimerRef.current !== null) {
        window.clearTimeout(viewportPanIdleTimerRef.current);
      }
      if (viewportZoomIdleTimerRef.current !== null) {
        window.clearTimeout(viewportZoomIdleTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const handleMessage = (event: MessageEvent<{ command?: string; payload?: { snippetId?: string } }>) => {
      switch (event.data?.command) {
        case "designMode":
          setViewMode("design");
          break;
        case "previewMode":
          setViewMode("preview");
          break;
        case "codeMode":
          setViewMode("code");
          break;
        case "selectTool":
          setViewMode("design");
          setViewportTool("select");
          setSpacePanActive(false);
          setHoveredNodeId(null);
          break;
        case "panTool":
          setViewMode("design");
          setViewportTool((current) => current === "pan" ? "select" : "pan");
          setSpacePanActive(false);
          setHoveredNodeId(null);
          break;
        case "zoomOut":
          setViewMode("design");
          {
            const rect = canvasRef.current?.getBoundingClientRect();
            zoomViewportAtPoint(zoom - 10, {
              clientX: rect ? rect.left + rect.width / 2 : window.innerWidth / 2,
              clientY: rect ? rect.top + rect.height / 2 : window.innerHeight / 2,
            });
          }
          break;
        case "zoomIn":
          setViewMode("design");
          {
            const rect = canvasRef.current?.getBoundingClientRect();
            zoomViewportAtPoint(zoom + 10, {
              clientX: rect ? rect.left + rect.width / 2 : window.innerWidth / 2,
              clientY: rect ? rect.top + rect.height / 2 : window.innerHeight / 2,
            });
          }
          break;
        case "resetViewport":
          setViewMode("design");
          resetViewport();
          break;
        case "undo":
          if (history.canUndo) {
            history.undo();
            toast.success("撤销成功");
          }
          break;
        case "redo":
          if (history.canRedo) {
            history.redo();
            toast.success("重做成功");
          }
          break;
        case "save":
          handleSave();
          break;
        case "share":
          handleShare();
          break;
        case "publish":
          handlePublish();
          break;
        case "insertComponent":
          if (event.data.payload?.snippetId) {
            setViewMode("design");
            insertSnippet(event.data.payload.snippetId);
          }
          break;
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [handlePublish, handleSave, handleShare, history, insertSnippet, resetViewport, zoom, zoomViewportAtPoint]);

  // ============================================
  // 预览模式 UI
  // ============================================

  if (viewMode === "preview") {
    return (
      <div className="h-screen flex flex-col bg-background text-foreground overflow-hidden">
        <div className="flex-1 overflow-auto p-8 bg-muted/20">
          <div className="mx-auto bg-card rounded-lg shadow-xl p-8 min-h-full max-w-6xl">
            <SafeRenderer
              schema={items}
              preview={true}
              variables={variableValues}
              dataSources={dataSourceValues}
              onError={(error, node) => {
                console.error(`[Preview] Error in ${node.componentName}:`, error);
                toast.error(`预览错误: ${node.componentName}`);
              }}
            />
          </div>
        </div>
      </div>
    );
  }

  // ============================================
  // 代码模式 UI
  // ============================================

  if (viewMode === "code") {
    return (
      <div className="h-screen flex flex-col bg-background text-foreground overflow-hidden">
        <div className="flex-1 overflow-auto p-8 bg-muted/20">
          <pre className="bg-card text-sm font-mono p-6 rounded-lg border max-w-6xl mx-auto">
            <code>{JSON.stringify(schema, null, 2)}</code>
          </pre>
        </div>
      </div>
    );
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <ClearDropIndicatorOnDragEnd setDropInfo={setDropInfo} />
      <div className="h-screen flex flex-col bg-background text-foreground overflow-hidden">
        <div className="flex-1 flex overflow-hidden">
          {/* 中间:主工作区 */}
          <main className="flex-1 relative bg-background flex flex-col overflow-hidden">
            {/* 画布滚动区域 */}
            <div
              ref={canvasRef}
              onMouseDownCapture={handleViewportMouseDown}
              onWheel={handleViewportWheel}
              onDragOver={handleNativeComponentDragOver}
              onDragLeave={handleNativeComponentDragLeave}
              onDrop={handleNativeComponentDrop}
              className={cn(
                "flex-1 overflow-hidden custom-scrollbar relative select-none",
                isPanToolActive && !isPanning && "cursor-grab",
                isPanning && "cursor-grabbing"
              )}
              style={{
                backgroundImage:
                  "radial-gradient(#e5e7eb 1px, transparent 1px)",
                backgroundSize: "24px 24px",
              }}
            >
              {/* 模拟页面纸张感 */}
              <div
                className={cn(
                  "absolute bg-card shadow-2xl ring-1 ring-black/5",
                  !isViewportPanning && "transition-transform duration-150"
                )}
                style={{
                  width: `${designSurfaceWidth}px`,
                  minHeight: `${designSurfaceMinHeight}px`,
                  transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom / 100})`,
                  transformOrigin: "top left",
                }}
              >
                {items.map((item, index) => (
                  <NodeItem
                    key={item.id}
                    item={item}
                    depth={0}
                    index={index}
                    parentId={null}
                    selectedNodeId={hideSelectionAffordance ? null : selectedNode?.id || null}
                    onSelect={setSelectedNode}
                    onDrop={handleDrop}
                    findItem={findItem}
                    moveItem={moveItem}
                    bindingContext={bindingContext}
                  />
                ))}

                {/* 空白页提示 */}
                {items[0]?.children?.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-40 text-muted-foreground border-2 border-dashed m-4 rounded-lg">
                    <p>拖拽组件到此处开始构建</p>
                  </div>
                )}
              </div>

              {/* Overlay 高亮层 */}
              <div className="absolute inset-0 pointer-events-none">
                {!hideHoverAffordance && !isPanToolActive && hoveredNodeId && hoveredNodeId !== selectedNode?.id && (
                  <NodeSelector nodeId={hoveredNodeId} canvasRef={canvasRef} />
                )}
                {!hideSelectionAffordance && selectedNode && (
                  <NodeSelector
                    nodeId={selectedNode.id}
                    canvasRef={canvasRef}
                    zoom={zoom}
                    isSelected
                    onResize={handleSmartResize} 
                  />
                )}
                {dropContextContainerId && (
                  <PositionIndicator
                    variant="context"
                    canvasRef={canvasRef}
                    nodeId={dropContextContainerId}
                    position="inside"
                  />
                )}
                {dropInfo?.id && (
                  <PositionIndicator
                    canvasRef={canvasRef}
                    nodeId={dropInfo.id}
                    position={dropInfo.position}
                  />
                )}
                {dropHintLabel && (
                  <div
                    className="pointer-events-none absolute bottom-3 left-1/2 z-[1001] max-w-[min(28rem,90%)] -translate-x-1/2 rounded-md border border-border bg-popover/95 px-3 py-2 text-center text-xs text-popover-foreground shadow-md"
                  >
                    {dropHintLabel}
                  </div>
                )}
              </div>
            </div>
          </main>

          <PropertyPanel
            asset={selectedAsset}
            selectedNode={selectedNode}
            onUpdate={updateNode}
            variables={schema.variables}
            dataSources={schema.dataSources}
          />
        </div>
      </div>
    </DndProvider>
  );
}
