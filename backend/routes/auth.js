// routes/auth.js —— 注册 / 登录
//
// 关键安全点：
//   - 密码绝不存明文，用 bcrypt 哈希后再存数据库
//   - 登录成功签发 JWT，客户端之后带着它访问受保护接口

const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../db');

const router = express.Router();

// 签发 token 的小工具（注册和登录都用得到）
function signToken(user) {
    return jwt.sign(
        { id: user.id, username: user.username }, // 塞进 token 的内容
        process.env.JWT_SECRET,                    // 签名密钥
        { expiresIn: '7d' }                        // 7 天后过期
    );
}

// ---------- 注册：POST /api/auth/register ----------
router.post('/register', async (req, res) => {
    const { username, email, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: '用户名和密码必填' });
    }

    try {
        // bcrypt.hash(明文, 加盐轮数)：轮数越大越安全也越慢，10 是常用值
        const passwordHash = await bcrypt.hash(password, 10);

        const result = await pool.query(
            `INSERT INTO users (username, password, email)
             VALUES ($1, $2, $3)
             RETURNING id, username, email`,
            [username, passwordHash, email || null]
        );
        const user = result.rows[0];

        const token = signToken(user);
        res.status(201).json({ token, user });
    } catch (err) {
        // 23505 = 唯一约束冲突（用户名或邮箱已存在）
        if (err.code === '23505') {
            return res.status(409).json({ error: '用户名或邮箱已被注册' });
        }
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// ---------- 登录：POST /api/auth/login ----------
router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: '用户名和密码必填' });
    }

    try {
        const result = await pool.query(
            'SELECT * FROM users WHERE username = $1',
            [username]
        );

        // 注意：用户名不存在 / 密码错误，都返回同样的模糊提示，
        // 避免泄露“这个用户名是否存在”
        if (result.rows.length === 0) {
            return res.status(401).json({ error: '用户名或密码错误' });
        }

        const user = result.rows[0];

        // bcrypt.compare(明文, 哈希)：把输入的密码哈希后跟库里的比对
        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            return res.status(401).json({ error: '用户名或密码错误' });
        }

        const token = signToken(user);
        res.json({
            token,
            user: { id: user.id, username: user.username, email: user.email },
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

module.exports = router;
