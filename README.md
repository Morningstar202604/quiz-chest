# 题匣 · QuizChest

本地优先的题库应用：导入自有题库，离线完成练习、限时模拟考试、错题复习与学习统计。项目采用 React 19 + TypeScript + Vite，无账号、无后端，学习数据与导入题库保存在本机；同一份前端源码可构建为 Web/PWA、Windows 桌面端（Tauri）和 Android 应用（Capacitor）。

## 核心能力

- **导入自有题库**：支持 JSON、CSV 和 `tiyu-bank` v1/v2 题库包；导入前逐题校验、预览和确认，题库可在「我的题库」中练习、导出或删除。
- **三条找题路径**：6 条目标路线、领域 → 学段 → 题库的目录浏览、4 种练习策略（每日一练、薄弱项突破、随机组卷、错题复习）。
- **完整练习闭环**：单选、多选、判断三种题型；顺序练习即时批改，模拟考试倒计时并在到点后自动交卷，错题重练支持答对后移出错题本。
- **学习数据管理**：错题本、收藏、练习记录、学习统计、自定义组卷、组卷历史；成绩和错题可导出为 CSV，题库可导出为 `tiyu-bank` 包。
- **本地优先**：内置 Service Worker 支持离线访问；状态通过 Zustand 持久化到 `localStorage`（`tiyu-store-v1`），不上传、不需要注册。
- **可定制与可访问**：浅色/深色主题、大字号、键盘作答、跳过导航链接、语义化控件；支持通过 `VITE_BRAND_*` 或 `window.__TIYU_BRAND__` 注入品牌配置。

## 内置内容与边界

内置内容是用于演示产品结构的示例题库：7 个领域、20 个学段、32 个题库、195 道题，每个题库仅 6–7 题，全站标注「示例」并可在设置中隐藏。它不替代正式教材或考试题库；正式内容请通过导入功能提供。

当前版本不包含账号体系、云端同步、后台管理和在线题库服务。所有导入数据、练习记录、收藏与设置只保存在当前浏览器或原生 WebView 中。

## 快速开始

```bash
pnpm install
pnpm dev          # http://localhost:5173
pnpm build        # 生产构建，包含 PWA manifest 与 Service Worker
pnpm preview      # 预览 dist，默认 http://localhost:4173
```

要求 Node 20.19+ 或 22.12+，包管理器使用 pnpm。

## 常用命令

| 命令 | 说明 |
| --- | --- |
| `pnpm dev` | 启动开发服务器 |
| `pnpm build` | 类型检查并构建 Web/PWA 产物 |
| `pnpm preview` | 预览 `dist/` |
| `pnpm typecheck` | 执行 `tsc -b` |
| `pnpm lint` | 执行 ESLint |
| `pnpm test` | 执行 Vitest 单元测试 |
| `pnpm check` | 依次执行类型检查、Lint、测试和生产构建 |
| `pnpm build:native` | 以 `native` 模式构建，使用 HashRouter 并关闭 PWA |
| `pnpm desktop:build` | 构建 Tauri 桌面端，需 Rust、MSVC 与打包工具 |

## 关键入口

- `/`：学习台与最近练习
- `/goals`：目标路线
- `/catalog`：题库总览
- `/strategy/daily`：练习策略
- `/library`、`/import`：我的题库与导入向导
- `/compose`：自定义组卷
- `/wrong`、`/favorites`、`/history`、`/stats`：复习、收藏、记录与统计
- `/settings`：主题、字号、示例题库和数据导出设置

## 跨端构建

- **Web/PWA**：执行 `pnpm build`，将 `dist/` 部署到静态服务器；服务器需把未知路径回退到 `index.html`。
- **Windows 桌面**：执行 `pnpm desktop:build`，或使用 `scripts/build-desktop.cmd` 自动注入 MSVC 环境；详细前置条件见 [docs/CROSS_PLATFORM.md](docs/CROSS_PLATFORM.md)。
- **Android**：执行 `pnpm build:native && npx cap sync android`，再在 `android/` 中运行 Gradle 构建；详见 [docs/CROSS_PLATFORM.md](docs/CROSS_PLATFORM.md)。

原生壳使用 `native` 构建模式和 HashRouter，Web 构建默认使用 BrowserRouter。原生端的状态同样保存在 WebView 的 `localStorage` 中。

## 目录结构

```text
src/
├─ data/       内置领域、学段、题库和示例题目
├─ lib/        判分、统计、搜索、导入导出、策略和组卷
├─ store/      Zustand + persist 本地状态
├─ hooks/      计时器、品牌和 Service Worker 逻辑
├─ components/ 布局、搜索、题目、图表和基础 UI
├─ pages/      路由页面
└─ styles/     设计变量、布局、页面和练习样式
```

题库导入字段与 `tiyu-bank` 包格式见 [docs/IMPORT_FORMAT.md](docs/IMPORT_FORMAT.md)，导航设计见 [docs/INFORMATION_ARCHITECTURE.md](docs/INFORMATION_ARCHITECTURE.md)。

## 质量门禁

```bash
pnpm check
```

该命令必须完整通过类型检查、ESLint、Vitest 和生产构建。新增题库时，`src/lib/quiz.test.ts` 会校验题库数量、题目完整性、答案下标和题目 ID 唯一性。
