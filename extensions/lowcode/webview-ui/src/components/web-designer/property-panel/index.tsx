"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Binding, DataSource, DesignerNode, Variable } from "../types";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";

import { SETTER_MAP, SetterConfig } from "../setter";
import { BindingSelector } from "../ext/binding-selector";

interface PropertyPanelProps {
  asset: any;
  selectedNode: DesignerNode | null;
  onUpdate: (nodeId: string, updates: Partial<DesignerNode>) => void;
  variables?: Variable[];
  dataSources?: DataSource[];
}

// 表单字段组件
const FormField: React.FC<{
  label: string;
  children: React.ReactNode;
}> = ({ label, children }) => (
  <div className="space-y-1.5">
    <Label className="text-xs text-muted-foreground">{label}</Label>
    {children}
  </div>
);

// 解析 setter 配置
const parseSetterConfig = (setter: string | SetterConfig): SetterConfig => {
  if (typeof setter === "string") {
    return { name: setter, props: {} };
  }
  return { name: setter.name || "StringSetter", props: setter.props || {} };
};

// 属性编辑器工厂
const PropertyEditor: React.FC<{
  attr: any;
  value: any;
  binding?: Binding;
  onChange: (value: any, binding?: Binding) => void;
  variables?: Variable[];
  dataSources?: DataSource[];
}> = ({ attr, value, binding, onChange, variables, dataSources }) => {
  const { name, title, setter = "StringSetter" } = attr;

  // 解析 setter 配置
  const setterConfig = useMemo(() => parseSetterConfig(setter), [setter]);
  const { name: setterName, props: setterProps } = setterConfig;

  // 获取对应的 Setter 组件
  const SetterComponent = SETTER_MAP[setterName as keyof typeof SETTER_MAP];

  if (!SetterComponent) {
    return <div className="text-xs text-destructive">未知 Setter</div>;
  }

  return (
    <BindingSelector
      value={value}
      binding={binding}
      onChange={onChange}
      variables={variables}
      dataSources={dataSources}
      setterComponent={SetterComponent}
      setterProps={{
        placeholder: `请输入${title || name}`,
        ...setterProps,
      }}
    />
  );
};

const PropertyPanel: React.FC<PropertyPanelProps> = ({
  asset,
  selectedNode,
  onUpdate,
  variables = [],
  dataSources = [],
}) => {
  const [localProps, setLocalProps] = useState<Record<string, any>>({});
  const [localStyle, setLocalStyle] = useState<React.CSSProperties>({});
  const [localBindings, setLocalBindings] = useState<Record<string, Binding>>(
    {},
  );

  useEffect(() => {
    if (selectedNode) {
      setLocalProps(selectedNode.props || {});
      setLocalStyle(selectedNode.style || {});
      setLocalBindings(selectedNode.bindings || {});
    } else {
      setLocalProps({});
      setLocalStyle({});
      setLocalBindings({});
    }
  }, [selectedNode?.id, selectedNode?.props, selectedNode?.style, selectedNode?.bindings]);

  const configProps = useMemo(() => asset?.configure?.props || [], [asset]);

  const handlePropChange = useCallback(
    (key: string, value: any, binding?: Binding) => {
      if (!selectedNode) return;

      const newProps = { ...localProps, [key]: value };
      setLocalProps(newProps);

      let newBindings = { ...localBindings };
      if (binding && binding.type !== "static") {
        const existingBinding = localBindings[key];
        newBindings[key] = {
          ...binding,
          value: existingBinding?.value ?? localProps[key] ?? value,
        };
      } else {
        delete newBindings[key];
      }
      setLocalBindings(newBindings);

      onUpdate(selectedNode.id, {
        props: newProps,
        bindings: newBindings,
      });
    },
    [selectedNode, localProps, localBindings, onUpdate],
  );

  const handleStyleChange = useCallback(
    (key: string, value: any) => {
      if (!selectedNode) return;
      const newStyle = { ...localStyle, [key]: value };
      setLocalStyle(newStyle);
      onUpdate(selectedNode.id, { style: newStyle });
    },
    [selectedNode, localStyle, onUpdate],
  );

  if (!selectedNode) {
    return (
      <aside className="w-80 shrink-0 bg-card border-l border-border p-5 flex items-center justify-center text-muted-foreground">
        <div className="text-center">
          <svg
            className="mx-auto h-12 w-12 text-muted-foreground/50 mb-3"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <p className="text-sm">请选择一个组件</p>
          <p className="text-xs mt-1 text-muted-foreground/80">点击画布中的组件进行编辑</p>
        </div>
      </aside>
    );
  }

  return (
    <aside className="w-80 shrink-0 bg-card border-l border-border flex flex-col h-full">
      <div className="p-5 border-b border-border">
        <h3 className="text-lg font-semibold text-card-foreground">属性设置</h3>
        <p className="text-xs text-muted-foreground mt-1">
          {selectedNode.componentName}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        <section>
          <h4 className="text-sm font-medium mb-3 text-card-foreground flex items-center">
            <span className="w-1 h-4 bg-blue-500 rounded mr-2" />
            基本信息
          </h4>
          <div className="space-y-3">
            <FormField label="组件ID">
              <Input
                value={selectedNode.id}
                disabled
                className="w-full bg-muted"
              />
            </FormField>
            <FormField label="标题">
              <Input
                value={selectedNode.title}
                onChange={(e) =>
                  onUpdate(selectedNode.id, { title: e.target.value })
                }
                placeholder="请输入组件标题"
                className="w-full"
              />
            </FormField>
          </div>
        </section>

        {configProps.length > 0 && (
          <section>
            <h4 className="text-sm font-medium mb-3 text-card-foreground flex items-center">
              <span className="w-1 h-4 bg-green-500 rounded mr-2" />
              组件属性
            </h4>
            <div className="space-y-3">
              {configProps.map((attr: any) => (
                <FormField key={attr.name} label={attr.title || attr.name}>
                  <PropertyEditor
                    attr={attr}
                    value={localProps[attr.name]}
                    binding={localBindings[attr.name]}
                    onChange={(value, binding) =>
                      handlePropChange(attr.name, value, binding)
                    }
                    variables={variables}
                    dataSources={dataSources}
                  />
                </FormField>
              ))}
            </div>
          </section>
        )}

        <section>
          <h4 className="text-sm font-medium mb-3 text-card-foreground flex items-center">
            <span className="w-1 h-4 bg-purple-500 rounded mr-2" />
            样式设置
          </h4>
          <div className="space-y-3">
            <FormField label="宽度">
              <Input
                value={localStyle.width || ""}
                onChange={(e) => handleStyleChange("width", e.target.value)}
                placeholder="auto / 100px / 100%"
                className="w-full"
              />
            </FormField>
            <FormField label="高度">
              <Input
                value={localStyle.height || ""}
                onChange={(e) => handleStyleChange("height", e.target.value)}
                placeholder="auto / 100px / 100%"
                className="w-full"
              />
            </FormField>
            <FormField label="背景颜色">
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={localStyle.backgroundColor || "#ffffff"}
                  onChange={(e) =>
                    handleStyleChange("backgroundColor", e.target.value)
                  }
                  className="w-12 h-9 p-1"
                />
                <Input
                  type="text"
                  value={localStyle.backgroundColor || ""}
                  onChange={(e) =>
                    handleStyleChange("backgroundColor", e.target.value)
                  }
                  placeholder="#ffffff"
                  className="flex-1"
                />
              </div>
            </FormField>
          </div>
        </section>

        <section>
          <h4 className="text-sm font-medium mb-3 text-card-foreground flex items-center">
            <span className="w-1 h-4 bg-orange-500 rounded mr-2" />
            数据预览
          </h4>
          <div className="p-3 bg-muted rounded-lg border border-border">
            <pre className="text-xs text-muted-foreground whitespace-pre-wrap break-words font-mono">
              {JSON.stringify(
                {
                  id: selectedNode.id,
                  title: selectedNode.title,
                  componentName: selectedNode.componentName,
                  props: localProps,
                  style: localStyle,
                  bindings: localBindings,
                },
                null,
                2,
              )}
            </pre>
          </div>
        </section>
      </div>
    </aside>
  );
};

export default PropertyPanel;
