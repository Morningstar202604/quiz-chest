# 题屿 · 万象题库

本地优先的题库应用。React 19 + TypeScript + Vite，纯前端离线运行，一套代码可部署为浏览器 PWA 与 Android（Capacitor 8）应用；桌面端（Tauri 2）为规划中方案，见 [docs/CROSS_PLATFORM.md](docs/CROSS_PLATFORM.md)，尚未落地。

**核心能力：导入你自己的题库。** 支持 JSON / CSV 两种格式，逐行校验后保存在本机，可练习、模拟考试、进入错题本与统计。格式说明见 [docs/IMPORT_FORMAT.md](docs/IMPORT_FORMAT.md)。

## 功能

- **导入自有题库**：JSON / CSV 导入 + 逐行校验报错 + 预览确认；「我的题库」页管理（练习 / 删除），数据只存本机浏览器。
- **三条找题路径**：有明确目标（6 条备考路线）、按领域浏览（领域 → 学段 → 题库三级钻取）、交给系统（4 种练习策略）。
- **内置示例题库**：七大领域 32 个题库 / 18 个学段、195 道演示题（每库仅 6-7 题，全站标注「示例」，可在设置中隐藏——它们演示产品结构，不构成备考材料）。
- **三类题型**：单选、多选、判断，每题附解析与考点标签。
- **三种练习模式**：顺序练习（即时批改）、模拟考试（倒计时限时，到点自动交卷）、错题重练（答对自动移出错题本）。
- **四种练习策略**：每日一练（按薄弱领域加权配题）、薄弱项突破、随机组卷、错题复习，每页显式展示配题依据。
- **错题本 / 收藏 / 练习记录 / 学习统计**：错题按错误次数与最近出错排序；统计含近 7 天作答柱状图、领域分布环形图、正确率折线图。
- **检索与筛选**：全局搜索（⌘K / Ctrl+K）支持题库别名（如「高数」「一建」「教资」），题库总览支持领域 + 难度 + 关键词三重筛选。
- **本地优先**：学习数据与导入题库存 localStorage，断网可用，不上传，无账号。
- **主题与可访问性**：浅色 / 深色主题、大字号模式、键盘作答（1-4 选择、Enter 提交）、跳过导航链接、语义化标签。

## 快速开始

```bash
pnpm install
pnpm dev          # http://localhost:5173
pnpm build        # 生产构建（含 PWA）
pnpm preview      # 预览构建产物 http://localhost:4173
```

要求 Node 20.19+ 或 22.12+。

## 命令

| 命令 | 说明 |
| --- | --- |
| `pnpm dev` | 开发服务器 |
| `pnpm build` | 类型检查 + 生产构建 + Service Worker |
| `pnpm preview` | 预览 dist |
| `pnpm typecheck` | `tsc -b` |
| `pnpm lint` | ESLint |
| `pnpm test` | Vitest 单元测试（题库完整性 + 判分 + 策略引擎） |
| `pnpm build:native` | 原生壳构建（HashRouter，关闭 PWA） |
| `pnpm check` | 依次执行 typecheck → lint → test → build |

## 分类设计

分类按「**目标场景优先，学科其次**」组织，因为刷题的人通常先知道自己要考什么，而不是先想学哪门学科。完整的导航设计说明见 [docs/INFORMATION_ARCHITECTURE.md](docs/INFORMATION_ARCHITECTURE.md)：

| # | 领域 | 覆盖 | 题库数 |
| --- | --- | --- | --- |
| 01 | 升学考试 | 小学 / 初中 / 高中，中高考 | 5 |
| 02 | 大学学业 | 高数、线代、概率、四级、计组 | 5 |
| 03 | 职业资格 | 教资、初级会计、一建、执业药师、法考 | 5 |
| 04 | 语言能力 | 雅思、托福、日语、商务英语 | 4 |
| 05 | 编程开发 | JS、TS、算法、SQL、计算机网络 | 5 |
| 06 | 公职就业 | 行测言语、行测数量、申论、公基 | 4 |
| 07 | 通识素养 | 中国历史、世界地理、生活科学、文学艺术 | 4 |

设计原则：

1. **一级分类按人生阶段与用途划分**，用户无需理解学科体系就能定位。
2. **二级是学段 / 子类（Track）**，如升学考试下的「小学 / 初中 / 高中」，职业资格下的「教育与师范 / 财会金融 / 工程建造 / 医药与法律」。
3. **三级才是具体题库**，标题自带考试名，如「初中数学中考」「教师资格证·综合素质」。
4. **每个题库带 `exam`、`level`、`tags` 三个正交维度**，支持跨领域按难度、考试类型、考点检索。
5. 搜索层内置别名表（`src/lib/search.ts`），「高数」「线代」「教资」「一建」「408」等口语说法都能命中。

导航刻意避开「一屏平铺所有题库」：领域页用左树 + 右内容的主从结构，同一屏只出现一个列表；题库卡上同时给领域、学段、题量与时长，避免只有标题的裸列表。

## 目录结构

```
src/
├─ data/               题库与分类
│  ├─ taxonomy.ts      7 领域 + 32 题库元数据
│  ├─ types.ts         领域 / 题库 / 题目类型定义
│  ├─ index.ts         题目组装与查询
│  └─ questions/       按领域拆分的题目种子文件
├─ lib/                纯函数：判分、统计、搜索、格式化
├─ store/              zustand + persist（本地持久化）
├─ hooks/              计时器等复用逻辑
├─ components/
│  ├─ layout/          AppShell、侧边栏、移动端导航
│  ├─ search/          ⌘K 搜索弹窗
│  ├─ question/        题目相关组件（保留扩展位）
│  ├─ charts/          ECharts 封装（统计页懒加载）
│  └─ ui/              图标注册表与基础组件
├─ pages/              11 个路由页面
└─ styles/             tokens / base / layout / pages / practice
```

## 跨端

详见 [docs/CROSS_PLATFORM.md](docs/CROSS_PLATFORM.md)。摘要：

- **Web / PWA**（已落地）：`pnpm build` 直接部署 `dist/`，支持安装到桌面与主屏幕。
- **Android**（已落地）：Capacitor 8 加载 `dist/`，产出 APK / AAB。已生成 `android/` 工程并构建出 `artifacts/tiyu-1.0.0-debug.apk`（4.4 MB）。
- **桌面**（规划中）：Tauri 2 方案已在 docs 中设计（加载 `dist/`，安装包约 3–10 MB），仓库尚未包含 `src-tauri/` 工程，待落地。

## 数据说明

内置 195 道题目为演示题库，全站标注「示例」，覆盖各领域基础知识点，仅用于验证交互与分类，不替代正式考试教材，可在设置中隐藏。真正的题目供给来自导入：把自有题目按 [docs/IMPORT_FORMAT.md](docs/IMPORT_FORMAT.md) 的 JSON / CSV 格式导入，即成为完整可用的本地题库。内置题目结构见 `src/data/types.ts`，新增题目只需在对应 `questions/*.ts` 中追加对象，`makeQuestions` 会自动生成 ID。

添加新题库：在 `src/data/taxonomy.ts` 增加元数据，在 `src/data/questions/<domain>.ts` 增加同 id 的种子数组，`src/lib/quiz.test.ts` 的完整性测试会自动校验答案下标、解析长度与 ID 唯一性。
