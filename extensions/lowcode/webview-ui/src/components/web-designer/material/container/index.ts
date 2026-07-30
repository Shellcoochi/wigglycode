import { Container as Com } from "./container";

const asset = {
  title: "容器",
  componentName: "Container",
  library: Com,
  configure: {
    component: {
      isContainer: true,
    },
    props: [
      {
        name: "direction",
        title: "布局",
        setter: {
          name: "SelectSetter",
          props: {
            options: [
              { label: "横向布局", value: "row" },
              { label: "纵向布局", value: "col" },
            ],
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
      id: "Container",
      title: "容器",
      screenshot: "ri-mouse-line",
      schema: {
        componentName: "Container",
        props: {
          width: "full",
          height: "150px",
          direction: "row",
        },
      },
    },
  ],
};

export const Container = { asset, snippet };
