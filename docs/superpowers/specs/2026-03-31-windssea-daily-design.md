# Windssea Daily — 技术设计文档

> 日期: 2026-03-31
> 状态: 已确认

## 1. 项目概述

Windssea Daily 是一个基于 Cloudflare Workers 的复合 Serverless 项目。初期实现每日待办任务功能，前端移动优先。后续可挂载多个子项目，通过前端路由分别访问。

**核心定位:**
- 技术演示 + 脚手架（验证 D1 连接、CRUD、Worker 部署流程）
- 每日待办任务（极简：标题 + 完成状态 + 创建时间）
- 移动端优先的前端体验

**非目标（初期不考虑）:**
- 用户认证/权限
- 多租户
- 复杂的业务逻辑

## 2. 架构

### 2.1 方案选择

选择 **Hono 全栈一体** 方案：前端 React SPA + 后端 Hono API 打包在同一个 Cloudflare Worker 中。

**选择理由:**
- 单 Worker 部署，运维成本最低
- Hono RPC 实现前后端类型安全
- 冷启动极快（Hono 轻量级）
- 后续加子项目只需加路由，拆分也很自然

### 2.2 技术栈

| 层级 | 技术 | 版本 |
|------|------|------|
| Runtime | Cloudflare Workers | — |
| 路由/API | Hono | ^4.x |
| 前端 | React + TypeScript | React 18 |
| 构建 | Vite | ^6.x |
| 数据库 | Cloudflare D1 (SQLite) | — |
| 包管理 | pnpm | — |
| 部署 | Wrangler CLI + GitHub Actions | — |

### 2.3 请求流

```
Client Request
    ↓
Cloudflare Worker (Hono)
    ├── /api/todos/*  → API 路由 (CRUD, D1 操作)
    ├── /api/health   → 健康检查 + D1 连通性验证
    └── /*            → React SPA 静态资源 (Vite 构建产物)
```

## 3. 目录结构

```
windssea-daily/
├── src/
│   ├── client/                # React 前端
│   │   ├── App.tsx            # 应用根组件
│   │   ├── main.tsx           # 入口
│   │   └── pages/
│   │       └── TodoPage.tsx   # 待办主页面
│   ├── server/                # Hono API
│   │   ├── index.ts           # Worker 入口，Hono app 导出
│   │   └── routes/
│   │       └── todos.ts       # 待办 CRUD 路由
│   └── shared/                # 前后端共享类型
│       └── types.ts
├── public/                    # 静态资源 (favicon 等)
├── migrations/                # D1 迁移文件
│   └── 0001_init.sql
├── docs/                      # 文档
│   └── superpowers/
│       └── specs/             # 设计文档
├── .github/
│   └── workflows/
│       └── deploy.yml         # CI/CD 自动部署
├── wrangler.toml              # Worker + D1 配置
├── vite.config.ts             # Vite 构建配置
├── tsconfig.json              # TypeScript 配置
├── tsconfig.server.json       # Worker 端 TS 配置（如需分离）
└── package.json
```

## 4. 数据模型

D1 基于 SQLite。初期单表，极简设计。

### 4.1 todos 表

```sql
CREATE TABLE IF NOT EXISTS todos (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  title      TEXT NOT NULL,
  completed  INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
);

CREATE INDEX idx_todos_created_at ON todos(created_at);
```

**设计决策:**
- `id` 自增整数 — SQLite 原生支持，D1 不提供 UUID 生成函数
- `completed` INTEGER 0/1 — SQLite 布尔惯例，API 层负责 `0/1 ↔ boolean` 转换
- `created_at` / `updated_at` — ISO 8601 文本，使用 `datetime('now', 'localtime')` 存储
- 单索引 `created_at` — 最高频查询是按日期获取待办列表
- 无参数查询默认返回今天待办 — 通过 `WHERE date(created_at) = date('now', 'localtime')` 实现

### 4.2 迁移管理

- 迁移文件存放于 `migrations/` 目录
- 命名规范: `NNNN_description.sql`（如 `0001_init.sql`）
- 本地开发: `wrangler dev` 自动应用迁移到本地 SQLite（存储在 `.wrangler/`）
- 生产部署: CI 中执行 `wrangler d1 migrations apply DB --remote`

### 4.3 扩展策略

后续子项目加新表即可，无需修改现有结构。例如：
- 日记功能 → `entries` 表
- 记账功能 → `transactions` 表

## 5. API 设计

### 5.1 端点

| 方法 | 路径 | 功能 | 请求体 | 响应 |
|------|------|------|--------|------|
| GET | `/api/todos` | 获取待办列表 | — | `{ todos: Todo[] }` |
| POST | `/api/todos` | 创建待办 | `{ title: string }` | `{ todo: Todo }` |
| PUT | `/api/todos/:id` | 更新待办 | `{ title?, completed? }` | `{ todo: Todo }` |
| DELETE | `/api/todos/:id` | 删除待办 | — | `{ success: true }` |
| GET | `/api/health` | 健康检查 | — | `{ status: "ok", db: "connected" }` |

### 5.2 查询参数

- `GET /api/todos` — 无参数时默认返回今天的待办
- `GET /api/todos?date=2026-03-31` — 按日期过滤（匹配 `created_at` 的日期部分）
- `GET /api/todos?all=true` — 获取全部待办（忽略日期过滤）

### 5.3 类型定义

```typescript
// src/shared/types.ts
export interface Todo {
  id: number
  title: string
  completed: boolean
  created_at: string
  updated_at: string
}
```

### 5.4 Hono 类型绑定

```typescript
type Bindings = {
  DB: D1Database
}

type AppType = Hono<{ Bindings: Bindings }>
```

前端通过 Hono RPC client (`hc`) 获得完整类型安全，无需手写 API 调用层。

## 6. 前端设计

### 6.1 页面结构

单页面，移动优先，极简风格。

```
App.tsx
└── TodoPage.tsx
    ├── 日期选择器（左右箭头切换日期，默认今天）
    ├── 待办输入框 + 添加按钮
    └── 待办列表
        └── 单条待办
            ├── 复选框（切换完成状态）
            ├── 标题文本
            └── 删除按钮（左滑或长按触发）
```

### 6.2 交互细节

- **添加待办**: 输入框回车 或 点击添加按钮
- **完成切换**: 点击复选框，即时切换 completed 状态
- **删除**: 左滑出现删除按钮，点击确认删除
- **日期切换**: 左右箭头切换日期，列表自动刷新
- **空状态**: 当日无待办时显示引导文案

### 6.3 样式方案

- CSS Modules，不引入 UI 框架，保持轻量
- 移动端适配: viewport meta + CSS 媒体查询
- 最小宽度 320px，最大宽度 480px 居中布局（手机端）

### 6.4 路由

初期不引入路由库，单页面直接渲染。后续挂载子项目时引入 React Router，各子项目通过路由前缀隔离（如 `/todo`、`/journal`）。

## 7. 开发与部署

### 7.1 本地开发

```bash
pnpm install       # 安装依赖
pnpm dev           # 启动开发服务器 (Vite HMR + Wrangler D1 本地模拟)
pnpm build         # 构建生产版本
pnpm deploy        # 部署到 Cloudflare
```

`wrangler dev` 在 `.wrangler/` 下创建本地 SQLite 文件模拟 D1，无需额外数据库配置。

### 7.2 wrangler.toml 核心配置

```toml
name = "windssea-daily"
main = "src/server/index.ts"
compatibility_date = "2026-03-31"

[assets]
directory = "./dist/client"

[[d1_databases]]
binding = "DB"
database_name = "windssea-daily-db"
database_id = "<创建后填入>"
migrations_dir = "migrations"
```

### 7.3 CI/CD (GitHub Actions)

**触发条件:** push 到 `main` 分支

**流程:**
1. Checkout 代码
2. `pnpm install`
3. `pnpm build`
4. `wrangler d1 migrations apply DB --remote`（执行 D1 迁移）
5. `wrangler deploy`

**所需 Secrets:**
- `CLOUDFLARE_API_TOKEN` — Cloudflare API 令牌（需 Workers 和 D1 权限）

### 7.4 D1 数据库创建

首次部署前手动执行:
```bash
wrangler d1 create windssea-daily-db
# 将输出的 database_id 填入 wrangler.toml
wrangler d1 migrations apply DB --remote
```

## 8. 测试策略

初期以手动测试为主，通过测试页面验证：
- D1 连接: `/api/health` 返回 db 连通状态
- CRUD 完整性: 通过待办页面手动增删改查
- 移动端适配: 手机浏览器直接访问测试

后续可补充：
- Vitest 单元测试（API 路由逻辑）
- Miniflare 集成测试（D1 本地模拟）

## 9. 技术文档计划

需要编写以下文档（作为项目交付物）：
1. **项目架构文档** — 架构图、技术栈、请求流
2. **API 文档** — 端点、请求/响应格式、错误码
3. **部署指南** — 本地开发环境搭建、D1 创建、CI/CD 配置
4. **开发计划** — 分阶段实施计划，含里程碑

## 10. 扩展路线

项目按以下顺序演进：
1. **Phase 1** (当前): 脚手架 + 极简待办 + 移动端适配
2. **Phase 2**: 引入 React Router，支持多子项目路由
3. **Phase 3**: 新增子项目（日记/记账等）
4. **Phase 4**: 用户认证 + 访问权限
