# Finance-It 一键开发环境
#
# 常用命令：
#   make setup        首次安装：装依赖、启动数据库、初始化表
#   make dev          启动后端（前台运行，Ctrl+C 停止）
#   make front        启动前端（前台运行）
#   make db-up        启动数据库容器
#   make db-down      停止数据库容器（数据保留）
#   make db-reset     销毁并重建数据库（数据全没！）
#   make psql         进入 psql 命令行
#   make clean        删除 node_modules（数据库不动）

.PHONY: help setup install env db-up db-down db-reset db-init wait-db psql dev front clean

# 默认目标：执行 make 时打印帮助
help:
	@echo "Finance-It 开发命令："
	@echo "  make setup        一键安装（依赖 + 数据库 + 建表）"
	@echo "  make dev          启动后端 (端口 3000)"
	@echo "  make front        启动前端 (端口 5173)"
	@echo "  make db-up        启动数据库容器"
	@echo "  make db-down      停止数据库容器（保留数据）"
	@echo "  make db-reset     销毁数据库并重建（⚠️ 数据全丢）"
	@echo "  make psql         进入数据库命令行"
	@echo "  make clean        删除 node_modules"

# ========== 一键安装 ==========
setup: env install db-up wait-db db-init
	@echo ""
	@echo "✅ 配置完成！"
	@echo "   下一步打开两个终端，分别跑："
	@echo "     make dev    # 后端"
	@echo "     make front  # 前端"

# 如果 backend/.env 不存在：从模板复制 + 用 node 生成随机 JWT_SECRET 替换占位符
env:
	@if [ ! -f backend/.env ]; then \
		cp backend/.env.example backend/.env; \
		JWT=$$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"); \
		sed -i.bak "s|^JWT_SECRET=.*|JWT_SECRET=$$JWT|" backend/.env; \
		rm -f backend/.env.bak; \
		echo "✓ 已生成 backend/.env，并自动写入随机 JWT_SECRET"; \
	else \
		echo "✓ backend/.env 已存在，跳过（如需重置 JWT_SECRET 请手动改）"; \
	fi

# 安装前后端依赖
install:
	@echo "📦 安装后端依赖..."
	cd backend && npm install
	@echo "📦 安装前端依赖..."
	cd frontend && npm install

# ========== 数据库 ==========
db-up:
	@echo "🐘 启动 PostgreSQL 容器..."
	docker compose up -d

db-down:
	docker compose down

# ⚠️ 销毁数据库（-v 把 volume 也删）
db-reset:
	@echo "⚠️  即将销毁数据库及全部数据..."
	docker compose down -v
	docker compose up -d
	@$(MAKE) wait-db
	@$(MAKE) db-init

# 等数据库就绪（docker-compose.yml 里配了 healthcheck）
wait-db:
	@echo "⏳ 等待数据库就绪..."
	@for i in 1 2 3 4 5 6 7 8 9 10; do \
		if docker exec finance-pg pg_isready -U postgres -d finance_db >/dev/null 2>&1; then \
			echo "✓ 数据库就绪"; exit 0; \
		fi; \
		sleep 1; \
	done; \
	echo "❌ 数据库未就绪，请检查 docker logs finance-pg"; exit 1

# 执行 sql/init.sql 建表（IF NOT EXISTS，重复执行无害）
db-init:
	@echo "🗂  初始化表结构..."
	@docker exec -i finance-pg psql -U postgres -d finance_db < sql/init.sql
	@echo "✓ 表已就绪"

# 进入数据库命令行
psql:
	docker exec -it finance-pg psql -U postgres -d finance_db

# ========== 开发服务器 ==========
dev:
	cd backend && npm run dev

front:
	cd frontend && npm run dev

# ========== 清理 ==========
clean:
	rm -rf backend/node_modules frontend/node_modules
	@echo "✓ node_modules 已清理（数据库不动）"
