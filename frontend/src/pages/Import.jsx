// CSV 导入页：选文件 → 解析 → 校验 → 预览 → 确认入库
import { useState } from 'react';
import TopBar from '../components/TopBar.jsx';
import { importCSV } from '../api/transactions.js';

const EXPECTED_HEADER = ['amount', 'description', 'type', 'trans_date'];
const TODAY = new Date().toISOString().slice(0, 10);

function parseCSVLine(line) {
    const cells = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (inQuotes) {
            if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++; }
            else if (ch === '"') inQuotes = false;
            else cur += ch;
        } else {
            if (ch === '"') inQuotes = true;
            else if (ch === ',') { cells.push(cur); cur = ''; }
            else cur += ch;
        }
    }
    cells.push(cur);
    return cells.map((c) => c.trim());
}

function validateRow(cells, lineNo) {
    const errors = [];
    let isFuture = false;
    if (cells.length !== 4) {
        errors.push(`第 ${lineNo} 行：应有 4 列，实际 ${cells.length} 列`);
        return { errors, isFuture };
    }
    const [amount, description, type, trans_date] = cells;
    if (amount === '' || isNaN(Number(amount))) errors.push(`第 ${lineNo} 行：金额「${amount}」不是有效数字`);
    if (type !== 'income' && type !== 'expense') errors.push(`第 ${lineNo} 行：类型「${type}」必须是 income 或 expense`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(trans_date)) errors.push(`第 ${lineNo} 行：日期「${trans_date}」格式应为 YYYY-MM-DD`);
    else if (trans_date > TODAY) isFuture = true; // 格式正确但是未来日期，标记为“跳过”而非“错误”
    return { errors, isFuture, row: { amount: Number(amount), description, type, trans_date } };
}

export default function Import() {
    const [previewRows, setPreviewRows] = useState([]); // [{idx, cells, status: 'ok'|'error'|'future'}]
    const [validRows, setValidRows] = useState([]);
    const [errors, setErrors] = useState([]);
    const [futureRowCount, setFutureRowCount] = useState(0);
    const [parseFeedback, setParseFeedback] = useState({ msg: '', color: '' });
    const [importFeedback, setImportFeedback] = useState({ msg: '', color: '' });
    const [importing, setImporting] = useState(false);

    function handleFile(e) {
        const file = e.target.files[0];
        setParseFeedback({ msg: '', color: '' });
        if (!file) return;

        const isCsv = file.name.toLowerCase().endsWith('.csv') || file.type === 'text/csv';
        if (!isCsv) {
            setParseFeedback({ msg: `只能上传 .csv 文件，当前文件：${file.name}`, color: 'var(--danger)' });
            setPreviewRows([]); setValidRows([]); setErrors([]);
            e.target.value = '';
            return;
        }

        const reader = new FileReader();
        reader.onload = () => processText(reader.result);
        reader.readAsText(file);
    }

    function processText(text) {
        const lines = text.split(/\r?\n/).filter((l) => l.trim() !== '');
        if (lines.length === 0) {
            setParseFeedback({ msg: '文件是空的', color: 'var(--danger)' });
            return;
        }
        const header = parseCSVLine(lines[0]).map((h) => h.toLowerCase());
        if (header.join(',') !== EXPECTED_HEADER.join(',')) {
            setParseFeedback({
                msg: `表头不正确。应为：${EXPECTED_HEADER.join(',')}，实际为：${header.join(',')}`,
                color: 'var(--danger)',
            });
            setPreviewRows([]); setValidRows([]); setErrors([]);
            return;
        }
        const allErrors = [];
        const goodRows = [];
        const preview = [];
        let futureCount = 0;
        for (let i = 1; i < lines.length; i++) {
            const cells = parseCSVLine(lines[i]);
            const { errors: rowErr, isFuture, row } = validateRow(cells, i + 1);
            const hasErr = rowErr.length > 0;
            const status = hasErr ? 'error' : (isFuture ? 'future' : 'ok');
            // 只有“干净”的行才进入待导入列表；未来日期会显示但不上传
            if (status === 'ok') goodRows.push(row);
            if (hasErr) allErrors.push(...rowErr);
            if (status === 'future') futureCount++;
            preview.push({ idx: i, cells, status });
        }
        setPreviewRows(preview);
        setValidRows(goodRows);
        setErrors(allErrors);
        setFutureRowCount(futureCount);
        setParseFeedback({ msg: '', color: '' });
    }

    async function handleImport() {
        setImporting(true);
        setImportFeedback({ msg: '导入中…', color: 'var(--text-muted)' });
        try {
            const data = await importCSV(validRows);
            const future = data.futureSkipped ?? 0;
            setImportFeedback({
                msg: `导入完成：新增 ${data.inserted} 条，跳过重复 ${data.skipped} 条` +
                    (future > 0 ? `，跳过未来日期 ${future} 条` : '') + '。',
                color: 'var(--primary)',
            });
        } catch (err) {
            setImportFeedback({ msg: err.message, color: 'var(--danger)' });
        } finally {
            setImporting(false);
        }
    }

    const allOk = errors.length === 0 && validRows.length > 0;

    return (
        <>
            <TopBar />
            <main className="container">
                <div className="page-title">批量导入记录</div>

                <section className="card">
                    <h2>选择 CSV 文件</h2>
                    <p className="danger-desc">
                        CSV 第一行必须是表头：<code>amount,description,type,trans_date</code><br />
                        type 只能是 income 或 expense；trans_date 格式为 YYYY-MM-DD；description 可留空。
                    </p>
                    <div className="form-group">
                        <input type="file" accept=".csv" onChange={handleFile} />
                    </div>
                    {parseFeedback.msg && (
                        <div className="form-feedback" style={{ color: parseFeedback.color }}>
                            {parseFeedback.msg}
                        </div>
                    )}
                </section>

                {previewRows.length > 0 && (
                    <section className="card">
                        <h2>预览</h2>
                        {errors.length > 0 ? (
                            <div className="form-feedback" style={{ color: 'var(--danger)' }}>
                                发现 {errors.length} 个问题，请修正后重新上传：<br />{errors.join('；')}
                            </div>
                        ) : (
                            <div className="form-feedback">
                                格式校验通过，共 {validRows.length} 行可导入
                                {futureRowCount > 0 && `（另有 ${futureRowCount} 行因日期晚于今天将被跳过）`}。
                            </div>
                        )}
                        <div style={{ marginBottom: 18, marginTop: 14 }}>
                            <button className="btn-primary" disabled={!allOk || importing} onClick={handleImport}>
                                确认导入
                            </button>
                            {importFeedback.msg && (
                                <span className="form-feedback" style={{ color: importFeedback.color, marginLeft: 12 }}>
                                    {importFeedback.msg}
                                </span>
                            )}
                        </div>
                        <div className="table-scroll">
                            <table>
                                <thead>
                                    <tr><th>#</th><th>金额</th><th>描述</th><th>类型</th><th>日期</th><th>状态</th></tr>
                                </thead>
                                <tbody>
                                    {previewRows.map((r) => {
                                        const label = r.status === 'ok' ? '通过'
                                            : r.status === 'future' ? '跳过(未来日期)'
                                            : '错误';
                                        const badgeClass = r.status === 'ok' ? 'badge-income' : 'badge-expense';
                                        return (
                                            <tr key={r.idx}>
                                                <td>{r.idx}</td>
                                                <td>{r.cells[0] ?? ''}</td>
                                                <td>{r.cells[1] ?? ''}</td>
                                                <td>{r.cells[2] ?? ''}</td>
                                                <td>{r.cells[3] ?? ''}</td>
                                                <td>
                                                    <span className={'badge ' + badgeClass}>{label}</span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </section>
                )}
            </main>
        </>
    );
}
