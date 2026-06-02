// routes/transactions.js —— 交易增删改查
//
// 这些路由都挂在 authMiddleware 后面（见 index.js），
// 所以进到这里时 req.user 一定存在（= { id, username }）。
// 每个操作都用 req.user.id 限定范围，保证用户只能动自己的数据。

const express = require('express');
const pool = require('../db');

const router = express.Router();

// 构建“复合键”指纹：金额|描述|类型|日期。
// 四者都相同才算重复，任意一个不同就是新记录。
function makeKey(amount, description, type, date) {
    const a = Number(amount).toFixed(2);      // 金额统一成两位小数，避免 100 vs 100.00 不一致
    const d = (description ?? '').trim();      // 描述：null/空白统一成 ''
    const t = (type ?? '').trim();
    const dt = String(date).slice(0, 10);      // 日期只取 YYYY-MM-DD
    return `${a}|${d}|${t}|${dt}`;
}

// 1. GET /api/transactions —— 列出“当前用户”的所有交易
router.get('/', async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT id, user_id, amount, description, type,
                    to_char(trans_date, 'YYYY-MM-DD') AS trans_date,
                    created_at
             FROM transactions
             WHERE user_id = $1
             ORDER BY trans_date DESC, id DESC`,
            [req.user.id]
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// 1.5 GET /api/transactions/summary?year=2026 —— 按月汇总收入/支出
//   用 SQL 的 GROUP BY 在数据库里聚合，比把所有数据拉到前端再算高效得多。
router.get('/summary', async (req, res) => {
    const year = parseInt(req.query.year, 10) || new Date().getFullYear();
    try {
        const result = await pool.query(
            `SELECT EXTRACT(MONTH FROM trans_date)::int AS month,
                    type,
                    SUM(amount)::float AS total
             FROM transactions
             WHERE user_id = $1
               AND EXTRACT(YEAR FROM trans_date) = $2
             GROUP BY month, type
             ORDER BY month`,
            [req.user.id, year]
        );

        // 组装成固定 12 个月的结构，方便前端直接画图
        const months = Array.from({ length: 12 }, (_, i) => ({
            month: i + 1,
            income: 0,
            expense: 0,
        }));
        let totalIncome = 0;
        let totalExpense = 0;

        for (const row of result.rows) {
            const m = months[row.month - 1];
            if (row.type === 'income') {
                m.income = row.total;
                totalIncome += row.total;
            } else if (row.type === 'expense') {
                m.expense = row.total;
                totalExpense += row.total;
            }
        }

        res.json({ year, months, totalIncome, totalExpense });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// 2. POST /api/transactions —— 创建一条（user_id 取自 token，不信任前端传的）
router.post('/', async (req, res) => {
    const { amount, description, type, trans_date } = req.body;
    try {
        const result = await pool.query(
            `INSERT INTO transactions (user_id, amount, description, type, trans_date)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING *`,
            [req.user.id, amount, description, type, trans_date]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// 2.5 POST /api/transactions/import —— CSV 批量导入（带去重）
//   前端把校验过的行以 { rows: [...] } 发来，这里去重后插入新行。
router.post('/import', async (req, res) => {
    const { rows } = req.body;
    if (!Array.isArray(rows)) {
        return res.status(400).json({ error: 'rows 必须是数组' });
    }

    try {
        // ① 一次性取出当前用户的已有记录，构建“指纹集合”
        const existing = await pool.query(
            `SELECT amount,
                    COALESCE(description, '') AS description,
                    type,
                    to_char(trans_date, 'YYYY-MM-DD') AS trans_date
             FROM transactions
             WHERE user_id = $1`,
            [req.user.id]
        );
        const seen = new Set(
            existing.rows.map((r) => makeKey(r.amount, r.description, r.type, r.trans_date))
        );

        // 服务器今天的日期，作为“未来日期”的判定基准
        const today = new Date().toISOString().slice(0, 10);

        // ② 逐行处理：未来日期跳过、指纹重复跳过，其余插入
        //    （指纹加进 Set 也能去掉 CSV 内部自己的重复行）
        let inserted = 0;
        let skipped = 0;
        let futureSkipped = 0;
        for (const row of rows) {
            // 跳过日期晚于今天的记录
            if (row.trans_date > today) {
                futureSkipped++;
                continue;
            }
            const key = makeKey(row.amount, row.description, row.type, row.trans_date);
            if (seen.has(key)) {
                skipped++;
                continue;
            }
            await pool.query(
                `INSERT INTO transactions (user_id, amount, description, type, trans_date)
                 VALUES ($1, $2, $3, $4, $5)`,
                [req.user.id, row.amount, row.description || null, row.type, row.trans_date]
            );
            seen.add(key);
            inserted++;
        }

        res.json({ inserted, skipped, futureSkipped });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// 2.6 POST /api/transactions/bulk-delete —— 按条件批量删除
//   body: { start, end, type } 都可选；只删当前用户的记录。
//   注意：三个条件都为空时会删除该用户的全部交易（前端会二次确认）。
router.post('/bulk-delete', async (req, res) => {
    const { start, end, type } = req.body;

    // 动态拼接 WHERE 条件（始终带 user_id，保证只删自己的）
    const conditions = ['user_id = $1'];
    const params = [req.user.id];
    let idx = 2;
    if (start) { conditions.push(`trans_date >= $${idx++}`); params.push(start); }
    if (end) { conditions.push(`trans_date <= $${idx++}`); params.push(end); }
    if (type) { conditions.push(`type = $${idx++}`); params.push(type); }

    try {
        const result = await pool.query(
            `DELETE FROM transactions WHERE ${conditions.join(' AND ')}`,
            params
        );
        res.json({ deleted: result.rowCount });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// 3. PUT /api/transactions/:id —— 更新（加 user_id 条件，改不到别人的）
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { amount, description, type, trans_date } = req.body;
    try {
        const result = await pool.query(
            `UPDATE transactions
             SET amount = $1, description = $2, type = $3, trans_date = $4
             WHERE id = $5 AND user_id = $6
             RETURNING *`,
            [amount, description, type, trans_date, id, req.user.id]
        );
        if (result.rows.length === 0) {
            // 要么 id 不存在，要么不属于当前用户
            return res.status(404).json({ error: 'Transaction not found' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// 4. DELETE /api/transactions/:id —— 删除（同样限定 user_id）
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query(
            'DELETE FROM transactions WHERE id = $1 AND user_id = $2',
            [id, req.user.id]
        );
        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Transaction not found' });
        }
        res.status(204).send();
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

module.exports = router;
