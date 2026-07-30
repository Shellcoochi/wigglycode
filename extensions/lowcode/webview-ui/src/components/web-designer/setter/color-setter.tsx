import React from "react";
import { Input } from "@/components/ui/input";
import { BaseSetterProps } from "./types";

interface ColorSetterProps extends BaseSetterProps {
  placeholder?: string;
  defaultColor?: string;
}

export const ColorSetter: React.FC<ColorSetterProps> = ({
  value,
  onChange,
  placeholder = "#000000",
  defaultColor = "#000000",
  disabled,
}) => {
  return (
    <div className="flex gap-2">
      <Input
        type="color"
        value={value || defaultColor}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="w-12 h-9 p-1 cursor-pointer"
      />
      <Input
        type="text"
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className="flex-1"
      />
    </div>
  );
};