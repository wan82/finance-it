// 按条件批量删除
import { useState } from 'react';
import TopBar from '../components/TopBar.jsx';
import { bulkDelete } from '../api/transactions.js';

export default function DeletePage() {
    const [start, setStart] = useState('');
    const [end, setEnd] = useState('');
    const [type, setType] = useState('');
    const [feedback, setFeedback] = useState({ msg: '', color: '' });

    async function handleSubmit(e) {
        e.preventDefault();
        setFeedback({ msg: '', color: '' });

        const parts = [];
        if (start) parts.push(`起始 ${start}`);
        if (end) parts.push(`结束 ${end}`);
        if (type) parts.push(type === 'income' ? '类型 收入' : '类型 支出');
        const desc = parts.length ? parts.join('，') : '全部记录（无任何条件）';
        if (!confirm(`确定删除：${desc}？此操作不可恢复。`)) return;

        try {
            const data = await bulkDelete({ start, end, type });
            setFeedback({ msg: `已删除 ${data.deleted} 条记录。`, color: 'var(--primary)' });
        } catch (err) {
            setFeedback({ msg: err.message, color: 'var(--danger)' });
        }
    }

    return (
        <>
            <TopBar />
            <main className="container">
                <div className="page-title">按条件删除记录</div>
                <section className="card card-danger">
                    <h2 className="danger-title">批量删除</h2>
                    <p className="danger-desc">
                        按下列条件删除你的交易记录，删除后不可恢复。<br />
                        条件可任意组合；全部留空则会删除你的<strong>全部</strong>交易记录。
                    </p>
                    <form onSubmit={handleSubmit}>
                        <div className="form-row">
                            <div>
                                <label>起始日期</label>
                                <input type="date" value={start} onChange={(e) => setStart(e.target.value)} />
                            </div>
                            <div>
                                <label>结束日期</label>
                                <input type="date" value={end} onChange={(e) => setEnd(e.target.value)} />
                            </div>
                            <div>
                                <label>类型</label>
                                <select value={type} onChange={(e) => setType(e.target.value)}>
                                    <option value="">全部</option>
                                    <option value="income">收入</option>
                                    <option value="expense">支出</option>
                                </select>
                            </div>
                            <button type="submit" className="btn-danger">删除符合条件的记录</button>
                        </div>
                        {feedback.msg && (
                            <div className="form-feedback" style={{ color: feedback.color }}>
                                {feedback.msg}
                            </div>
                        )}
                    </form>
                </section>
            </main>
        </>
    );
}
