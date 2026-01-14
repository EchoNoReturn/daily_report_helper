# 日报助手 (Daily Report Helper)

一个基于 Tauri v2 + React 19 + TypeScript + SQLite 的日报助手桌面应用。

## ✨ 功能特性

- **随手记**: 记录每日想法和已完成事项
  - 支持时间范围设置（开始/结束时间）
  - 支持图片附件上传
  - 按日期自动分类和展示

- **AI 对话**: 基于当天记录生成日报
  - 集成 OpenAI 兼容的 API 接口
  - 支持自定义模型和 API 地址
  - Markdown 格式支持

- **数据持久化**: 本地 SQLite 数据库
  - 所有数据存储在本地
  - 附件缓存到应用目录
  - 无需联网即可使用

## 🚀 快速开始

### 前置要求

- Node.js 18+
- Rust 1.75+
- Tauri CLI v2

### 安装依赖

```bash
# 安装前端依赖
pnpm install

# 安装 Rust 依赖
cd src-tauri && cargo fetch
```

### 开发模式

```bash
# 启动开发服务器
pnpm tauri dev
```

### 构建应用

```bash
# 构建生产版本
pnpm tauri build
```

## 📁 项目结构

```
daily_report_helper/
├── src/                          # 前端代码
│   ├── App.tsx                   # 主应用组件
│   ├── main.tsx                  # 入口文件
│   ├── store.ts                  # Zustand 状态管理
│   ├── types.ts                  # TypeScript 类型
│   ├── index.css                 # Tailwind 样式
│   └── components/               # UI 组件
│       ├── LeftNav.tsx           # 左侧导航
│       ├── MainContent.tsx       # 主内容区
│       ├── AIChat.tsx            # AI 对话
│       ├── IdeasView.tsx         # 想法视图
│       ├── TasksView.tsx         # 事项视图
│       ├── SettingsView.tsx      # 设置视图
│       └── cards/                # 卡片组件
├── src-tauri/                    # 后端代码
│   ├── src/
│   │   ├── lib.rs               # 主入口
│   │   ├── models.rs            # 数据模型
│   │   ├── database.rs          # 数据库操作
│   │   └── commands.rs          # Tauri 命令
│   ├── Cargo.toml               # Rust 依赖
│   └── tauri.conf.json          # Tauri 配置
```

## 🔧 技术栈

- **前端**: React 19, TypeScript, Vite, Zustand, Tailwind CSS
- **后端**: Rust, Tauri v2, SQLx, Tokio, Chrono
- **数据库**: SQLite
- **UI**: Lucide React 图标库

## 📖 使用说明

### 1. 配置 AI 接口
首次使用时，进入"设置"页面配置：
- API URL (支持 OpenAI 兼容接口)
- API Key
- 模型名称 (如: gpt-4, gpt-3.5-turbo)

### 2. 记录日常
- **想法**: 记录灵感、想法
- **事项**: 记录已完成的工作，支持：
  - 开始/结束时间
  - 图片附件

### 3. 生成日报
在右侧 AI 面板点击"生成日报"按钮，AI 会根据当天记录自动生成专业格式的日报。

### 4. AI 对话
可以与 AI 进行对话，询问基于当天记录的问题。

## 🔍 数据存储

- **数据库**: `./data/daily_report.db` (开发环境)
- **附件**: 应用缓存目录
- **配置**: 数据库中的 configs 表

## 📝 开发笔记

### 数据库表结构
- `configs`: API 配置等键值对
- `ideas`: 想法记录 (内容、附件、日期)
- `done_tasks`: 已完成事项 (内容、时间、附件、日期)

### 权限配置
应用需要以下文件系统权限：
- 读写应用缓存目录 (附件存储)
- 读写应用数据目录 (数据库)

## 🐛 常见问题

### 数据库初始化失败
确保有写入权限，检查 `./data/` 目录是否存在。

### AI API 调用失败
检查 API 配置是否正确，确保 API Key 有效。

### 附件上传失败
检查应用缓存目录权限，确保有写入权限。

## 📄 许可证

MIT License