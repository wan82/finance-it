// middleware/auth.js —— JWT 鉴权中间件
//
// 作用：拦在“受保护路由”前面，检查请求头里的 token 是否合法。
//   合法 → 把解出来的用户信息挂到 req.user，放行（next）
//   不合法 → 直接返回 401，不进入后续路由

const jwt = require('jsonwebtoken');

function authMiddleware(req, res, next) {
    // 约定：客户端在请求头里带 Authorization: Bearer <token>
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: '未登录或未提供令牌' });
    }

    const token = authHeader.split(' ')[1]; // 取 "Bearer " 后面那部分

    try {
        // 用 .env 里的密钥验证签名，验证通过会返回当初签发时塞进去的内容
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        req.user = payload; // payload = { id, username }
        next();             // 放行，进入真正的路由处理函数
    } catch (err) {
        return res.status(401).json({ error: '令牌无效或已过期，请重新登录' });
    }
}

module.exports = authMiddleware;
