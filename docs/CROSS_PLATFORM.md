# 跨端方案：一套代码，三端运行

本项目是纯前端单页应用（React 19 + TypeScript + Vite），构建产物是静态文件，因此可以用同一份代码分别封装成 Web、桌面应用和 Android App。

```
src/ + public/           一份源码
        │
        ├─ pnpm build ──────► dist/ ──► 任意静态托管（Web / PWA）
        ├─ Tauri 2 ────────► Windows / macOS / Linux 安装包
        └─ Capacitor 8 ────► Android APK / AAB（iOS 同理）
```

## 一、方案对比（为什么选 Tauri + Capacitor）

| 维度 | Tauri 2（桌面） | Capacitor 8（移动） | Electron | React Native / Flutter |
| --- | --- | --- | --- | --- |
| 复用本仓库 UI | 直接加载 `dist/`，零改动 | 直接加载 `dist/`，零改动 | 直接加载，零改动 | 需要重写 UI |
| 安装包体积 | 约 3–10 MB | 约 5–8 MB 壳 + WebView | 约 90–150 MB | 约 15–40 MB |
| 安卓支持 | 无 | 原生支持 | 无 | 支持 |
| 系统 WebView | 系统 WebView（Win: WebView2） | 系统 WebView | 自带 Chromium | 自绘引擎 |
| 学习成本 | 低（Rust 仅构建期） | 低（JS/TS） | 中 | 高 |
| 结论 | 桌面首选 | 安卓首选 | 体积过大 | 需重写，放弃 |

本仓库已内置 PWA（`vite-plugin-pwa`），所以第三条路线「浏览器安装到桌面/手机桌面」开箱即用，不需要任何额外构建。

## 二、Web / PWA（已完成）

```bash
pnpm install
pnpm build          # 产出 dist/
pnpm preview        # 本地预览 http://localhost:4173
```

部署时把 `dist/` 交给任意静态服务器即可。`dist/sw.js` 与 `dist/manifest.webmanifest` 已生成，浏览器访问后可「安装到桌面」或「添加到主屏幕」，离线可用。

注意：SPA 需要把未知路径回退到 `index.html`。Nginx 示例：

```nginx
location / {
  try_files $uri $uri/ /index.html;
}
```

## 三、桌面端（Tauri 2）

状态：**已落地（Windows x64）**。仓库包含 `src-tauri/` 工程、Tauri 配置、图标与桌面构建脚本 `scripts/build-desktop.cmd`。本机已用 Visual Studio 2022 BuildTools + Rust MSVC 工具链验证。

前置：Rust 工具链（`rustup`）、Visual Studio C++ Build Tools、Windows WebView2（Win10/11 自带）、Node 20+。

首次初始化（新环境或重新生成时）：

```bash
pnpm add -D @tauri-apps/cli@2
pnpm tauri init
```

`src-tauri/tauri.conf.json` 关键配置：

```json
{
  "build": {
    "beforeBuildCommand": "pnpm build:native",
    "beforeDevCommand": "pnpm dev",
    "devUrl": "http://localhost:5173",
    "frontendDist": "../dist"
  },
  "app": {
    "windows": [
      {
        "title": "题屿 · 万象题库",
        "width": 1280,
        "height": 860,
        "minWidth": 960,
        "minHeight": 640
      }
    ]
  },
  "bundle": {
    "identifier": "com.tiyu.questionbank",
    "icon": ["icons/32x32.png", "icons/128x128.png", "icons/icon.ico", "icons/icon.icns"]
  }
}
```

打包命令：

```bash
pnpm desktop:dev             # 开发热更新（适合已配置好 MSVC 的终端）
pnpm desktop:build            # 产出安装包（同样需要 MSVC + WiX/NSIS）

# Windows / Git Bash 推荐：脚本自动注入 MSVC 环境
scripts/build-desktop.cmd --no-bundle  # 仅编译 tiyu-desktop.exe
scripts/build-desktop.cmd              # 产出 NSIS/MSI 安装包
```

Windows 推荐在 Git Bash 中执行 `scripts/build-desktop.cmd`：脚本会自动查找 Visual Studio C++ Build Tools，注入正确的 MSVC 链接器，再调用本地 Tauri CLI，避免 Git Bash 自带 `link.exe` 抢占。

产物位置：`src-tauri/target/release/bundle/`（Windows NSIS / MSI；本机已验证 NSIS；MSI 需要 WiX 下载）。二进制位于 `src-tauri/target/release/tiyu-desktop.exe`，本项目已复制 NSIS 安装包到 `artifacts/题屿_1.0.0_x64-setup.exe`。

桌面端注意事项：

1. 原生壳构建时执行 `pnpm build:native`（Vite 的 `native` 模式，见 `src/App.tsx`），改用 `HashRouter` 并关闭 PWA，避免本地静态服务器缺少 SPA 回退导致深层路由 404。Web 部署保持默认的 `BrowserRouter`。
2. 本地数据存于 WebView 的 localStorage，卸载应用即丢失。需要持久化到文件时，接 Tauri 的 `@tauri-apps/plugin-store`，把 `useAppStore` 的 `persist` storage 换成插件实现。
3. 想加系统托盘、开机启动、自动更新，均在 `src-tauri` 内配置，不影响前端代码。

## 四、Android（Capacitor 8）

前置（本机已按此路径安装）：

| 组件 | 路径 | 版本 |
| --- | --- | --- |
| Android SDK | `C:\Dev\android-sdk` | cmdline-tools 12.0 / platform 35 + 36 / build-tools 35.0.0 |
| JDK | `C:\Dev\jdk-21` | OpenJDK 21.0.2 |
| Gradle | `C:\Dev\gradle-8.14.3\gradle-8.14.3` | 8.14.3（镜像下载） |
| Gradle 用户目录 | `C:\Dev\gradle-home` | 含阿里云镜像 init 脚本 |

构建命令（本机实测通过）：

```bash
export ANDROID_HOME='C:\Dev\android-sdk'
export JAVA_HOME='C:\Dev\jdk-21'
export GRADLE_USER_HOME='C:\Dev\gradle-home'
pnpm build:native
npx cap sync android
cd android && "C:/Dev/gradle-8.14.3/gradle-8.14.3/bin/gradle" assembleDebug --no-daemon
```

产物：`android/app/build/outputs/apk/debug/app-debug.apk`（4.4 MB），已复制到 `artifacts/tiyu-1.0.0-debug.apk`。

> 注意：`gradle/wrapper/gradle-wrapper.properties` 默认指向 services.gradle.org，本机网络不可达；因此实际构建使用本地 Gradle 8.14.3，并设置 `GRADLE_USER_HOME` 到短路径（避免 Windows 长路径与 JVM 内存问题）。`org.gradle.jvmargs` 控制在 1024m，否则 16 GB 内存机器上 daemon 会 OOM。

```bash
pnpm add @capacitor/core@8 @capacitor/android@8
pnpm add -D @capacitor/cli@8
npx cap init "题屿" "com.tiyu.questionbank" --web-dir dist
pnpm build:native
npx cap add android
npx cap sync android
npx cap open android
```

`capacitor.config.ts`：

```ts
import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.tiyu.questionbank',
  appName: '题屿',
  webDir: 'dist',
  android: {
    allowMixedContent: false,
    backgroundColor: '#f4f0e7',
  },
}

export default config
```

构建 APK：

```bash
cd android
./gradlew assembleDebug          # 调试包：app/build/outputs/apk/debug/app-debug.apk
./gradlew bundleRelease          # 上架包：app/build/outputs/bundle/release/app-release.aab
```

日常改动后的同步流程：`pnpm build:native && npx cap sync android`。

移动端注意事项：

1. 顶部状态栏与底部手势区：已在 `src/styles/layout.css`、`practice.css` 使用 `env(safe-area-inset-bottom)` 预留安全区。
2. Android 返回键默认会退出应用。需要「返回上一页」时安装 `@capacitor/app`，监听 `backButton` 事件并调用 `history.back()`。
3. Android 应用在 `android/app/src/main/AndroidManifest.xml` 保持 `android:allowBackup="false"`，并用 `android/app/src/main/res/xml/backup_rules.xml` 覆盖旧版备份规则；Android 12+ 通过 `android/app/src/main/res/xml/data_extraction_rules.xml` 对 `cloud-backup` 与 `device-transfer` 均排除 `domain="root"`。题库数据迁移请使用应用内的题库包导出/导入流程（`src/lib/exporter.ts`、`src/pages/LibraryPage.tsx`、`src/pages/ImportPage.tsx`）。
4. 若后续接后端，需要在 `capacitor.config.ts` 的 `server.allowNavigation` 里放行 API 域名，或改用 `@capacitor/http`。
5. 状态栏配色可用 `@capacitor/status-bar` 跟随主题切换。

## 五、iOS（可选，同一套 Capacitor 工程）

```bash
pnpm add @capacitor/ios@8
npx cap add ios
npx cap open ios
```

需要 macOS + Xcode 才能编译，代码与安卓完全共用。

## 六、数据与后端演进

当前是「本地优先」架构：

- 题库：静态 TypeScript 数据（`src/data/`），构建期打包，离线可用。
- 学习数据：`localStorage`（zustand persist，键名 `tiyu-store-v1`，含版本迁移）。

后续接后端时的最小改动路径：

1. 新增 `src/services/` 层，封装题库拉取、作答上报、错题同步接口，组件不直接 fetch。
2. `src/data/index.ts` 的同步导出改为异步加载 + 缓存，页面增加 loading / error 态（现有组件已支持空态）。
3. 登录后把 `wrongBook` / `history` / `daily` 改为服务端数据 + 本地缓存，`useAppStore` 的 persist 仅保留设置项。

## 七、质量门禁

```bash
pnpm typecheck     # tsc -b
pnpm lint          # eslint .
pnpm test          # vitest run（题库完整性 + 判分 + 统计 + 搜索）
pnpm build         # 生产构建 + PWA 生成
```

三端共用同一套门禁：桌面与安卓壳只负责加载 `dist/`，不改变前端行为，因此 Web 端验证通过即代表壳内行为一致（系统返回键、状态栏等平台差异除外）。
