import React from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { BaseSetterProps } from "./types";

interface SwitchSetterProps extends BaseSetterProps {
  onText?: string;
  offText?: string;
}

export const SwitchSetter: React.FC<SwitchSetterProps> = ({
  value,
  onChange,
  onText = "开启",
  offText = "关闭",
  disabled,
}) => {
  return (
    <div className="flex items-center space-x-2">
      <Switch
        checked={!!value}
        onCheckedChange={onChange}
        disabled={disabled}
        id="switch-setter"
      />
      <Label htmlFor="switch-setter" className="text-xs text-gray-500">
        {value ? onText : offText}
      </Label>
    </div>
  );
};