import { StringSetter } from "./string-setter";
import { SelectSetter } from "./select-setter";
import { SwitchSetter } from "./switch-setter";
import { NumberSetter } from "./number-setter";
import { ColorSetter } from "./color-setter";

export * from "./types";

export { StringSetter, SelectSetter, SwitchSetter, NumberSetter, ColorSetter };

// Setter 映射表
export const SETTER_MAP = {
  StringSetter,
  SelectSetter,
  SwitchSetter,
  NumberSetter,
  ColorSetter,
};
