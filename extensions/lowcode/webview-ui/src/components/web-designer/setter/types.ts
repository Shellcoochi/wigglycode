export interface BaseSetterProps {
  value: any;
  onChange: (value: any) => void;
  disabled?: boolean;
}

export interface SetterConfig {
  name: string;
  props?: Record<string, any>;
}