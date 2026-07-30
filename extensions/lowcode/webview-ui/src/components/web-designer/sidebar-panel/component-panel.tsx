"use client";

import React, { ReactNode, useEffect, useRef } from "react";
import { useDrag } from "react-dnd";
import { ComponentTemplate } from "../types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../ui/tabs";
import Collapsible from "../../ui/collapsible";
import { cn } from "@/lib/utils";
import {
  IconPuzzleFilled,
  IconGripVertical,
} from "@tabler/icons-react";

/* ================= Panel ================= */

const ComponentPanel: React.FC<{
  templates: any[];
  onDragStart?: (template: ComponentTemplate) => void;
  onInsert?: (template: ComponentTemplate) => void;
  nativeDragMimeType?: string;
}> = ({ templates, onDragStart, onInsert, nativeDragMimeType }) => {
  return (
    <div className="w-full h-full min-w-0 bg-background flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border bg-muted/30">
        <h3 className="text-sm font-semibold text-foreground">组件库</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          拖拽组件到画布
        </p>
      </div>

      <Tabs
        defaultValue={templates[0]?.type}
        className="flex-1 overflow-hidden"
      >
        {/* Tabs */}
        <div className="px-3 pt-3">
          <TabsList className="w-full bg-muted/50">
            {templates.map((template) => (
              <TabsTrigger
                key={template.type}
                value={template.type}
                className="flex-1 text-xs data-[state=active]:bg-background"
              >
                {template.title}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto px-2 pb-4">
          {templates.map((template) => (
            <TabsContent
              key={template.type}
              value={template.type}
              className="mt-3 space-y-3"
            >
              {template.children.map((group: any) => (
                <Collapsible
                  key={group.type}
                  defaultValue
                  content={
                    <div
                      className={cn(
                        "mt-1",
                        "grid grid-cols-[repeat(auto-fit,minmax(9rem,1fr))]",
                        "gap-x-2 gap-y-1.5"
                      )}
                    >
                      {group.children.flatMap((com: any) =>
                        com.snippet.snippets.map(
                          (snippet: ComponentTemplate) => (
                            <DraggableComponentItem
                              key={snippet.id}
                              template={snippet}
                              title={com.asset.title}
                              subtitle={
                                snippet.title !== com.asset.title
                                  ? snippet.title
                                  : undefined
                              }
                              onDragStart={() =>
                                onDragStart?.(snippet)
                              }
                              onInsert={() => onInsert?.(snippet)}
                              nativeDragMimeType={nativeDragMimeType}
                            />
                          )
                        )
                      )}
                    </div>
                  }
                >
                  {/* Group Header */}
                  <div
                    className={cn(
                      "flex items-center justify-between",
                      "px-2 py-1.5 rounded-md",
                      "text-xs font-medium text-muted-foreground",
                      "cursor-pointer transition-colors",
                      "hover:bg-accent/50"
                    )}
                  >
                    <span>{group.title}</span>
                    <span className="text-[10px]">
                      {group.children.reduce(
                        (acc: number, com: any) =>
                          acc + com.snippet.snippets.length,
                        0
                      )}
                    </span>
                  </div>
                </Collapsible>
              ))}
            </TabsContent>
          ))}
        </div>
      </Tabs>
    </div>
  );
};

/* ================= Item ================= */

const DraggableComponentItem: React.FC<{
  template: ComponentTemplate;
  title: string;
  subtitle?: string;
  onDragStart?: () => void;
  onInsert?: () => void;
  nativeDragMimeType?: string;
}> = ({ template, title, subtitle, onDragStart, onInsert, nativeDragMimeType }) => {
  const ref = useRef<HTMLDivElement>(null);

  const [{ isDragging }, drag] = useDrag({
    type: "component-panel-item",
    item: () => {
      onDragStart?.();
      return { id: template.id, source: "panel" as const };
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  useEffect(() => {
    if (ref.current) drag(ref.current);
  }, [drag]);

  return (
    <div
      ref={ref}
      draggable
      onDragStart={(event) => {
        if (nativeDragMimeType) {
          const payload = JSON.stringify({ snippetId: template.id });
          event.dataTransfer.effectAllowed = "copy";
          event.dataTransfer.setData(nativeDragMimeType, payload);
          event.dataTransfer.setData("text/plain", payload);
        }
      }}
      onDoubleClick={onInsert}
      className={cn(
        "group flex items-center gap-1.5",
        "px-2 py-1.5 rounded-md",
        "bg-background",
        "cursor-move transition-colors",
        // 分隔感（不是实线）
        "ring-1 ring-border/30",
        "hover:bg-accent/50 hover:ring-border/50",
        isDragging && "opacity-50"
      )}
    >
      {/* Drag Handle */}
      <IconGripVertical className="h-3.5 w-3.5 text-muted-foreground shrink-0" />

      {/* Icon */}
      <div className="flex items-center justify-center h-6 w-6 rounded bg-muted text-muted-foreground shrink-0">
        <IconPuzzleFilled className="h-3.5 w-3.5" />
      </div>

      {/* Text */}
      <div className="min-w-0">
        <div className="text-[11px] font-medium text-foreground truncate">
          {title}
        </div>
        {subtitle && (
          <div className="text-[10px] text-muted-foreground truncate">
            {subtitle}
          </div>
        )}
      </div>
    </div>
  );
};

/* ================= Icon ================= */

const getComponentIcon = (_template: ComponentTemplate): ReactNode => {
  return <IconPuzzleFilled className="h-4 w-4" />;
};

export default ComponentPanel;
