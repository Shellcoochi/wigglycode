import React from "react";
import { Input } from "@/components/ui/input";
import { BaseSetterProps } from "./types";

interface NumberSetterProps extends BaseSetterProps {
  placeholder?: string;
  min?: number;
  max?: number;
  step?: number;
}

export const NumberSetter: React.FC<NumberSetterProps> = ({
  value,
  onChange,
  placeholder = "请输入数字",
  min,
  max,
  step = 1,
  disabled,
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val === "") {
      onChange("");
    } else {
      const numValue = Number(val);
      onChange(numValue);
    }
  };

  return (
    <Input
      type="number"
      value={value ?? ""}
      onChange={handleChange}
      placeholder={placeholder}
      min={min}
      max={max}
      step={step}
      disabled={disabled}
      className="w-full"
    />
  );
};