// 用户信息页：账户信息 + 改密码（模拟）+ 注销账户
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import TopBar from '../components/TopBar.jsx';
import { getCurrentUser, deleteAccount } from '../api/auth.js';

export default function Profile() {
    const navigate = useNavigate();
    const user = getCurrentUser();
    const [curPwd, setCurPwd] = useState('');
    const [newPwd, setNewPwd] = useState('');
    const [confirmPwd, setConfirmPwd] = useState('');
    const [pwdFeedback, setPwdFeedback] = useState({ msg: '', color: '' });

    function handlePassword(e) {
        e.preventDefault();
        if (newPwd !== confirmPwd) {
            setPwdFeedback({ msg: '两次输入的新密码不一致', color: 'var(--danger)' });
            return;
        }
        // TODO: 后端暂未提供改密接口，这里仅做前端校验演示
        setPwdFeedback({ msg: '密码已更新（演示模式，未真正保存）', color: 'var(--primary)' });
        setCurPwd(''); setNewPwd(''); setConfirmPwd('');
    }

    async function handleDeleteAccount() {
        if (!confirm('确定要注销账户吗？这会登出并删除你的全部数据，且无法恢复。')) return;
        try {
            await deleteAccount();
            navigate('/login');
        } catch (err) {
            alert('注销失败：' + err.message);
        }
    }

    return (
        <>
            <TopBar />
            <main className="container">
                <Link to="/transactions" className="back-link">← 返回交易记录</Link>
                <div className="page-title">用户信息</div>

                <section className="card">
                    <h2>账户信息</h2>
                    <div className="info-row">
                        <span className="label-text">用户名</span>
                        <span className="value-text">{user?.username || '—'}</span>
                    </div>
                    <div className="info-row">
                        <span className="label-text">邮箱</span>
                        <span className="value-text">{user?.email || '（未填写）'}</span>
                    </div>
                </section>

                <section className="card">
                    <h2>修改密码</h2>
                    <form onSubmit={handlePassword}>
                        <div className="form-group">
                            <label>当前密码</label>
                            <input type="password" required value={curPwd} onChange={(e) => setCurPwd(e.target.value)} />
                        </div>
                        <div className="form-group">
                            <label>新密码</label>
                            <input type="password" required value={newPwd} onChange={(e) => setNewPwd(e.target.value)} />
                        </div>
                        <div className="form-group">
                            <label>确认新密码</label>
                            <input type="password" required value={confirmPwd} onChange={(e) => setConfirmPwd(e.target.value)} />
                        </div>
                        <button type="submit" className="btn-primary">保存新密码</button>
                        {pwdFeedback.msg && (
                            <div className="form-feedback" style={{ color: pwdFeedback.color }}>
                                {pwdFeedback.msg}
                            </div>
                        )}
                    </form>
                </section>

                <section className="card card-danger">
                    <h2 className="danger-title">注销账户</h2>
                    <p className="danger-desc">
                        注销后将自动登出，并删除你的账户及全部交易数据，此操作不可恢复。
                    </p>
                    <button className="btn-danger" onClick={handleDeleteAccount}>注销我的账户</button>
                </section>
            </main>
        </>
    );
}
