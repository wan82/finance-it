-- ============================================================
-- Finance-It 数据库初始化脚本
-- 依赖关系：transactions.user_id  ──►  users.id
--   一个用户(user) 拥有 多笔交易(transaction)   [一对多]
--   每一笔交易必须属于某个用户                    [user_id NOT NULL]
-- ============================================================

-- ① 先建“被依赖”的表：users
--    因为 transactions 要引用它，所以必须先存在。
CREATE TABLE IF NOT EXISTS users (
    id          SERIAL PRIMARY KEY,
    username    VARCHAR(255) UNIQUE NOT NULL,
    password    VARCHAR(255) NOT NULL,        -- 存储时必须加密（bcrypt），切勿存明文
    email       VARCHAR(255) UNIQUE,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ② 再建“依赖方”的表：transactions
--    user_id 在建表时就声明为外键，指向 users(id)。
CREATE TABLE IF NOT EXISTS transactions (
    id          SERIAL PRIMARY KEY,
    user_id     INT NOT NULL,                 -- 必填：每笔交易都归属一个用户
    amount      DECIMAL(12, 2) NOT NULL,      -- 金额
    description VARCHAR(255),                 -- 可选描述
    type        VARCHAR(50) NOT NULL,         -- 'income' 或 'expense'
    trans_date  DATE DEFAULT CURRENT_DATE,    -- 交易日期
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- 外键约束：把 user_id 绑定到 users.id
    --   ON DELETE CASCADE = 删除某用户时，自动删掉他名下所有交易
    CONSTRAINT fk_transactions_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);

-- ③ 给外键列建索引
--    按 user_id 查交易（“某用户的所有交易”）是高频操作，
--    建索引能显著加快查询速度。
CREATE INDEX IF NOT EXISTS idx_transactions_user_id
    ON transactions(user_id);
