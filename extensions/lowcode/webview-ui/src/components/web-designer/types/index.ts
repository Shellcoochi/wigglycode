import React from "react";

// ============================================
// 页面 Schema 相关类型
// ============================================

/** 页面元数据 */
export interface PageMeta {
  id: string;
  name: string;
  description?: string;
  version: string;
  createdAt?: string;
  updatedAt?: string;
}

/** 变量定义 */
export interface Variable {
  id: string;
  name: string;
  type: "string" | "number" | "boolean" | "object" | "array";
  defaultValue: any;
  description?: string;
}

/** 数据源定义 */
export interface DataSource {
  id: string;
  name: string;
  type: "api" | "static" | "computed";
  config: {
    url?: string;
    method?: "GET" | "POST" | "PUT" | "DELETE";
    headers?: Record<string, string>;
    params?: Record<string, any>;
    data?: any;
  };
}

/** 绑定类型定义 */
export type BindingType = "static" | "variable" | "expression" | "datasource";

export interface Binding {
  type: BindingType;
  // 变量绑定：user.name
  variablePath?: string;
  // 表达式绑定：{{user.name + ' ' + user.age}}
  expression?: string;
  // 数据源绑定：datasourceId.data.items[0]
  datasourceId?: string;
  dataPath?: string;
  // 静态值
  value?: any;
}

/** 设计节点 */
export interface DesignerNode {
  id: string;
  title?: string;
  componentName: string;
  isContainer?: boolean;
  props?: Record<string, any>;
  style?: React.CSSProperties;
  children?: DesignerNode[];
  // 属性绑定配置（新增）
  bindings?: Record<string, Binding>;
}

/** 全局样式 */
export interface GlobalStyle {
  id: string;
  name: string;
  css: string;
}

/** 完整的页面 Schema */
export interface PageSchema {
  meta: PageMeta;
  variables: Variable[];
  dataSources: DataSource[];
  components: DesignerNode[];
  styles?: GlobalStyle[];
}

/** 项目 Schema (多页面支持) */
export interface ProjectSchema {
  id: string;
  name: string;
  version: string;
  pages: PageSchema[];
  globalVariables?: Variable[];
  globalStyles?: GlobalStyle[];
}

// ============================================
// 拖拽相关类型
// ============================================

export type Positon = "left" | "right" | "top" | "bottom" | "inside";
export type NodePositon = "before" | "after" | "inside";

export interface DropResult {
  id: string;
  position: Positon;
}

export interface DragItem {
  id: string;
  type: string;
  depth?: number;
  parentId?: string | null;
  isContainer?: boolean;
  source?: "panel" | "tree";
  nodeData?: DesignerNode;
}

// ============================================
// 组件模板相关类型
// ============================================

export interface ComponentTemplate {
  id: string;
  title: string;
  schema: {
    componentName: string;
    props?: Record<string, any>;
    style?: React.CSSProperties;
  };
}

export interface ComponentSnippet {
  id: string;
  snippets: ComponentTemplate[];
}

export interface ComponentCategory {
  type: string;
  title: string;
  children: Array<{
    type: string;
    title: string;
    asset: {
      title: string;
      componentName: string;
    };
    snippet: ComponentSnippet;
  }>;
}

// ============================================
// 属性配置相关类型
// ============================================

export interface PropConfig {
  name: string;
  title: string;
  type: "string" | "number" | "boolean" | "select" | "color" | "slider" | "json";
  defaultValue?: any;
  options?: Array<{ label: string; value: any }>;
  min?: number;
  max?: number;
  step?: number;
  description?: string;
}

export interface Asset {
  componentName: string;
  title: string;
  library: React.ComponentType<any>;
  configure?: {
    component?: {
      isContainer?: boolean;
    };
    props?: PropConfig[];
  };
}

// ============================================
// 绑定上下文类型
// ============================================

export interface BindingContext {
  variables: Record<string, any>;
  dataSources: Record<string, any>;
}

// ============================================
// 历史记录类型
// ============================================

export interface HistoryState<T> {
  past: T[];
  present: T;
  future: T[];
}

export interface HistoryActions<T> {
  set: (newState: T) => void;
  undo: () => void;
  redo: () => void;
  reset: (newState: T) => void;
  canUndo: boolean;
  canRedo: boolean;
}

// ============================================
// 工具函数类型
// ============================================

export type FindNodeFn = (id: string, tree?: DesignerNode[]) => DesignerNode | undefined;
export type RemoveItemFn = (id: string, tree: DesignerNode[]) => DesignerNode[];
export type InsertItemFn = (
  item: DesignerNode,
  targetId: string,
  position: NodePositon,
  tree: DesignerNode[]
) => DesignerNode[];

// ============================================
// 事件处理类型
// ============================================

export interface NodeEventHandlers {
  onSelect: (node: DesignerNode) => void;
  onUpdate: (nodeId: string, updates: Partial<DesignerNode>) => void;
  onDelete: (nodeId: string) => void;
  onMove: (dragId: string, targetId: string, position: NodePositon) => void;
  onDrop: (dragId: string, result: DropResult, source: "panel" | "tree") => void;
}

// ============================================
// 面板配置类型
// ============================================

export type SidebarPanel = "components" | "variables" | "datasources" | "outline";

export interface SidebarPanelConfig {
  id: SidebarPanel;
  label: string;
  icon: React.ReactNode;
  component: React.ComponentType<any>;
}

// ============================================
// 视图模式类型
// ============================================

export type ViewMode = "design" | "preview" | "code";