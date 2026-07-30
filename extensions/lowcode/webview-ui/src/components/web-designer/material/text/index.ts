import { Text as Com } from "./text";

const asset = {
  title: "文本",
  componentName: "Text",
  library: Com,
  configure: {
    component: {
      isContainer: false,
    },
    props: [
      {
        name: "children",
        title: "文本内容",
        setter: {
          name: "StringSetter",
          props: {
            placeholder: "请输入文本内容",
          },
        },
      },
      {
        name: "as",
        title: "HTML标签",
        setter: {
          name: "SelectSetter",
          props: {
            options: [
              { label: "段落 (p)", value: "p" },
              { label: "行内 (span)", value: "span" },
              { label: "块级 (div)", value: "div" },
              { label: "标题1 (h1)", value: "h1" },
              { label: "标题2 (h2)", value: "h2" },
              { label: "标题3 (h3)", value: "h3" },
              { label: "标题4 (h4)", value: "h4" },
              { label: "标题5 (h5)", value: "h5" },
              { label: "标题6 (h6)", value: "h6" },
              { label: "标签 (label)", value: "label" },
            ],
          },
        },
      },
      {
        name: "size",
        title: "字体大小",
        setter: {
          name: "SelectSetter",
          props: {
            options: [
              { label: "特小 (12px)", value: "xs" },
              { label: "小 (14px)", value: "sm" },
              { label: "基础 (16px)", value: "base" },
              { label: "大 (18px)", value: "lg" },
              { label: "特大 (20px)", value: "xl" },
              { label: "超大 (24px)", value: "2xl" },
              { label: "巨大 (30px)", value: "3xl" },
              { label: "超巨大 (36px)", value: "4xl" },
            ],
          },
        },
      },
      {
        name: "weight",
        title: "字体粗细",
        setter: {
          name: "SelectSetter",
          props: {
            options: [
              { label: "极细 (100)", value: "thin" },
              { label: "细 (300)", value: "light" },
              { label: "正常 (400)", value: "normal" },
              { label: "中等 (500)", value: "medium" },
              { label: "半粗 (600)", value: "semibold" },
              { label: "粗 (700)", value: "bold" },
              { label: "特粗 (800)", value: "extrabold" },
            ],
          },
        },
      },
      {
        name: "align",
        title: "文本对齐",
        setter: {
          name: "RadioGroupSetter",
          props: {
            options: [
              { label: "左对齐", value: "left" },
              { label: "居中", value: "center" },
              { label: "右对齐", value: "right" },
              { label: "两端对齐", value: "justify" },
            ],
          },
        },
      },
      {
        name: "color",
        title: "文本颜色",
        setter: {
          name: "SelectSetter",
          props: {
            options: [
              { label: "默认", value: "default" },
              { label: "次要", value: "muted" },
              { label: "主色", value: "primary" },
              { label: "辅助色", value: "secondary" },
              { label: "成功", value: "success" },
              { label: "警告", value: "warning" },
              { label: "危险", value: "danger" },
            ],
          },
        },
      },
      {
        name: "decoration",
        title: "文本装饰",
        setter: {
          name: "SelectSetter",
          props: {
            options: [
              { label: "无", value: "none" },
              { label: "下划线", value: "underline" },
              { label: "删除线", value: "lineThrough" },
            ],
          },
        },
      },
      {
        name: "transform",
        title: "文本转换",
        setter: {
          name: "SelectSetter",
          props: {
            options: [
              { label: "无", value: "none" },
              { label: "全大写", value: "uppercase" },
              { label: "全小写", value: "lowercase" },
              { label: "首字母大写", value: "capitalize" },
            ],
          },
        },
      },
      {
        name: "truncate",
        title: "单行截断",
        setter: {
          name: "SwitchSetter",
        },
      },
      {
        name: "lineClamp",
        title: "多行截断",
        setter: {
          name: "NumberSetter",
          props: {
            min: 1,
            max: 10,
            step: 1,
            placeholder: "不限制",
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
      id: "text-paragraph",
      title: "段落文本",
      screenshot: "ri-text",
      schema: {
        componentName: "Text",
        props: {
          children: "这是一段文本内容",
          as: "p",
          size: "base",
        },
      },
    },
  ],
};

export const Text = { asset, snippet };
