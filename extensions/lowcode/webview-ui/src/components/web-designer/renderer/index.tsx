"use client";

import React, { useMemo } from "react";
import { DesignerNode, Binding } from "../types";
import { findAsset } from "../utils/tools";

// ============================================
// 1. 绑定解析工具函数
// ============================================

// 根据路径获取值
const getValueByPath = (obj: any, path: string): any => {
  if (!path || !obj) return undefined;
  
  const keys = path.split(".");
  let result = obj;
  
  for (const key of keys) {
    // 处理数组索引: items[0]
    const arrayMatch = key.match(/^(\w+)\[(\d+)\]$/);
    if (arrayMatch) {
      const [, prop, index] = arrayMatch;
      result = result?.[prop]?.[parseInt(index)];
    } else {
      result = result?.[key];
    }
    
    if (result === undefined) break;
  }
  
  return result;
};

/** 仅允许类似 user.name、items[0].title 的路径片段，禁止任意 JS。 */
const PATH_SEGMENT = /^[a-zA-Z_$][\w$]*(\[\d+\])?$/;

function isSafeVariablePath(code: string): boolean {
  if (!code) return false;
  const segments = code.split(".");
  return segments.length > 0 && segments.every((s) => PATH_SEGMENT.test(s));
}

// 表达式绑定：仅支持单一路径求值（与变量绑定等价子集），不再使用 new Function。
const evaluateExpression = (
  expression: string,
  context: { variables: Record<string, any>; dataSources: Record<string, any> }
): any => {
  const code = expression.replace(/^\{\{|\}\}$/g, "").trim();
  if (!isSafeVariablePath(code)) {
    if (process.env.NODE_ENV === "development") {
      console.warn(
        "[Renderer] 表达式绑定仅支持简单路径（如 user.age、list[0].x），已禁止任意代码。",
        expression,
      );
    }
    return undefined;
  }
  return getValueByPath(context.variables, code);
};

// 解析单个绑定
export const resolveBinding = (
  binding: Binding | undefined,
  staticValue: any,
  context: {
    variables: Record<string, any>;
    dataSources: Record<string, any>;
  }
): any => {
  // 没有绑定或静态值，直接返回原值
  if (!binding || binding.type === "static") {
    return staticValue;
  }

  try {
    switch (binding.type) {
      case "variable":
        // 解析变量路径: user.name
        if (!binding.variablePath) return staticValue;
        const variableValue = getValueByPath(context.variables, binding.variablePath);
        return variableValue !== undefined ? variableValue : staticValue;

      case "expression":
        // 仅支持安全路径子集（见 evaluateExpression）
        if (!binding.expression) return staticValue;
        const expressionValue = evaluateExpression(binding.expression, context);
        return expressionValue !== undefined ? expressionValue : staticValue;

      case "datasource":
        // 解析数据源: datasourceId.data.items[0]
        if (!binding.datasourceId) return staticValue;
        const dsData = context.dataSources[binding.datasourceId];
        if (!dsData) return staticValue;
        
        const dataValue = binding.dataPath 
          ? getValueByPath(dsData, binding.dataPath)
          : dsData;
        return dataValue !== undefined ? dataValue : staticValue;

      default:
        return staticValue;
    }
  } catch (error) {
    console.error("绑定解析失败:", error, binding);
    return staticValue;
  }
};

// 解析节点的所有属性绑定
export const resolveNodeBindings = (
  node: DesignerNode,
  context: {
    variables: Record<string, any>;
    dataSources: Record<string, any>;
  }
): Record<string, any> => {
  const resolvedProps: Record<string, any> = { ...node.props };
  
  // 如果没有绑定配置，直接返回原 props
  if (!node.bindings) {
    return resolvedProps;
  }

  // 遍历所有绑定，解析每个属性
  for (const [key, binding] of Object.entries(node.bindings)) {
    const staticValue = node.props?.[key];
    const resolvedValue = resolveBinding(binding, staticValue, context);
    
    // 只有当解析成功时才更新值
    if (resolvedValue !== undefined) {
      resolvedProps[key] = resolvedValue;
    }
  }

  return resolvedProps;
};

// ============================================
// 2. Renderer 组件（支持绑定）
// ============================================

interface RendererProps {
  /**
   * 设计器产出的 Schema
   */
  schema: DesignerNode | DesignerNode[];
  /**
   * 是否为预览模式（禁用交互）
   */
  preview?: boolean;
  /**
   * 自定义组件映射（可选）
   */
  components?: Record<string, React.ComponentType<any>>;
  /**
   * 渲染错误时的回调
   */
  onError?: (error: Error, node: DesignerNode) => void;
  /**
   * 运行时变量（新增）
   */
  variables?: Record<string, any>;
  /**
   * 运行时数据源（新增）
   */
  dataSources?: Record<string, any>;
}

export const Renderer: React.FC<RendererProps> = ({
  schema,
  preview = false,
  components,
  onError,
  variables = {},
  dataSources = {},
}) => {
  // 创建绑定上下文
  const bindingContext = useMemo(() => ({
    variables,
    dataSources,
  }), [variables, dataSources]);

  // 如果是数组，渲染所有节点
  if (Array.isArray(schema)) {
    return (
      <>
        {schema.map((node) => (
          <NodeRenderer
            key={node.id}
            node={node}
            preview={preview}
            components={components}
            onError={onError}
            bindingContext={bindingContext}
          />
        ))}
      </>
    );
  }

  // 单个节点
  return (
    <NodeRenderer
      node={schema}
      preview={preview}
      components={components}
      onError={onError}
      bindingContext={bindingContext}
    />
  );
};

// ============================================
// 3. NodeRenderer（支持绑定解析）
// ============================================

interface NodeRendererProps {
  node: DesignerNode;
  preview?: boolean;
  components?: Record<string, React.ComponentType<any>>;
  onError?: (error: Error, node: DesignerNode) => void;
  bindingContext: {
    variables: Record<string, any>;
    dataSources: Record<string, any>;
  };
}

const NodeRenderer: React.FC<NodeRendererProps> = ({
  node,
  preview = false,
  components,
  onError,
  bindingContext,
}) => {
  const { id, componentName, style, children, isContainer } = node;

  // 获取组件
  const Component = useMemo(() => {
    // 优先使用自定义组件映射
    if (components && components[componentName]) {
      return components[componentName];
    }

    // 从物料库中查找
    const asset = findAsset(componentName);
    if (asset && asset.library) {
      return asset.library;
    }

    // 未找到组件
    console.error(`Component not found: ${componentName}`);
    return null;
  }, [componentName, components]);

  // 解析属性绑定
  const resolvedProps = useMemo(() => {
    return resolveNodeBindings(node, bindingContext);
  }, [node, bindingContext]);

  // 组件未找到时的错误处理
  if (!Component) {
    const error = new Error(`Component "${componentName}" not found`);
    onError?.(error, node);
    
    return (
      <div
        className="border-2 border-destructive bg-destructive/10 p-4 rounded text-destructive text-sm"
        data-renderer-id={id}
      >
        <strong>组件渲染错误:</strong> {componentName} 未找到
      </div>
    );
  }

  // 错误边界处理
  try {
    // 合并 props 和 style（使用解析后的 props）
    const finalProps: any = {
      ...resolvedProps,
      style: { ...resolvedProps?.style, ...style },
      "data-renderer-id": id, // 添加标识符，方便调试
    };

    // 如果是预览模式，禁用编辑相关的交互
    if (preview) {
      // 禁用内容编辑
      finalProps.contentEditable = false;
      finalProps.suppressContentEditableWarning = true;

      // 禁用拖拽等交互
      finalProps.onDragStart = (e: React.DragEvent) => e.preventDefault();
      finalProps.onDoubleClick = (e: React.MouseEvent) => e.preventDefault();
      finalProps.onContextMenu = (e: React.MouseEvent) => e.preventDefault();

      // 移除表单相关的编辑事件（但保留导航事件）
      const isFormComponent = componentName.toLowerCase().includes("input") ||
                             componentName.toLowerCase().includes("textarea") ||
                             componentName.toLowerCase().includes("select");
      
      if (!isFormComponent && resolvedProps?.onClick) {
        // 对于非表单组件的点击事件，仅保留导航能力
        finalProps.onClick = (e: React.MouseEvent) => {
          const href = resolvedProps?.href;
          if (href) {
            e.preventDefault();
            if (href.startsWith("http")) {
              window.open(href, "_blank");
            } else {
              window.location.href = href;
            }
          }
          // 其他点击事件不执行
        };
      } else if (isFormComponent) {
        // 禁用表单提交
        finalProps.onSubmit = (e: React.FormEvent) => e.preventDefault();
      }
    }

    // 调试：在开发环境显示绑定信息
    if (process.env.NODE_ENV === "development" && node.bindings) {
      console.log(`[Renderer] ${componentName} (${id}):`, {
        bindings: node.bindings,
        resolvedProps,
      });
    }

    // 渲染组件
    // 对于自闭合元素（如 img），不能传入 children
    const isVoidElement = ["img", "image", "input", "br", "hr"].includes(
      componentName.toLowerCase()
    );

    const componentProps = isVoidElement
      ? { ...finalProps }
      : finalProps;

    // 移除 void 元素不需要的属性
    if (isVoidElement && componentProps.children) {
      delete componentProps.children;
    }

    return (
      <Component {...componentProps}>
        {/* 渲染子节点：仅当是容器时才渲染 */}
        {!isVoidElement && isContainer && children && children.length > 0 && (
          <>
            {children.map((child) => (
              <NodeRenderer
                key={child.id}
                node={child}
                preview={preview}
                components={components}
                onError={onError}
                bindingContext={bindingContext}
              />
            ))}
          </>
        )}

        {/* 渲染 props.children：仅对非容器、非 void 元素 */}
        {!isVoidElement && !isContainer && componentProps.children}
      </Component>
    );
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    onError?.(err, node);
    
    return (
      <div
        className="border-2 border-destructive bg-destructive/10 p-4 rounded text-destructive text-sm"
        data-renderer-id={id}
      >
        <strong>渲染错误:</strong> {err.message}
      </div>
    );
  }
};

// ============================================
// 4. 错误边界（保持不变）
// ============================================

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

class RenderErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Renderer Error:", error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="border-2 border-destructive bg-destructive/10 p-4 rounded text-destructive">
          <h3 className="font-bold mb-2">渲染出错</h3>
          <p className="text-sm">{this.state.error?.message}</p>
          <details className="mt-2 text-xs">
            <summary className="cursor-pointer hover:text-destructive/80">详细信息</summary>
            <pre className="mt-2 overflow-auto p-2 bg-muted rounded text-muted-foreground">
              {this.state.errorInfo?.componentStack}
            </pre>
          </details>
        </div>
      );
    }

    return this.props.children;
  }
}

export const SafeRenderer: React.FC<
  RendererProps & { fallback?: React.ReactNode }
> = ({ fallback, ...props }) => {
  return (
    <RenderErrorBoundary fallback={fallback}>
      <Renderer {...props} />
    </RenderErrorBoundary>
  );
};

// ============================================
// 5. 使用示例
// ============================================

/*
// 基础使用（无绑定）
<Renderer schema={schema} />

// 带变量绑定
<Renderer 
  schema={schema} 
  variables={{
    user: { name: "张三", age: 25 },
    title: "欢迎页面"
  }}
/>

// 带数据源绑定
<Renderer 
  schema={schema}
  variables={{
    user: { name: "张三" }
  }}
  dataSources={{
    userList: {
      data: {
        items: [
          { id: 1, name: "用户1" },
          { id: 2, name: "用户2" }
        ]
      }
    }
  }}
/>

// 完整示例：带状态管理
function App() {
  const [variables, setVariables] = useState({
    count: 0,
    user: { name: "张三" }
  });

  const [dataSources, setDataSources] = useState({
    api: { loading: false, data: null }
  });

  // 加载数据
  useEffect(() => {
    fetchData().then(data => {
      setDataSources(prev => ({
        ...prev,
        api: { loading: false, data }
      }));
    });
  }, []);

  return (
    <SafeRenderer
      schema={schema}
      variables={variables}
      dataSources={dataSources}
    />
  );
}

// Schema 示例（带绑定）
const schema = {
  id: "text1",
  componentName: "Text",
  props: {
    children: "默认文本"  // 静态值
  },
  bindings: {
    children: {
      type: "variable",
      variablePath: "user.name",  // 绑定到 user.name
      value: "默认文本"
    }
  }
};
*/