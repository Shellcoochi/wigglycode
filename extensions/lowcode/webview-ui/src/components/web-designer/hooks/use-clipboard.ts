import { useState, useCallback } from "react";
import { DesignerNode } from "../types";
import { generateNodeId } from "../utils/tools";

interface ClipboardData {
  nodes: DesignerNode[];
  operation: "copy" | "cut";
  sourceIds: string[];
}

export function useClipboard() {
  const [clipboard, setClipboard] = useState<ClipboardData | null>(null);

  // 复制节点
  const copy = useCallback((nodes: DesignerNode[]) => {
    setClipboard({
      nodes: deepCloneNodes(nodes),
      operation: "copy",
      sourceIds: nodes.map(n => n.id),
    });
  }, []);

  // 剪切节点
  const cut = useCallback((nodes: DesignerNode[]) => {
    setClipboard({
      nodes: deepCloneNodes(nodes),
      operation: "cut",
      sourceIds: nodes.map(n => n.id),
    });
  }, []);

  // 粘贴节点
  const paste = useCallback(() => {
    if (!clipboard) return null;

    // 生成新的节点(重新生成ID)
    const newNodes = clipboard.nodes.map(node => regenerateNodeIds(node));

    return {
      nodes: newNodes,
      operation: clipboard.operation,
      sourceIds: clipboard.sourceIds,
    };
  }, [clipboard]);

  // 清空剪贴板
  const clear = useCallback(() => {
    setClipboard(null);
  }, []);

  const hasClipboard = clipboard !== null;
  const isCut = clipboard?.operation === "cut";

  return {
    copy,
    cut,
    paste,
    clear,
    hasClipboard,
    isCut,
    clipboard,
  };
}

// ============================================
// 辅助函数
// ============================================

// 深度克隆节点(保留ID)
function deepCloneNodes(nodes: DesignerNode[]): DesignerNode[] {
  return nodes.map(node => ({
    ...node,
    props: { ...node.props },
    style: { ...node.style },
    children: node.children ? deepCloneNodes(node.children) : undefined,
  }));
}

// 重新生成节点ID(用于粘贴时避免重复)
function regenerateNodeIds(node: DesignerNode): DesignerNode {
  const newNode: DesignerNode = {
    ...node,
    id: generateNodeId(),
    props: { ...node.props },
    style: { ...node.style },
  };

  if (node.children) {
    newNode.children = node.children.map(child => regenerateNodeIds(child));
  }

  return newNode;
}