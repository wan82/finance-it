// index.js —— 后端入口
// 职责：创建 app、装全局中间件、挂载各个路由模块、启动服务器。
// 具体的业务逻辑都拆到了 routes/ 和 middleware/ 里。

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config(); // 加载 .env 环境变量

const authRoutes = require('./routes/auth');
const transactionRoutes = require('./routes/transactions');
const userRoutes = require('./routes/users');
const authMiddleware = require('./middleware/auth');

const PORT = process.env.PORT;
const app = express();

// 全局中间件
app.use(cors());          // 允许跨域
app.use(express.json());  // 解析 JSON 请求体

// 路由挂载
// ① 公开路由：注册、登录（不需要登录就能访问）
app.use('/api/auth', authRoutes);

// ② 受保护路由：交易接口。先过 authMiddleware 验证 JWT，再进入 transactionRoutes
app.use('/api/transactions', authMiddleware, transactionRoutes);

// ③ 受保护路由：用户账户操作（注销等）
app.use('/api/users', authMiddleware, userRoutes);

// 启动服务器
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
