import React from "react";
import { Input } from "@/components/ui/input";
import { BaseSetterProps } from "./types";

interface StringSetterProps extends BaseSetterProps {
  placeholder?: string;
  maxLength?: number;
}

export const StringSetter: React.FC<StringSetterProps> = ({
  value,
  onChange,
  placeholder = "请输入",
  maxLength,
  disabled,
}) => {
  return (
    <Input
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      maxLength={maxLength}
      disabled={disabled}
      className="w-full"
    />
  );
};
