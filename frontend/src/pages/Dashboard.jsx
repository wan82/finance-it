// 数据看板：按月柱状图 + 年度汇总
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TopBar from '../components/TopBar.jsx';
import { getSummary } from '../api/transactions.js';

const LEAP_YEARS = [2016, 2020, 2024, 2028, 2032, 2036];
const DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
function lastDayOfMonth(y, m) {
    if (m === 2 && LEAP_YEARS.includes(y)) return 29;
    return DAYS_IN_MONTH[m - 1];
}
const money = (n) => '¥' + Number(n).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function Dashboard() {
    const navigate = useNavigate();
    const [year, setYear] = useState(new Date().getFullYear());
    const [data, setData] = useState(null);
    const [error, setError] = useState('');

    // 每次 year 变化都重新拉数据（这就是 useEffect + 依赖数组的典型用法）
    useEffect(() => {
        getSummary(year)
            .then((d) => { setData(d); setError(''); })
            .catch((err) => { setError(err.message); setData(null); });
    }, [year]);

    function handleMonthClick(m) {
        const mm = String(m).padStart(2, '0');
        const start = `${year}-${mm}-01`;
        const end = `${year}-${mm}-${String(lastDayOfMonth(year, m)).padStart(2, '0')}`;
        navigate(`/transactions?start=${start}&end=${end}`);
    }

    const maxVal = data
        ? Math.max(1, ...data.months.map((m) => Math.max(m.income, m.expense)))
        : 1;
    const balance = data ? data.totalIncome - data.totalExpense : 0;

    return (
        <>
            <TopBar />
            <main className="container">
                <div className="dash-header">
                    <div className="page-title" style={{ margin: 0 }}>数据看板</div>
                    <div className="year-picker">
                        <label style={{ margin: 0 }}>年份</label>
                        <input
                            type="number" min="2000" max="2100" style={{ width: 110 }}
                            value={year}
                            onChange={(e) => setYear(parseInt(e.target.value, 10) || year)}
                        />
                    </div>
                </div>

                <div className="dash-layout">
                    <section className="card" style={{ flex: 1 }}>
                        <h2>各月收支</h2>
                        {error ? (
                            <div className="empty-state">无法加载数据：{error}</div>
                        ) : !data ? (
                            <div className="empty-state">加载中…</div>
                        ) : (
                            <>
                                <div className="chart">
                                    {data.months.map((m) => {
                                        const ih = (m.income / maxVal) * 100;
                                        const eh = (m.expense / maxVal) * 100;
                                        return (
                                            <div
                                                key={m.month}
                                                className="month-col"
                                                title={`${m.month}月\n收入 ${money(m.income)}\n支出 ${money(m.expense)}`}
                                                onClick={() => handleMonthClick(m.month)}
                                            >
                                                <div className="bars">
                                                    <div className="bar bar-income" style={{ height: `${ih}%` }} />
                                                    <div className="bar bar-expense" style={{ height: `${eh}%` }} />
                                                </div>
                                                <div className="month-label">{m.month}月</div>
                                            </div>
                                        );
                                    })}
                                </div>
                                <div className="chart-legend">
                                    <span><i className="legend-dot dot-income" />收入</span>
                                    <span><i className="legend-dot dot-expense" />支出</span>
                                    <span className="chart-hint">点击某个月份可查看该月交易</span>
                                </div>
                            </>
                        )}
                    </section>

                    <aside className="card summary-panel">
                        <h2>年度汇总</h2>
                        <div className="summary-item">
                            <div className="summary-label">总收入</div>
                            <div className="summary-value amount-income">{money(data?.totalIncome ?? 0)}</div>
                        </div>
                        <div className="summary-item">
                            <div className="summary-label">总支出</div>
                            <div className="summary-value amount-expense">{money(data?.totalExpense ?? 0)}</div>
                        </div>
                        <div className="summary-item">
                            <div className="summary-label">结余</div>
                            <div className={'summary-value ' + (balance >= 0 ? 'amount-income' : 'amount-expense')}>
                                {money(balance)}
                            </div>
                        </div>
                    </aside>
                </div>
            </main>
        </>
    );
}
