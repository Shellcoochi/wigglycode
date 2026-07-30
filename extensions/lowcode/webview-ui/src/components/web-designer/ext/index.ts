import { Binding } from "../types";

// 解析绑定值
export const resolveBinding = (
  binding: Binding | undefined,
  context: {
    variables: Record<string, any>;
    dataSources: Record<string, any>;
  }
): any => {
  if (!binding || binding.type === "static") {
    return binding?.value;
  }

  try {
    switch (binding.type) {
      case "variable":
        // 解析变量路径: user.name -> context.variables.user.name
        return getValueByPath(context.variables, binding.variablePath || "");

      case "expression":
        // 解析表达式: {{user.name + ' ' + user.age}}
        return evaluateExpression(binding.expression || "", context);

      case "datasource":
        // 解析数据源: datasourceId.data.items[0]
        const dsData = context.dataSources[binding.datasourceId || ""];
        return getValueByPath(dsData, binding.dataPath || "");

      default:
        return binding.value;
    }
  } catch (error) {
    console.error("绑定解析失败:", error);
    return binding.value;
  }
};

// 根据路径获取值
const getValueByPath = (obj: any, path: string): any => {
  if (!path) return obj;
  
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

const PATH_SEGMENT = /^[a-zA-Z_$][\w$]*(\[\d+\])?$/;

function isSafeVariablePath(code: string): boolean {
  if (!code) return false;
  const segments = code.split(".");
  return segments.length > 0 && segments.every((s) => PATH_SEGMENT.test(s));
}

const evaluateExpression = (
  expression: string,
  context: { variables: Record<string, any>; dataSources: Record<string, any> }
): any => {
  const code = expression.replace(/^\{\{|\}\}$/g, "").trim();
  if (!isSafeVariablePath(code)) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[ext] 表达式绑定仅支持简单路径。", expression);
    }
    return undefined;
  }
  return getValueByPath(context.variables, code);
};