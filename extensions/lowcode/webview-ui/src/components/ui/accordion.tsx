"use client";

import * as React from "react";
import * as AccordionPrimitive from "@radix-ui/react-accordion";

import { cn } from "@/lib/utils";
import { IconChevronDown } from "@tabler/icons-react";

function Accordion({
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Root>) {
  return <AccordionPrimitive.Root data-slot="accordion" {...props} />;
}

function AccordionItem({
  className,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Item>) {
  return (
    <AccordionPrimitive.Item
      data-slot="accordion-item"
      className={cn("border-b last:border-b-0", className)}
      {...props}
    />
  );
}

interface AccordionTriggerProps
  extends React.ComponentProps<typeof AccordionPrimitive.Trigger> {
  iconPosition?: "left" | "right";
}

function AccordionTrigger({
  className,
  children,
  iconPosition = "right",
  ...props
}: AccordionTriggerProps) {
  return (
    <AccordionPrimitive.Header className="flex">
      <AccordionPrimitive.Trigger
        asChild
        data-slot="accordion-trigger"
        className={cn(
          "focus-visible:border-ring focus-visible:ring-ring/50 flex flex-1 items-center gap-3 rounded-md py-4 text-sm font-medium transition-all outline-none hover:underline focus-visible:ring-[3px] disabled:pointer-events-none disabled:opacity-50",
          // 根据图标位置调整旋转选择器
          iconPosition === "right"
            ? "justify-between [&[data-state=open]>svg:last-child]:rotate-180"
            : "justify-start [&[data-state=open]>svg:first-child]:rotate-180",
          className
        )}
        {...props}
      >
        <div>
          {/* 当图标在左侧时显示 */}
          {iconPosition === "left" && (
            <IconChevronDown className="text-muted-foreground pointer-events-none size-4 shrink-0 transition-transform duration-200" />
          )}

          {/* 内容区域 */}
          <span className="flex-1 text-left">{children}</span>

          {/* 当图标在右侧时显示 */}
          {iconPosition === "right" && (
            <IconChevronDown className="text-muted-foreground pointer-events-none size-4 shrink-0 transition-transform duration-200" />
          )}
        </div>
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  );
}

function AccordionContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Content>) {
  return (
    <AccordionPrimitive.Content
      data-slot="accordion-content"
      className="data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down overflow-hidden text-sm"
      {...props}
    >
      <div className={cn("pt-0 pb-4", className)}>{children}</div>
    </AccordionPrimitive.Content>
  );
}

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent };
