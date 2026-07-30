import { DEFAULT_IMAGE_SRC, Image as Com } from "./image";

const asset = {
  title: "图片",
  componentName: "Image",
  library: Com,
  configure: {
    component: {
      isContainer: false,
    },
    props: [
      {
        name: "src",
        title: "图片地址",
        setter: {
          name: "StringSetter",
          props: {
            placeholder: "https://example.com/image.jpg",
          },
        },
      },
      {
        name: "alt",
        title: "替代文本",
        setter: {
          name: "StringSetter",
          props: {
            placeholder: "图片描述",
          },
        },
      },
      {
        name: "width",
        title: "宽度",
        setter: {
          name: "StringSetter",
          props: {
            placeholder: "100% 或 200px",
          },
        },
      },
      {
        name: "height",
        title: "高度",
        setter: {
          name: "StringSetter",
          props: {
            placeholder: "auto 或 200px",
          },
        },
      },
      {
        name: "objectFit",
        title: "填充模式",
        setter: {
          name: "SelectSetter",
          props: {
            options: [
              { label: "包含 (contain)", value: "contain" },
              { label: "覆盖 (cover)", value: "cover" },
              { label: "填充 (fill)", value: "fill" },
              { label: "原始 (none)", value: "none" },
              { label: "缩小 (scale-down)", value: "scale-down" },
            ],
          },
        },
      },
      {
        name: "objectPosition",
        title: "图片位置",
        setter: {
          name: "SelectSetter",
          props: {
            options: [
              { label: "居中", value: "center" },
              { label: "顶部", value: "top" },
              { label: "底部", value: "bottom" },
              { label: "左侧", value: "left" },
              { label: "右侧", value: "right" },
              { label: "左上", value: "left top" },
              { label: "右上", value: "right top" },
              { label: "左下", value: "left bottom" },
              { label: "右下", value: "right bottom" },
            ],
          },
        },
      },
      {
        name: "rounded",
        title: "圆角",
        setter: {
          name: "SelectSetter",
          props: {
            options: [
              { label: "无", value: "none" },
              { label: "小", value: "sm" },
              { label: "中", value: "md" },
              { label: "大", value: "lg" },
              { label: "圆形", value: "full" },
            ],
          },
        },
      },
      {
        name: "showLoading",
        title: "显示加载状态",
        setter: {
          name: "SwitchSetter",
          props: {
            onText: "显示",
            offText: "隐藏",
          },
        },
      },
      {
        name: "fallback",
        title: "失败占位图",
        setter: {
          name: "StringSetter",
          props: {
            placeholder: "加载失败时显示的图片地址",
          },
        },
      },
    ],
    supports: {
      style: true,
      className: true,
    },
  },
};

const snippet = {
  snippets: [
    {
      id: "image-default",
      title: "默认图片",
      screenshot: "ri-image",
      schema: {
        componentName: "Image",
        props: {
          src: DEFAULT_IMAGE_SRC,
          alt: "示例图片",
          width: "400px",
          height: "300px",
          objectFit: "cover",
          rounded: "md",
        },
      },
    },
    {
      id: "image-avatar",
      title: "头像",
      screenshot: "ri-user-3",
      schema: {
        componentName: "Image",
        props: {
          src: DEFAULT_IMAGE_SRC,
          alt: "用户头像",
          width: "80px",
          height: "80px",
          objectFit: "cover",
          rounded: "full",
        },
      },
    },
    {
      id: "image-banner",
      title: "横幅",
      screenshot: "ri-landscape",
      schema: {
        componentName: "Image",
        props: {
          src: DEFAULT_IMAGE_SRC,
          alt: "横幅图片",
          width: "100%",
          height: "200px",
          objectFit: "cover",
          rounded: "lg",
        },
      },
    },
    {
      id: "image-product",
      title: "产品图",
      screenshot: "ri-shopping-bag",
      schema: {
        componentName: "Image",
        props: {
          src: DEFAULT_IMAGE_SRC,
          alt: "产品图片",
          width: "300px",
          height: "300px",
          objectFit: "contain",
          rounded: "md",
        },
      },
    },
  ],
};

export const Image = { asset, snippet };
