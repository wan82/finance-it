# Finance-It

个人记账全栈应用：React 前端 + Express 后端 + PostgreSQL（Docker）+ JWT 鉴权。

## 快速开始

需要先装好 [Node.js](https://nodejs.org) 和 [Docker](https://www.docker.com/products/docker-desktop/)。然后：

```bash
# 一键安装：装依赖、启动数据库、建表
make setup

# 启动后端（一个终端）
make dev

# 启动前端（另一个终端）
make front
```

浏览器打开 `http://localhost:5173` 即可。

## 常用命令

| 命令 | 作用 |
|---|---|
| `make setup` | 一键安装（首次用） |
| `make dev` | 启动后端 (`:3000`) |
| `make front` | 启动前端 (`:5173`) |
| `make db-up` / `db-down` | 启动 / 停止数据库 |
| `make psql` | 进数据库命令行 |
| `make db-reset` | 销毁并重建数据库（⚠️ 清空数据） |
| `make clean` | 删除 node_modules |

不带参数运行 `make` 会显示帮助。

## 技术栈

- **前端**：React 18 + Vite + React Router
- **后端**：Node.js + Express + bcrypt + jsonwebtoken
- **数据库**：PostgreSQL 16 (Docker Compose)

## 目录结构

```
finance-it/
├── docker-compose.yml    # 数据库容器配置
├── Makefile              # 一键命令入口
├── sql/init.sql          # 建表脚本
├── backend/              # Express 后端
│   ├── .env.example      # 环境变量模板
│   ├── index.js          # 入口
│   ├── db.js             # 数据库连接池
│   ├── middleware/auth.js
│   └── routes/           # auth / transactions / users
└── frontend/             # React 前端 (Vite)
    └── src/
        ├── api/          # 后端 API 封装
        ├── components/
        └── pages/
```

## 详细文档

`笔记/` 目录有完整的技术解析：
- `项目技术全解.md` — 整体架构与全栈易错点
- `前端三大文件深度解析.md` — app.js / import.js / dashboard.js 逐函数拆解（重构 React 前的版本）
- `React入门教程.md` — 基于本项目的 React 学习材料
