import { Button as Com } from "./button";

const asset = {
  title: "按钮",
  componentName: "Button",
  library: Com,
  configure: {
    component: {
      isContainer: false,
    },
    props: [
      {
        name: "children",
        title: "内容",
        setter: {
          name: "StringSetter",
          props: {
            placeholder: "请输入按钮内容",
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
      id: "button",
      title: "按钮",
      screenshot: "ri-mouse-line",
      schema: {
        componentName: "Button",
        props: {
          children: "按钮",
        },
      },
    },
  ],
};

export const Button = { asset, snippet };
