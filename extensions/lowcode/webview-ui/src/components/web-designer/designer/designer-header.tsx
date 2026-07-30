import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  IconDeviceFloppy,
  IconRocket,
  IconShare,
  IconEye,
  IconCode,
  IconPencil,
  IconArrowBackUp,
  IconArrowForwardUp,
  IconZoomIn,
  IconZoomOut,
  IconQuestionMark,
  IconSettings,
  IconLogout,
  IconChevronDown,
  IconPlus,
  IconFileText,
} from "@tabler/icons-react";

import type { ViewMode } from "../types";

// Header Props
interface DesignerHeaderProps {
  // 项目信息
  projectName?: string;
  pageName?: string;

  // 历史操作
  canUndo?: boolean;
  canRedo?: boolean;
  onUndo?: () => void;
  onRedo?: () => void;

  // 视图模式
  viewMode?: ViewMode;
  onViewModeChange?: (mode: ViewMode) => void;

  // 缩放
  zoom?: number;
  onZoomChange?: (zoom: number) => void;

  // 操作
  onSave?: () => void;
  onPublish?: () => void;
  onShare?: () => void;

  // 页面管理
  pages?: Array<{ id: string; name: string }>;
  currentPageId?: string;
  onPageChange?: (pageId: string) => void;
  onCreatePage?: () => void;

  // 用户信息
  user?: {
    name: string;
    avatar?: string;
    email?: string;
  };
  onSettings?: () => void;
  onLogout?: () => void;
}

export default function DesignerHeader({
  projectName = "未命名项目",
  pageName = "首页",
  canUndo = false,
  canRedo = false,
  onUndo,
  onRedo,
  viewMode = "design",
  onViewModeChange,
  zoom = 100,
  onZoomChange,
  onSave,
  onPublish,
  onShare,
  pages = [
    { id: "1", name: "首页" },
    { id: "2", name: "关于我们" },
  ],
  currentPageId = "1",
  onPageChange,
  onCreatePage,
  user = {
    name: "张三",
    email: "zhangsan@example.com",
  },
  onSettings,
  onLogout,
}: DesignerHeaderProps) {
  const [isSaving, setIsSaving] = useState(false);

  // 处理保存
  const handleSave = async () => {
    setIsSaving(true);
    await onSave?.();
    setTimeout(() => setIsSaving(false), 500);
  };

  // 视图模式配置
  const viewModes = [
    { value: "design" as ViewMode, label: "设计", icon: IconPencil },
    { value: "preview" as ViewMode, label: "预览", icon: IconEye },
    { value: "code" as ViewMode, label: "代码", icon: IconCode },
  ];

  return (
    <header className="h-11 bg-background border-b border-border flex items-center px-4 gap-4 shrink-0">
      {/* ========== 左侧区域 ========== */}
      <div className="flex items-center gap-3 flex-1">
        {/* Logo & 项目名 */}
        <div className="flex items-center gap-3 pr-3 border-r border-border">
          <div className="flex items-center justify-center w-6 h-6 rounded-lg bg-primary text-primary-foreground font-bold text-sm">
            W
          </div>
          <div className="flex flex-col">
            <div className="text-sm font-semibold text-foreground leading-none">
              {projectName}
            </div>
          </div>
        </div>

        {/* 页面选择 */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="gap-1 text-sm font-medium"
            >
              <IconFileText className="w-4 h-4" />
              {pages.find((p) => p.id === currentPageId)?.name || pageName}
              <IconChevronDown className="w-3 h-3 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            {pages.map((page) => (
              <DropdownMenuItem
                key={page.id}
                onClick={() => onPageChange?.(page.id)}
                className={cn(
                  "cursor-pointer",
                  page.id === currentPageId && "bg-accent"
                )}
              >
                <IconFileText className="w-4 h-4 mr-2" />
                {page.name}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={onCreatePage}
              className="cursor-pointer text-primary"
            >
              <IconPlus className="w-4 h-4 mr-2" />
              新建页面
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* 历史操作 */}
        <div className="flex items-center gap-1 pl-3 border-l border-border">
          <Button
            variant="ghost"
            size="sm"
            disabled={!canUndo}
            onClick={onUndo}
            className="h-8 w-8 p-0"
            title="撤销 (Ctrl+Z)"
          >
            <IconArrowBackUp className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            disabled={!canRedo}
            onClick={onRedo}
            className="h-8 w-8 p-0"
            title="重做 (Ctrl+Shift+Z)"
          >
            <IconArrowForwardUp className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* ========== 中间区域 ========== */}
      <div className="flex items-center gap-3">
        {/* 视图模式切换 */}
        <div className="flex items-center gap-1 bg-muted p-1 rounded-lg">
          {viewModes.map(({ value, label, icon: Icon }) => (
            <Button
              key={value}
              variant={viewMode === value ? "default" : "ghost"}
              size="sm"
              onClick={() => onViewModeChange?.(value)}
              className={cn(
                "h-7 px-3 gap-1.5 text-xs font-medium",
                viewMode === value && "shadow-sm"
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </Button>
          ))}
        </div>

        {/* 缩放控制 */}
        <div className="flex items-center gap-1 pl-3 border-l border-border">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onZoomChange?.(Math.max(10, zoom - 10))}
            className="h-8 w-8 p-0"
            title="缩小"
          >
            <IconZoomOut className="w-4 h-4" />
          </Button>
          <div className="min-w-14 text-center">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs font-mono"
                >
                  {zoom}%
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center">
                {[50, 75, 100, 125, 150, 200].map((z) => (
                  <DropdownMenuItem
                    key={z}
                    onClick={() => onZoomChange?.(z)}
                    className={cn(
                      "cursor-pointer font-mono",
                      z === zoom && "bg-accent"
                    )}
                  >
                    {z}%
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onZoomChange?.(Math.min(200, zoom + 10))}
            className="h-8 w-8 p-0"
            title="放大"
          >
            <IconZoomIn className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* ========== 右侧区域 ========== */}
      <div className="flex items-center gap-2 flex-1 justify-end">
        {/* 保存按钮 */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleSave}
          disabled={isSaving}
          className="gap-1.5"
        >
          <IconDeviceFloppy
            className={cn("w-4 h-4", isSaving && "animate-pulse")}
          />
          <span className="text-xs font-medium">
            {isSaving ? "保存中..." : "保存"}
          </span>
        </Button>

        {/* 分享按钮 */}
        <Button variant="ghost" size="sm" onClick={onShare} className="gap-1.5">
          <IconShare className="w-4 h-4" />
          <span className="text-xs font-medium">分享</span>
        </Button>

        {/* 发布按钮 */}
        <Button
          variant="default"
          size="sm"
          onClick={onPublish}
          className="gap-1.5 bg-primary hover:bg-primary/90"
        >
          <IconRocket className="w-4 h-4" />
          <span className="text-xs font-medium">发布</span>
        </Button>

        {/* 分隔线 */}
        <div className="w-px h-6 bg-border mx-1" />

        {/* 帮助 */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              title="帮助"
            >
              <IconQuestionMark className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem className="cursor-pointer">
              <IconFileText className="w-4 h-4 mr-2" />
              使用文档
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer">
              <IconCode className="w-4 h-4 mr-2" />
              快捷键
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer text-muted-foreground text-xs">
              版本 v1.0.0
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* 用户菜单 */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-2 h-8 pl-2 pr-3">
              <div className="w-6 h-6 rounded-full bg-linear-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs font-semibold">
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-full h-full rounded-full"
                  />
                ) : (
                  user.name.charAt(0).toUpperCase()
                )}
              </div>
              <span className="text-xs font-medium max-w-25 truncate">
                {user.name}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <div className="px-2 py-1.5">
              <div className="text-sm font-medium">{user.name}</div>
              <div className="text-xs text-muted-foreground">{user.email}</div>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onSettings} className="cursor-pointer">
              <IconSettings className="w-4 h-4 mr-2" />
              设置
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={onLogout}
              className="cursor-pointer text-destructive focus:text-destructive"
            >
              <IconLogout className="w-4 h-4 mr-2" />
              退出登录
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
