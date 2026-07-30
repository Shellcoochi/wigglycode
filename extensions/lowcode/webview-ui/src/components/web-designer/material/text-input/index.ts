import { TextInput as Com } from "./text-input";

const asset = {
  title: "文本输入",
  componentName: "TextInput",
  library: Com,
  configure: {
    component: {
      isContainer: false,
    },
    props: [
      {
        name: "value",
        title: "值",
        setter: {
          name: "StringSetter",
          props: {
            placeholder: "请输入内容",
          },
        },
      },
      {
        name: "placeholder",
        title: "占位文本",
        setter: {
          name: "StringSetter",
          props: {
            placeholder: "请输入占位文本",
          },
        },
      },
      {
        name: "disabled",
        title: "禁用",
        setter: {
          name: "BooleanSetter",
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
      id: "text-input",
      title: "文本输入",
      screenshot: "ri-input-method-line",
      schema: {
        componentName: "TextInput",
        props: {
          placeholder: "请输入内容",
        },
      },
    },
  ],
};

export const TextInput = { asset, snippet };
