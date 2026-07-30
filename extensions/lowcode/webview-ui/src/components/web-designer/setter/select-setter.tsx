import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BaseSetterProps } from "./types";

interface SelectOption {
  label: string;
  value: string | number;
}

interface SelectSetterProps extends BaseSetterProps {
  placeholder?: string;
  options?: SelectOption[];
}

export const SelectSetter: React.FC<SelectSetterProps> = ({
  value,
  onChange,
  placeholder = "请选择",
  options = [],
  disabled,
}) => {
  return (
    <Select
      value={value ? String(value) : ""}
      onValueChange={onChange}
      disabled={disabled}
    >
      <SelectTrigger className="w-full">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((opt) => (
          <SelectItem key={opt.value} value={String(opt.value)}>
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};