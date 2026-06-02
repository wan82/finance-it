// 交易页：查看（筛选+合计+下载） / 添加 / 编辑（含删除）三模式合一
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import TopBar from '../components/TopBar.jsx';
import {
    listTransactions, createTransaction, updateTransaction, deleteTransaction,
} from '../api/transactions.js';

const TODAY = new Date().toISOString().slice(0, 10);
const money = (n) => '¥' + Number(n).toFixed(2);

function csvEscape(val) {
    const s = String(val ?? '');
    return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}

const emptyForm = { id: '', amount: '', description: '', type: '', trans_date: TODAY };

export default function Transactions() {
    const [searchParams] = useSearchParams();

    // 服务器数据（缓存）
    const [all, setAll] = useState([]);

    // 模式：view / add / edit
    const [mode, setMode] = useState('view');

    // 筛选条件（默认从 URL 读，方便从看板跳过来）
    const [filterStart, setFilterStart] = useState(searchParams.get('start') || '');
    const [filterEnd, setFilterEnd] = useState(searchParams.get('end') || '');
    const [filterType, setFilterType] = useState('');

    // 编辑表单字段
    const [form, setForm] = useState(emptyForm);

    // 拉取交易列表
    async function refresh() {
        try {
            const list = await listTransactions();
            setAll(list);
        } catch (err) {
            console.error(err);
        }
    }
    useEffect(() => { refresh(); }, []);

    // 筛选后的列表（用 useMemo 避免重复计算）
    const filtered = useMemo(() => {
        let list = all;
        if (filterStart) list = list.filter((t) => t.trans_date.slice(0, 10) >= filterStart);
        if (filterEnd) list = list.filter((t) => t.trans_date.slice(0, 10) <= filterEnd);
        if (filterType) list = list.filter((t) => t.type === filterType);
        return list;
    }, [all, filterStart, filterEnd, filterType]);

    // 合计
    const { income, expense, balance } = useMemo(() => {
        let inc = 0, exp = 0;
        filtered.forEach((t) => {
            if (t.type === 'income') inc += Number(t.amount);
            else if (t.type === 'expense') exp += Number(t.amount);
        });
        return { income: inc, expense: exp, balance: inc - exp };
    }, [filtered]);

    // —— 模式切换 ——
    function gotoMode(next) {
        setMode(next);
        if (next === 'add') setForm({ ...emptyForm, trans_date: TODAY });
    }

    function startEdit(t) {
        setForm({
            id: t.id,
            amount: t.amount,
            description: t.description ?? '',
            type: t.type,
            trans_date: t.trans_date.slice(0, 10),
        });
        setMode('edit');
        document.getElementById('transaction-form-card')?.scrollIntoView({ behavior: 'smooth' });
    }

    // —— 提交 ——
    async function handleSubmit(e) {
        e.preventDefault();
        const payload = {
            amount: parseFloat(form.amount),
            description: form.description,
            type: form.type,
            trans_date: form.trans_date,
        };
        try {
            if (form.id) {
                await updateTransaction(form.id, payload);
                await refresh();
                gotoMode('view');
            } else {
                await createTransaction(payload);
                await refresh();
                gotoMode('add'); // 继续录入
            }
        } catch (err) {
            alert(err.message);
        }
    }

    async function handleDelete() {
        if (!form.id) return;
        if (!confirm('确定要删除这条交易吗？')) return;
        try {
            await deleteTransaction(form.id);
            await refresh();
            gotoMode('view');
        } catch (err) {
            alert(err.message);
        }
    }

    function handleDownloadCSV() {
        if (filtered.length === 0) { alert('当前没有可下载的记录'); return; }
        const header = 'amount,description,type,trans_date';
        const lines = filtered.map((t) =>
            [t.amount, csvEscape(t.description ?? ''), t.type, t.trans_date.slice(0, 10)].join(',')
        );
        const csv = [header, ...lines].join('\n');
        const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `transactions_${TODAY}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    }

    return (
        <>
            <TopBar />
            <main className="container">
                <section className="card" id="transaction-form-card">
                    <div className="mode-switch">
                        <button type="button" className={'mode-tab' + (mode === 'view' ? ' active' : '')} onClick={() => gotoMode('view')}>查看交易</button>
                        <button type="button" className={'mode-tab' + (mode === 'add' ? ' active' : '')} onClick={() => gotoMode('add')}>添加交易</button>
                        <button type="button" className={'mode-tab' + (mode === 'edit' ? ' active' : '')} onClick={() => gotoMode('edit')}>编辑记录</button>
                    </div>

                    {mode === 'view' ? (
                        <form onSubmit={(e) => e.preventDefault()}>
                            <div className="form-row">
                                <div>
                                    <label>起始日期</label>
                                    <input type="date" value={filterStart} onChange={(e) => setFilterStart(e.target.value)} />
                                </div>
                                <div>
                                    <label>结束日期</label>
                                    <input type="date" value={filterEnd} onChange={(e) => setFilterEnd(e.target.value)} />
                                </div>
                                <div>
                                    <label>类型</label>
                                    <select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
                                        <option value="">全部</option>
                                        <option value="income">收入</option>
                                        <option value="expense">支出</option>
                                    </select>
                                </div>
                                <button type="button" className="btn-primary">筛选</button>
                                <button
                                    type="button" className="btn-ghost"
                                    onClick={() => { setFilterStart(''); setFilterEnd(''); setFilterType(''); }}
                                >取消筛选</button>
                            </div>
                        </form>
                    ) : (
                        <form onSubmit={handleSubmit}>
                            <div className="form-row">
                                <div>
                                    <label>金额</label>
                                    <input type="number" step="0.01" required
                                        value={form.amount}
                                        onChange={(e) => setForm({ ...form, amount: e.target.value })} />
                                </div>
                                <div>
                                    <label>描述</label>
                                    <input value={form.description}
                                        onChange={(e) => setForm({ ...form, description: e.target.value })} />
                                </div>
                                <div>
                                    <label>类型</label>
                                    <select required value={form.type}
                                        onChange={(e) => setForm({ ...form, type: e.target.value })}>
                                        <option value="">请选择</option>
                                        <option value="income">收入</option>
                                        <option value="expense">支出</option>
                                    </select>
                                </div>
                                <div>
                                    <label>日期</label>
                                    <input type="date" required value={form.trans_date}
                                        onChange={(e) => setForm({ ...form, trans_date: e.target.value })} />
                                </div>
                                <button type="submit" className="btn-primary">
                                    {mode === 'edit' ? '更新' : '添加'}
                                </button>
                                {mode === 'edit' && (
                                    <button type="button" className="btn-danger btn-sm" onClick={handleDelete}>删除</button>
                                )}
                            </div>
                        </form>
                    )}
                </section>

                <section className="card">
                    <div className="list-header">
                        <h2 style={{ margin: 0 }}>交易记录</h2>
                        <button className="btn-ghost btn-sm" onClick={handleDownloadCSV}>下载 CSV</button>
                    </div>

                    <div className="list-summary">
                        <span className="list-summary-label">当前合计</span>
                        <span>收入 <b className="amount-income">{money(income)}</b></span>
                        <span>支出 <b className="amount-expense">{money(expense)}</b></span>
                        <span>结余 <b className={balance >= 0 ? 'amount-income' : 'amount-expense'}>{money(balance)}</b></span>
                    </div>

                    <div className="table-scroll">
                        <table>
                            <thead>
                                <tr>
                                    <th>ID</th><th>金额</th><th>描述</th><th>类型</th><th>日期</th><th>操作</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.length === 0 ? (
                                    <tr><td colSpan="6" className="empty-state">没有符合条件的记录</td></tr>
                                ) : (
                                    filtered.map((t) => {
                                        const isIncome = t.type === 'income';
                                        return (
                                            <tr key={t.id}>
                                                <td>{t.id}</td>
                                                <td className={isIncome ? 'amount-income' : 'amount-expense'}>
                                                    {isIncome ? '+' : '-'}{t.amount}
                                                </td>
                                                <td>{t.description ?? ''}</td>
                                                <td>
                                                    <span className={'badge ' + (isIncome ? 'badge-income' : 'badge-expense')}>
                                                        {isIncome ? '收入' : '支出'}
                                                    </span>
                                                </td>
                                                <td>{t.trans_date.slice(0, 10)}</td>
                                                <td className="actions-cell">
                                                    <button className="btn-ghost btn-sm" onClick={() => startEdit(t)}>编辑</button>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>
            </main>
        </>
    );
}
