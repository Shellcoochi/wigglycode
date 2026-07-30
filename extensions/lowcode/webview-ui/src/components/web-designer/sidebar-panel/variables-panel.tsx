"use client";

import React, { useState } from "react";
import { Variable } from "../types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { IconEdit, IconPlus, IconTrash } from "@tabler/icons-react";

interface VariablesPanelProps {
  variables: Variable[];
  variableValues: Record<string, any>;
  onVariablesChange: (variables: Variable[]) => void;
  onVariableValuesChange: (values: Record<string, any>) => void;
}

export const VariablesPanel: React.FC<VariablesPanelProps> = ({
  variables,
  variableValues,
  onVariablesChange,
  onVariableValuesChange,
}) => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingVariable, setEditingVariable] = useState<Variable | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    type: "string" as Variable["type"],
    defaultValue: "",
    description: "",
  });

  // 生成唯一ID
  const generateId = () => `var_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // 重置表单
  const resetForm = () => {
    setFormData({
      name: "",
      type: "string",
      defaultValue: "",
      description: "",
    });
    setEditingVariable(null);
  };

  // 打开添加对话框
  const handleOpenAdd = () => {
    resetForm();
    setIsAddDialogOpen(true);
  };

  // 打开编辑对话框
  const handleOpenEdit = (variable: Variable) => {
    setFormData({
      name: variable.name,
      type: variable.type,
      defaultValue: variable.defaultValue,
      description: variable.description || "",
    });
    setEditingVariable(variable);
    setIsAddDialogOpen(true);
  };

  // 保存变量
  const handleSave = () => {
    // 验证
    if (!formData.name.trim()) {
      alert("变量名称不能为空");
      return;
    }

    // 检查变量名是否重复
    const isDuplicate = variables.some(
      (v) => v.name === formData.name && (!editingVariable || v.id !== editingVariable.id)
    );
    if (isDuplicate) {
      alert("变量名称已存在");
      return;
    }

    // 转换默认值类型
    let defaultValue: any = formData.defaultValue;
    if (formData.type === "number") {
      defaultValue = Number(formData.defaultValue) || 0;
    } else if (formData.type === "boolean") {
      defaultValue = formData.defaultValue === "true";
    } else if (formData.type === "object" || formData.type === "array") {
      try {
        defaultValue = JSON.parse(formData.defaultValue);
      } catch (e) {
        alert("JSON 格式错误");
        return;
      }
    }

    if (editingVariable) {
      // 编辑现有变量
      const updatedVariables = variables.map((v) =>
        v.id === editingVariable.id
          ? { ...v, ...formData, defaultValue }
          : v
      );
      onVariablesChange(updatedVariables);

      // 更新运行时值
      const newValues = { ...variableValues };
      if (editingVariable.name !== formData.name) {
        delete newValues[editingVariable.name];
      }
      newValues[formData.name] = defaultValue;
      onVariableValuesChange(newValues);
    } else {
      // 添加新变量
      const newVariable: Variable = {
        id: generateId(),
        name: formData.name,
        type: formData.type,
        defaultValue,
        description: formData.description,
      };
      onVariablesChange([...variables, newVariable]);

      // 添加运行时值
      onVariableValuesChange({
        ...variableValues,
        [formData.name]: defaultValue,
      });
    }

    setIsAddDialogOpen(false);
    resetForm();
  };

  // 删除变量
  const handleDelete = (variable: Variable) => {
    if (!confirm(`确定要删除变量 "${variable.name}" 吗？`)) {
      return;
    }

    const updatedVariables = variables.filter((v) => v.id !== variable.id);
    onVariablesChange(updatedVariables);

    // 删除运行时值
    const newValues = { ...variableValues };
    delete newValues[variable.name];
    onVariableValuesChange(newValues);
  };

  // 更新变量值
  const handleValueChange = (name: string, type: Variable["type"], value: string) => {
    let parsedValue: any = value;

    if (type === "number") {
      parsedValue = Number(value) || 0;
    } else if (type === "boolean") {
      parsedValue = value === "true";
    } else if (type === "object" || type === "array") {
      try {
        parsedValue = JSON.parse(value);
      } catch (e) {
        // 保持原值
        return;
      }
    }

    onVariableValuesChange({
      ...variableValues,
      [name]: parsedValue,
    });
  };

  // 渲染值编辑器
  const renderValueEditor = (variable: Variable) => {
    const value = variableValues[variable.name];

    switch (variable.type) {
      case "string":
        return (
          <Input
            value={value || ""}
            onChange={(e) => handleValueChange(variable.name, variable.type, e.target.value)}
            placeholder="输入文本"
            className="text-sm"
          />
        );

      case "number":
        return (
          <Input
            type="number"
            value={value || 0}
            onChange={(e) => handleValueChange(variable.name, variable.type, e.target.value)}
            placeholder="输入数字"
            className="text-sm"
          />
        );

      case "boolean":
        return (
          <Select
            value={String(value)}
            onValueChange={(val) => handleValueChange(variable.name, variable.type, val)}
          >
            <SelectTrigger className="text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="true">true</SelectItem>
              <SelectItem value="false">false</SelectItem>
            </SelectContent>
          </Select>
        );

      case "object":
      case "array":
        return (
          <Input
            value={JSON.stringify(value)}
            onChange={(e) => handleValueChange(variable.name, variable.type, e.target.value)}
            placeholder={variable.type === "array" ? "[]" : "{}"}
            className="text-sm font-mono"
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="h-full flex flex-col bg-background">
      {/* 头部 */}
      <div className="p-4 border-b border-border bg-card">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-foreground">变量管理</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              管理页面变量和状态
            </p>
          </div>
          <Button size="sm" onClick={handleOpenAdd}>
            <IconPlus className="w-4 h-4 mr-1" />
            添加
          </Button>
        </div>
      </div>

      {/* 变量列表 */}
      <div className="flex-1 overflow-y-auto p-4">
        {variables.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <div className="text-center space-y-2">
              <svg
                className="w-12 h-12 mx-auto opacity-50"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                />
              </svg>
              <p className="text-sm">暂无变量</p>
              <p className="text-xs">点击"添加"按钮创建变量</p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {variables.map((variable) => (
              <div
                key={variable.id}
                className="border border-border rounded-lg p-3 bg-card hover:border-primary/50 transition-colors"
              >
                {/* 变量信息 */}
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{variable.name}</span>
                      <span className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground font-mono">
                        {variable.type}
                      </span>
                    </div>
                    {variable.description && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {variable.description}
                      </p>
                    )}
                  </div>

                  {/* 操作按钮 */}
                  <div className="flex gap-1 ml-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={() => handleOpenEdit(variable)}
                    >
                      <IconEdit className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                      onClick={() => handleDelete(variable)}
                    >
                      <IconTrash className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>

                {/* 值编辑器 */}
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">当前值</Label>
                  {renderValueEditor(variable)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 添加/编辑对话框 */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingVariable ? "编辑变量" : "添加变量"}
            </DialogTitle>
            <DialogDescription>
              {editingVariable
                ? "修改变量的属性和默认值"
                : "创建一个新的页面变量"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* 变量名 */}
            <div className="space-y-2">
              <Label htmlFor="name">变量名 *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="例如: userName"
              />
            </div>

            {/* 类型 */}
            <div className="space-y-2">
              <Label htmlFor="type">类型 *</Label>
              <Select
                value={formData.type}
                onValueChange={(value) =>
                  setFormData({ ...formData, type: value as Variable["type"] })
                }
              >
                <SelectTrigger id="type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="string">字符串 (string)</SelectItem>
                  <SelectItem value="number">数字 (number)</SelectItem>
                  <SelectItem value="boolean">布尔值 (boolean)</SelectItem>
                  <SelectItem value="object">对象 (object)</SelectItem>
                  <SelectItem value="array">数组 (array)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 默认值 */}
            <div className="space-y-2">
              <Label htmlFor="defaultValue">默认值 *</Label>
              {formData.type === "boolean" ? (
                <Select
                  value={formData.defaultValue}
                  onValueChange={(value) =>
                    setFormData({ ...formData, defaultValue: value })
                  }
                >
                  <SelectTrigger id="defaultValue">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">true</SelectItem>
                    <SelectItem value="false">false</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  id="defaultValue"
                  type={formData.type === "number" ? "number" : "text"}
                  value={formData.defaultValue}
                  onChange={(e) =>
                    setFormData({ ...formData, defaultValue: e.target.value })
                  }
                  placeholder={
                    formData.type === "object"
                      ? '{"key": "value"}'
                      : formData.type === "array"
                      ? "[1, 2, 3]"
                      : "输入默认值"
                  }
                  className={
                    formData.type === "object" || formData.type === "array"
                      ? "font-mono"
                      : ""
                  }
                />
              )}
            </div>

            {/* 描述 */}
            <div className="space-y-2">
              <Label htmlFor="description">描述（可选）</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="变量用途说明"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsAddDialogOpen(false);
                resetForm();
              }}
            >
              取消
            </Button>
            <Button onClick={handleSave}>
              {editingVariable ? "保存" : "添加"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};