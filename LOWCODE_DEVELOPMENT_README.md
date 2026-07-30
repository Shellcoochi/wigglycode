# WigglyCode 工程说明

本文档记录 WigglyCode 基于 Code OSS 二次开发过程中的工程判断、源码入口、模块边界和阶段计划。本文档不是 VS Code 官方源码导读，也不是产品宣传文档，而是项目内部的工程导航文档，用于支撑低代码/零代码开发工具方向的持续建设。

## 项目定位

WigglyCode 基于 Code OSS 构建，目标不是再造一个普通代码编辑器，而是在 VS Code 成熟的编辑器、工作台、扩展系统、终端、文件系统、调试和远程能力之上，补齐面向业务系统开发的低代码能力。

目标开发场景：

- 前端页面可视化搭建，包括页面、表单、列表、详情、弹窗和复杂布局。
- 后端接口与服务编排，包括 CRUD、聚合接口、外部 HTTP 调用和数据转换。
- 数据库接入，包括连接管理、表结构读取、字段映射、查询调试和模型生成。
- 工作流编排，包括条件分支、审批、定时任务、异步任务和业务流程流转。
- 代码生成与二次开发，包括生成前端、后端、接口定义、数据库迁移脚本和部署配置。
- 运行与部署，包括本地启动、环境配置、Docker Compose、日志查看和后续云端部署。

项目定义：WigglyCode 是面向业务应用开发的工程化低代码 IDE，不定位为单一页面搭建器。

## 工程结论

本仓库的工程结论如下：

- 本项目可以发布成桌面客户端，也可以运行 Web 版本。
- 桌面端入口是 `./scripts/code.sh`。
- Web 开发入口是 `./scripts/code-web.sh`。
- Server + Web UI 入口是 `./scripts/code-server.sh --launch`。
- 当前依赖安装固定使用 npm，pnpm 不作为主工作流。
- 第一阶段不修改 VS Code 编辑器内核，不优先改造 Electron 主进程。
- 第一阶段以内置扩展或 workbench contribution 方式完成低代码能力闭环。

## 本地开发命令

macOS 本地开发环境：

```sh
cd /Users/kaiquanli/cookie/codes/wigglycode
nvm use 24.18.0
export SDKROOT="$(xcrun --sdk macosx --show-sdk-path)"
npm install
```

启动开发版桌面客户端：

```sh
npm run watch
./scripts/code.sh
```

启动 Web 版本：

```sh
npm run watch-web
./scripts/code-web.sh
```

启动 Server + Web UI：

```sh
npm run compile
./scripts/code-server.sh --launch
```

说明：

- `npm run watch` 用于持续编译桌面工作台、内置扩展和 Copilot 相关模块。
- `./scripts/code.sh` 启动 Electron 开发版 Code OSS。
- `./scripts/code-web.sh` 通过浏览器运行 Web 工作台，用于验证浏览器端能力。
- `./scripts/code-server.sh --launch` 启动本地 server 并打开浏览器，用于验证后续云端形态。

## 为什么当前使用 npm

仓库中虽然存在 `pnpm-lock.yaml`，但 VS Code 构建链和源码里存在 npm hoist 假设。典型问题是 `gulp-vinyl-zip` 无法解析：源码直接从根级模块解析间接依赖，而 pnpm 默认不会把间接依赖暴露到根 `node_modules`。

这类问题不是业务代码问题，而是包管理模型差异。为了减少在源码熟悉阶段的干扰，当前主工作流固定为 npm。

后续如果重新支持 pnpm，需要单独进行依赖声明治理或启用 hoist 策略，不纳入低代码功能开发主线。

## 发布形态

WigglyCode 需要同时考虑桌面版和 Web 版。

### 桌面版

桌面版基于 Electron，覆盖以下场景：

- 本地项目开发。
- 本机终端命令执行。
- 本地 Docker 或 Docker Compose 部署。
- 访问本机数据库、内网数据库或通过 SSH 隧道访问远程资源。
- 做强 IDE 能力，例如调试、文件系统、终端、Git。

桌面版是早期开发的主形态，因为它对能力限制最少，调试成本最低。

### Web 版

Web 版基于 VS Code Web 工作台，覆盖以下场景：

- 团队在线使用。
- 云端项目空间。
- 浏览器访问低代码设计器。
- 统一管理数据库连接、环境和部署。

Web 版不能只依赖浏览器前端。低代码平台涉及数据库连接、工作流运行、代码生成和部署执行，这些能力需要服务端承载。

Web 版目标架构：

```text
Browser
  WigglyCode Web Workbench
  Page Designer
  Workflow Designer

LowCode Server
  Project Metadata
  Database Connector
  Workflow Runtime
  Code Generator
  Deployment Adapter

Runtime Target
  Generated Frontend
  Generated Backend
  Database
  Container / Cloud
```

### 当前取舍

第一阶段优先保证桌面版跑通。Web 版从一开始就保留架构位置，但不作为第一阶段交付主线。

原因：

- 桌面版可以直接复用本机文件、终端、Git、Docker。
- Web 版需要先设计服务端权限、会话、资源隔离和连接安全。
- 低代码核心模型还没稳定前，过早投入 Web Server 会分散主线。

## 源码结构

本仓库核心目录如下：

```text
src/vs/base
src/vs/platform
src/vs/editor
src/vs/workbench
src/vs/code
src/vs/server
src/vs/sessions
extensions
build
scripts
resources
```

### `src/vs/base`

底层基础库，包含事件、生命周期、DOM、集合、网络、平台判断等通用能力。

当前原则：不在这里放低代码业务逻辑。

只有当某个能力足够通用，并且已经被多个 VS Code 层级使用时，才进入 `base`。低代码项目早期不修改该目录。

### `src/vs/platform`

平台服务层承载跨模块服务。VS Code 通过依赖注入注册和消费这些服务。

WigglyCode 后续平台服务包括：

- `ILowCodeProjectService`
- `ILowCodeDatabaseService`
- `ILowCodeWorkflowService`
- `ILowCodeGeneratorService`
- `ILowCodeDeploymentService`

当前原则：第一版不急于将所有能力服务化。业务模型稳定后，再从扩展或 `workbench/contrib` 抽到 `platform`。

### `src/vs/editor`

Monaco Editor 核心。它负责文本模型、编辑器 UI、语言特性、Diff、Token、光标和编辑体验。

WigglyCode 会复用它，但早期不改它。

低代码相关的 SQL、表达式、JSON Schema、工作流 DSL，通过语言扩展、Custom Editor 或 Webview 接入。只有当需要修改编辑器基础行为时，才进入 `src/vs/editor`。

### `src/vs/workbench`

主工作台，是 WigglyCode 深度定制的核心区域。

重要子目录：

```text
src/vs/workbench/browser
src/vs/workbench/common
src/vs/workbench/contrib
src/vs/workbench/services
```

后续低代码原生入口、左侧栏、编辑器区域、面板、命令、菜单、布局定制，统一落在该层。

重点阅读方向：

- `src/vs/workbench/contrib`：功能模块的组织方式。
- `src/vs/workbench/services`：工作台级服务如何注册和消费。
- `src/vs/workbench/browser`：工作台 UI 的基础结构。

### `src/vs/code`

桌面应用入口，涉及 Electron 主进程、窗口创建、原生命令、菜单、启动参数等。

当前原则：早期不改这里。后续涉及品牌化、启动流程、应用菜单、打包、协议注册时再进入。

### `src/vs/server`

Server/Web 运行形态相关代码。后续 WigglyCode 要支持团队在线低代码平台时，这里会变得重要。

当前原则：保留 Web 架构意识，但不在第一阶段主攻 server。

### `src/vs/sessions`

当前仓库中存在 Agent Sessions 相关工作台。它不是普通 VS Code 主工作台，但具备工程参考价值。

可参考点：

- 独立工作台窗口如何组织。
- Agent/Chat 场景如何组织 UI 和服务。
- 会话式任务如何和文件、终端、Git 结合。

当前原则：不把低代码功能直接塞进 sessions。只有当 WigglyCode 明确要做“会话式业务开发”时，再参考或复用这里的模式。

### `extensions`

内置扩展目录。第一阶段低代码原型落在该目录。

原因：

- 修改风险低。
- 和 VS Code 官方扩展模型一致。
- 可以快速验证 Activity Bar、TreeView、Command、Webview、Custom Editor。
- 后续稳定能力可以再迁移进 `src/vs/workbench/contrib`。

第一阶段目录：

```text
extensions/lowcode/
```

## 当前迁移落点

旧 Wiggly Web 项目的页面设计器已迁入 Code OSS 内置扩展：

```text
extensions/lowcode/
  package.json
  src/
    extension.ts
    lowCodeProjectProvider.ts
    lowCodeDesignerPanel.ts
  webview-ui/
    src/
      components/web-designer/
      components/ui/
      lib/utils.ts
      index.tsx
      styles.css
  media/
    index.js
    index.css
```

迁移后的运行方式：

- `WigglyCode: Initialize Project`：初始化 `.lowcode/project.json` 和 `.lowcode/pages`。
- `WigglyCode: Open Page Designer`：打开页面设计器 Webview。
- Activity Bar `WigglyCode`：提供低代码项目入口。

旧 Web 项目里的 Next 运行时依赖已从迁移代码中移除。页面设计器现在作为 VS Code Webview 运行，不再依赖 Next 路由、Next Image 或浏览器页面壳。

迁移后的工程边界：

- 设计器 UI 放在 `extensions/lowcode/webview-ui/src/components/web-designer`。
- Webview 容器放在 `extensions/lowcode/src/lowCodeDesignerPanel.ts`。
- VS Code 命令、视图注册放在 `extensions/lowcode/src/extension.ts`。
- `.lowcode` 项目协议后续放在扩展侧服务层，不能散落在 UI 组件内部。
- Webview 与扩展宿主之间的数据交互统一走 `postMessage` 协议。

已接入构建链：

- `build/npm/dirs.ts` 已加入 `extensions/lowcode`。
- `build/gulpfile.extensions.ts` 已加入 `extensions/lowcode/tsconfig.json`。
- `extensions/lowcode` 支持桌面扩展编译、Web 扩展打包和 Webview bundle。

## WigglyCode 模块边界

低代码能力不与 VS Code 内核混写。模块拆分如下：

```text
lowcode-project
  项目协议、目录结构、元数据读写

lowcode-datasource
  数据源配置、密钥保存、连接测试、schema introspection

lowcode-page
  页面 schema、组件树、属性面板、数据绑定、页面生成

lowcode-workflow
  工作流 schema、节点定义、连线、运行器、执行日志

lowcode-generator
  前端生成、后端生成、接口生成、数据库迁移生成

lowcode-deployment
  本地运行、Docker Compose、环境变量、日志、发布记录
```

这些模块必须拥有独立的领域模型，不直接依赖 VS Code UI 类。VS Code 只作为承载这些能力的 IDE Shell。

依赖方向：

```text
VS Code Workbench / Extension UI
  -> LowCode Application Service
    -> LowCode Domain Model
      -> File / Database / Runtime Adapter
```

核心 schema 不依赖 VS Code 类型，以保证后续 Web Server、CLI、生成器、测试工具复用同一套模型。

## 项目文件协议

低代码平台必须有可落盘、可版本管理、可 diff 的项目协议。当前以 `.lowcode` 目录作为项目元数据根目录。

目录结构：

```text
.lowcode/
  project.json
  datasources/
    local.mysql.json
  pages/
    user-list.page.json
    user-form.page.json
  workflows/
    create-user.workflow.json
  services/
    user.service.json
  deployments/
    dev.env.json
```

原则：

- 可视化结果必须保存成文本文件。
- 元数据和生成代码分离。
- 生成代码可以删除后重新生成。
- 密码、token、私钥不进入项目文件。
- 数据源配置只保存连接名称、类型、host、port、database 等非敏感信息。
- 敏感信息进入 SecretStorage、本机 Keychain 或后续 LowCode Server。

后续如果做团队 Web 版，需要把 `.lowcode` 文件协议和服务端元数据协议做映射，而不是推翻本地协议。

## 第一阶段实现策略

第一阶段目标是跑通“低代码闭环”，不是完成整个平台。

最小闭环：

```text
创建低代码项目
  -> 创建页面
    -> 打开页面设计器
      -> 拖入组件
        -> 保存 page schema
          -> 生成前端代码
            -> 本地预览
```

第一阶段从内置扩展开始：

```text
extensions/lowcode/
  package.json
  src/
    extension.ts
    project/
    page/
    designer/
    generator/
```

第一批命令：

```text
WigglyCode: Initialize Project
WigglyCode: New Page
WigglyCode: Open Page Designer
WigglyCode: Generate Code
WigglyCode: Preview
```

第一批视图：

```text
WigglyCode
  Project
  Pages
  Datasources
  Workflows
  Deployments
```

第一批文件：

```text
.lowcode/project.json
.lowcode/pages/example.page.json
```

第一阶段成功标准：

- 可以从 Activity Bar 进入 WigglyCode。
- 可以初始化 `.lowcode` 项目。
- 可以创建页面 schema。
- 可以打开 Webview 设计器。
- 可以保存 schema。
- 可以从 schema 生成一个最小可运行页面。

## 第二阶段实现策略

第二阶段开始接入数据库。

第一版只支持一种数据库，优先 MySQL 或 PostgreSQL。首期不同时支持多种数据库。

模块能力：

- 新建数据源。
- 保存非敏感连接配置。
- 通过 SecretStorage 保存密码。
- 测试连接。
- 读取库、表、字段、索引。
- 在左侧树展示数据库结构。
- 将字段拖入页面设计器生成表单字段。

数据源 schema 示例：

```json
{
  "id": "local-mysql",
  "type": "mysql",
  "name": "Local MySQL",
  "host": "127.0.0.1",
  "port": 3306,
  "database": "demo",
  "username": "root",
  "secretRef": "wigglycode.datasource.local-mysql.password"
}
```

## 第三阶段实现策略

第三阶段进入工作流编排。

工作流第一版不追求复杂 BPMN，先做面向接口编排的 DAG。

最小节点：

- Start
- Database Query
- HTTP Request
- Condition
- Transform
- Code
- Response

工作流 schema 必须可以落盘，例如：

```text
.lowcode/workflows/create-user.workflow.json
```

第一版运行器在 extension host 或本地 Node 进程中运行。后续服务化阶段迁移到 LowCode Server。

## 第四阶段实现策略

第四阶段做生成和部署。

生成目标先固定一种技术栈，避免早期过度抽象。比如：

```text
generated/
  frontend/
  backend/
  docker-compose.yml
```

部署第一版只做本地：

- 本地 build。
- 本地 run。
- Docker Compose。
- 环境变量配置。
- 日志面板。

云部署、Kubernetes、多租户、权限审批放到后续。

## 与 VS Code 能力的映射

| WigglyCode 能力 | 复用的 VS Code 能力 | 初始落点 |
| --- | --- | --- |
| 低代码入口 | Activity Bar / View Container | `extensions/lowcode` |
| 项目树 | TreeView | `extensions/lowcode/src/project` |
| 页面设计器 | Webview / Custom Editor | `extensions/lowcode/src/designer` |
| 页面 schema | Workspace / FileSystem | `.lowcode/pages` |
| 数据库连接 | SecretStorage / Output / TreeView | `extensions/lowcode/src/datasource` |
| SQL 编辑 | Monaco / language extension | `extensions/lowcode` |
| 工作流编排 | Webview / JSON schema | `extensions/lowcode/src/workflow` |
| 代码生成 | WorkspaceEdit / FileSystem / Terminal | `extensions/lowcode/src/generator` |
| 本地运行 | Terminal / Tasks | `extensions/lowcode/src/runtime` |
| 部署 | Terminal / Output / SecretStorage | `extensions/lowcode/src/deployment` |
| 深度产品化 | Workbench contribution | `src/vs/workbench/contrib/lowcode` |

## 什么时候进入 VS Code 源码层

第一阶段先用 extension API 能力做产品闭环。如果遇到以下情况，再进入 `src/vs/workbench`：

- 扩展 API 无法控制默认布局。
- 需要默认内置 WigglyCode Activity Bar。
- 需要定制欢迎页、菜单、标题栏、产品入口。
- 需要让某些服务在扩展激活前就启动。
- 需要更深地控制编辑器、面板或工作台生命周期。

纯业务功能不进入源码层。

早期不修改：

- `src/vs/base`
- `src/vs/editor`
- `src/vs/code/electron-main`
- 构建打包脚本

这些区域改动成本高，且和第一阶段低代码闭环关系不大。

## 需要重点阅读的代码

VS Code 扩展和工作台机制的重点阅读方向：

```sh
rg "viewsContainers" extensions
rg "views" extensions
rg "registerTreeDataProvider" extensions
rg "createWebviewPanel" extensions
rg "registerCustomEditorProvider" extensions src/vs/workbench
rg "registerAction2" src/vs/workbench
rg "registerWorkbenchContribution2" src/vs/workbench
rg "registerSingleton" src/vs/platform src/vs/workbench
```

参考模块：

- `extensions/git`：复杂内置扩展如何组织。
- `extensions/npm`：命令、检测、脚本执行类能力。
- `extensions/json-language-features`：语言能力和 schema。
- `src/vs/workbench/contrib/terminal`：终端和工作台集成。
- `src/vs/workbench/contrib/chat`：复杂工作台功能如何组织 UI 和服务。
- `src/vs/sessions`：独立会话式工作台结构。

## 工程边界

WigglyCode 的核心模型必须脱离 VS Code UI。

可以依赖 VS Code：

- 文件读写。
- 命令。
- 视图。
- Webview。
- SecretStorage。
- Output。
- Terminal。
- Tasks。

不依赖 VS Code：

- 页面 schema。
- 工作流 schema。
- 数据源领域模型。
- 代码生成规则。
- 运行器核心协议。

这样后续可以同时支持：

- 桌面客户端。
- Web 版本。
- LowCode Server。
- CLI 生成器。
- 自动化测试。

## 近期里程碑

### M1：工程熟悉和启动稳定

- 使用 npm 固定本地开发流程。
- 跑通 `npm run watch`。
- 跑通 `./scripts/code.sh`。
- 跑通 `./scripts/code-web.sh`。
- 理清 extension、workbench、server 三条线。

### M2：低代码扩展骨架

- 创建 `extensions/lowcode`。
- 注册 WigglyCode 命令。
- 注册 Activity Bar 入口。
- 注册 Project TreeView。
- 支持初始化 `.lowcode/project.json`。

### M3：页面设计器闭环

- 新建 `.lowcode/pages/*.page.json`。
- 打开 Webview 设计器。
- 保存组件树。
- 生成最小前端页面。
- 支持本地预览。

### M4：数据库接入闭环

- 支持一种数据库。
- 支持连接测试。
- 支持表结构读取。
- 支持字段拖拽生成表单字段。

### M5：工作流闭环

- 支持工作流文件。
- 支持节点和连线。
- 支持本地执行 mock。
- 支持查看执行日志。

### M6：生成与运行

- 生成前端应用。
- 生成后端接口。
- 生成 Docker Compose。
- 支持本地一键启动。

## 当前不做

为了避免工程发散，以下能力暂时不作为第一阶段目标：

- 多租户权限系统。
- 云端协同编辑。
- Kubernetes 部署。
- 完整 BPMN 引擎。
- 多数据库统一抽象。
- VS Code editor 内核修改。
- Electron 主进程深度改造。
- Marketplace/扩展商店体系。

这些能力并非不重要，但不进入第一阶段范围。

## 设计原则

1. 先闭环，再平台化。

   第一阶段只追求最小可用闭环，不追求完整平台抽象。

2. 元数据必须可版本管理。

   页面、工作流、数据源、服务定义均以文本形式落盘。

3. 生成代码和元数据分离。

   生成代码是产物，低代码 schema 才是源。

4. 核心协议不绑定 VS Code。

   VS Code 是 IDE Shell，不是低代码领域模型本身。

5. 桌面优先，Web 保留。

   当前开发先以桌面端为主，架构上保留 Web 和 Server 演进空间。

6. 不为了短期 UI 破坏源码边界。

   能用扩展 API 做的，不急着改 workbench；能放业务模块的，不放 base/editor。

## 下一步

下一步不是继续搬运旧 Web 项目，而是把页面设计器接入 WigglyCode 工程协议。

第一批功能范围：

- 设计器加载 `.lowcode/pages/*.page.json`。
- 设计器保存组件树到页面 schema。
- Project TreeView 读取真实页面列表。
- 左侧组件面板改造成 WigglyCode 物料协议。
- 属性面板统一使用 VS Code 主题变量。
- 数据绑定面板接入 `.lowcode/datasources`。

完成上述范围后，页面设计器从“可打开的 Webview”进入“可保存、可版本管理、可生成代码”的工程闭环。

forMAC export SDKROOT="$(xcrun --sdk macosx --show-sdk-path)"
