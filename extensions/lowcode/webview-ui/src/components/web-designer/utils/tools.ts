import { customAlphabet } from "nanoid";
import { DesignerNode } from "../types";
import materials from "../material";

export const generateId = customAlphabet(
  "abcdefghijklmnopqrstuvwxyz0123456789",
  12
);

export const generateNodeId = () => `node_${generateId()}`;

export const findNode = (
  id: string,
  nodes: DesignerNode[]
): DesignerNode | undefined => {
  for (const node of nodes) {
    if (node.id === id) return node;
    if (node.children) {
      const found = findNode(id, node.children);
      if (found) return found;
    }
  }
};

/** 在树中查找某节点的父节点 id；根级节点返回 null */
export const findParentNodeId = (
  nodes: DesignerNode[],
  targetId: string,
  parentId: string | null = null
): string | null => {
  for (const node of nodes) {
    if (node.id === targetId) return parentId;
    if (node.children?.length) {
      const found = findParentNodeId(node.children, targetId, node.id);
      if (found !== null) return found;
    }
  }
  return null;
};

export const findAsset = (componentName: string) => {
  const { assets } = materials;
  return assets.find((asset: any) => asset.componentName === componentName);
};
