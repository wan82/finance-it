// routes/users.js —— 当前用户的账户操作
//
// 这些路由挂在 authMiddleware 后面，所以 req.user 一定存在。

const express = require('express');
const pool = require('../db');

const router = express.Router();

// 注销账户：DELETE /api/users/me
//   删除当前登录用户。因为 init.sql 里 transactions.user_id 设了
//   ON DELETE CASCADE，删用户时数据库会自动删掉他名下的所有交易。
router.delete('/me', async (req, res) => {
    try {
        const result = await pool.query(
            'DELETE FROM users WHERE id = $1',
            [req.user.id]
        );
        if (result.rowCount === 0) {
            return res.status(404).json({ error: '用户不存在' });
        }
        res.status(204).send();
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

module.exports = router;
