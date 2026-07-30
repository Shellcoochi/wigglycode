import { Button } from "./button";
import { Container } from "./container";
import { Text } from "./text";
import { Image } from "./image";
import { Switch } from "./switch";
import { TextInput } from "./text-input";

// 组件配置
const recommendedGroup = {
  title: "推荐组件",
  type: "RECOMMENDED",
  children: [Button, Container, Text, Image],
};

const formGroup = {
  title: "表单组件",
  type: "FORM",
  children: [TextInput,Switch],
};

const basicCategory = {
  title: "基础组件",
  type: "BASIC",
  children: [recommendedGroup, formGroup],
};

const categories = [basicCategory];

// 提取所有 assets 和 snippets
const extractMaterials = (categories: any[]) => {
  const assets: any = [];
  const snippets: any = [];

  categories.forEach((category) => {
    category.children.forEach((group: any) => {
      group.children.forEach((component: any) => {
        if (component.asset) {
          assets.push(component.asset);
        }
        if (component.snippet?.snippets) {
          snippets.push(...component.snippet.snippets);
        }
      });
    });
  });

  return { assets, snippets, categories };
};
const materials = extractMaterials(categories);

export default materials;
