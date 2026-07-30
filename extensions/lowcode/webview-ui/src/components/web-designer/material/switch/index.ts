import { Switch as Com } from "./switch";

const asset = {
  title: "开关",
  componentName: "Switch",
  library: Com,
  configure: {
    component: {
      isContainer: false,
    },
    props: [
      {
        name: "checked",
        title: "选中状态",
        setter: {
          name: "SwitchSetter",
          props: {
            placeholder: "是否选中",
          },
        },
      },
      {
        name: "disabled",
        title: "禁用状态",
        setter: {
          name: "SwitchSetter",
          props: {
            placeholder: "是否禁用",
          },
        },
      },
      {
        name: "onCheckedChange",
        title: "状态变化回调",
        setter: {
          name: "StringSetter",
          props: {
            placeholder: "onChange handler",
          },
        },
      },
    ],
    supports: {
      style: true,
      loop: true,
    },
  },
};

const snippet = {
  snippets: [
    {
      id: "switch",
      title: "开关",
      screenshot: "ri-toggle-line",
      schema: {
        componentName: "Switch",
        props: {
          checked: false,
          disabled: false,
        },
      },
    },
  ],
};

export const Switch = { asset, snippet };