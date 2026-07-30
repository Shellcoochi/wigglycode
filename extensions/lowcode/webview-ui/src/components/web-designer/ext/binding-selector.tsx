// binding-selector.tsx - 重新设计的解决方案

"use client";

import React, { useState, useEffect } from "react";
import { Binding, BindingType, Variable, DataSource } from "../types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface BindingSelectorProps {
  value: any;
  binding?: Binding;
  onChange: (value: any, binding?: Binding) => void;
  variables?: Variable[];
  dataSources?: DataSource[];
  setterComponent: React.ComponentType<any>;
  setterProps?: any;
}

export const BindingSelector: React.FC<BindingSelectorProps> = ({
  value,
  binding,
  onChange,
  variables = [],
  dataSources = [],
  setterComponent: SetterComponent,
  setterProps = {},
}) => {
  const [mode, setMode] = useState<BindingType>("static");
  const [localBinding, setLocalBinding] = useState<Binding>({ type: "static", value });
  
  // 关键：静态值的来源
  // 1. 如果 binding 存在且有 value，使用 binding.value（这是保存的原始静态值）
  // 2. 否则使用 props 传入的 value
  const [staticValue, setStaticValue] = useState(() => {
    if (binding?.value !== undefined) {
      return binding.value;
    }
    return value;
  });

  // 当外部 props 变化时同步状态
  useEffect(() => {
    if (binding) {
      setMode(binding.type);
      setLocalBinding(binding);
      
      // 关键逻辑：
      // binding.value 是切换到绑定模式前保存的静态值
      // 这个值在组件切换时应该保持不变
      if (binding.value !== undefined) {
        setStaticValue(binding.value);
      }
    } else {
      // 没有 binding，说明是纯静态模式
      setMode("static");
      setLocalBinding({ type: "static", value });
      setStaticValue(value);
    }
  }, [binding, value]);

  // 切换绑定模式
  const handleModeChange = (newMode: BindingType) => {
    setMode(newMode);
    
    if (newMode === "static") {
      // 切换回静态：使用保存的静态值
      const newBinding: Binding = { 
        type: "static", 
        value: staticValue 
      };
      setLocalBinding(newBinding);
      onChange(staticValue, newBinding);
    } else {
      // 切换到绑定模式：创建绑定，并保存当前静态值
      const newBinding: Binding = { 
        type: newMode,
        value: staticValue // 保存静态值
      };
      setLocalBinding(newBinding);
      onChange(staticValue, newBinding);
    }
  };

  // 更新绑定配置
  const updateBinding = (updates: Partial<Binding>) => {
    const newBinding = { ...localBinding, ...updates };
    
    // 如果更新的是 value（静态值更新），同步 staticValue
    if (updates.value !== undefined) {
      setStaticValue(updates.value);
    }
    
    setLocalBinding(newBinding);
    onChange(newBinding.value, newBinding);
  };

  const hasBinding = mode !== "static";

  return (
    <div className="space-y-2">
      {/* 绑定模式切换 */}
      <div className="flex gap-1 bg-muted p-1 rounded-md">
        <Button
          variant={mode === "static" ? "default" : "ghost"}
          size="sm"
          className="flex-1 h-7 text-xs"
          onClick={() => handleModeChange("static")}
        >
          静态值
        </Button>
        <Button
          variant={mode === "variable" ? "default" : "ghost"}
          size="sm"
          className="flex-1 h-7 text-xs"
          onClick={() => handleModeChange("variable")}
        >
          变量
        </Button>
        <Button
          variant={mode === "expression" ? "default" : "ghost"}
          size="sm"
          className="flex-1 h-7 text-xs"
          onClick={() => handleModeChange("expression")}
        >
          表达式
        </Button>
        <Button
          variant={mode === "datasource" ? "default" : "ghost"}
          size="sm"
          className="flex-1 h-7 text-xs"
          onClick={() => handleModeChange("datasource")}
        >
          数据源
        </Button>
      </div>

      {/* 绑定配置区域 */}
      <div
        className={cn(
          "border border-border rounded-md p-3",
          hasBinding && "bg-primary/5 border-primary/30"
        )}
      >
        {mode === "static" && (
          <SetterComponent
            value={staticValue}
            onChange={(newValue: any) => {
              setStaticValue(newValue);
              updateBinding({ value: newValue });
            }}
            {...setterProps}
          />
        )}

        {mode === "variable" && (
          <div className="space-y-2">
            <Label className="text-xs">选择变量</Label>
            {variables.length > 0 ? (
              <Select
                value={localBinding.variablePath || ""}
                onValueChange={(path) => {
                  updateBinding({
                    variablePath: path,
                    // 保持 value 不变（这是静态值）
                  });
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择变量" />
                </SelectTrigger>
                <SelectContent>
                  {variables.map((variable) => (
                    <SelectItem key={variable.id} value={variable.name}>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono bg-muted px-1 rounded">
                          {variable.type}
                        </span>
                        <span>{variable.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div className="text-xs text-muted-foreground p-2 bg-muted rounded">
                暂无可用变量，请先在变量面板中创建
              </div>
            )}

            {localBinding.variablePath && (
              <div className="text-xs text-muted-foreground flex items-center gap-1">
                <span className="font-mono bg-muted px-2 py-1 rounded">
                  {`{{${localBinding.variablePath}}}`}
                </span>
              </div>
            )}
          </div>
        )}

        {mode === "expression" && (
          <div className="space-y-2">
            <Label className="text-xs">表达式</Label>
            <Input
              value={localBinding.expression || ""}
              onChange={(e) => {
                updateBinding({ expression: e.target.value });
              }}
              placeholder="例如: {{user.name + ' (' + user.age + ')'}}"
              className="font-mono text-xs"
            />
            <div className="text-xs text-muted-foreground">
              支持 JavaScript 表达式，使用 {`{{...}}`} 包裹
            </div>
          </div>
        )}

        {mode === "datasource" && (
          <div className="space-y-3">
            <div className="space-y-2">
              <Label className="text-xs">选择数据源</Label>
              {dataSources.length > 0 ? (
                <Select
                  value={localBinding.datasourceId || ""}
                  onValueChange={(id) => {
                    updateBinding({ datasourceId: id });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择数据源" />
                  </SelectTrigger>
                  <SelectContent>
                    {dataSources.map((ds) => (
                      <SelectItem key={ds.id} value={ds.id}>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono bg-muted px-1 rounded">
                            {ds.type}
                          </span>
                          <span>{ds.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="text-xs text-muted-foreground p-2 bg-muted rounded">
                  暂无数据源，请先在数据源面板中创建
                </div>
              )}
            </div>

            {localBinding.datasourceId && (
              <div className="space-y-2">
                <Label className="text-xs">数据路径</Label>
                <Input
                  value={localBinding.dataPath || ""}
                  onChange={(e) => {
                    updateBinding({ dataPath: e.target.value });
                  }}
                  placeholder="例如: data.items[0].title"
                  className="font-mono text-xs"
                />
                <div className="text-xs text-muted-foreground">
                  使用点号访问对象属性，方括号访问数组元素
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 绑定预览 */}
      {hasBinding && (
        <div className="text-xs bg-muted p-2 rounded-md font-mono">
          <span className="text-muted-foreground">绑定: </span>
          <span className="text-primary">
            {mode === "variable" && `{{${localBinding.variablePath}}}`}
            {mode === "expression" && localBinding.expression}
            {mode === "datasource" &&
              `{{${localBinding.datasourceId}.${localBinding.dataPath}}}`}
          </span>
        </div>
      )}
    </div>
  );
};