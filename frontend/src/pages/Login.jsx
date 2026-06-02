// 登录 / 注册 页（带 Tab 切换）
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login, register, isLoggedIn } from '../api/auth.js';

export default function Login() {
    const navigate = useNavigate();
    const [tab, setTab] = useState('login'); // 'login' | 'register'
    const [error, setError] = useState('');

    // 已登录的直接送进 dashboard
    if (isLoggedIn()) {
        navigate('/dashboard', { replace: true });
        return null;
    }

    // 登录表单字段
    const [loginUser, setLoginUser] = useState('');
    const [loginPwd, setLoginPwd] = useState('');

    // 注册表单字段
    const [regUser, setRegUser] = useState('');
    const [regEmail, setRegEmail] = useState('');
    const [regPwd, setRegPwd] = useState('');

    async function handleLogin(e) {
        e.preventDefault();
        setError('');
        try {
            await login(loginUser.trim(), loginPwd);
            navigate('/dashboard');
        } catch (err) {
            setError(err.message);
        }
    }

    async function handleRegister(e) {
        e.preventDefault();
        setError('');
        try {
            await register(regUser.trim(), regEmail.trim(), regPwd);
            navigate('/dashboard');
        } catch (err) {
            setError(err.message);
        }
    }

    return (
        <div className="auth-wrap">
            <div className="auth-card">
                <div className="auth-logo">Finance It</div>
                <div className="auth-subtitle">轻松记录你的每一笔收支</div>

                <div className="auth-tabs">
                    <button
                        className={'auth-tab' + (tab === 'login' ? ' active' : '')}
                        onClick={() => { setTab('login'); setError(''); }}
                    >登录</button>
                    <button
                        className={'auth-tab' + (tab === 'register' ? ' active' : '')}
                        onClick={() => { setTab('register'); setError(''); }}
                    >注册</button>
                </div>

                {tab === 'login' ? (
                    <form className="auth-form" onSubmit={handleLogin}>
                        <div className="form-group">
                            <label>用户名</label>
                            <input value={loginUser} onChange={(e) => setLoginUser(e.target.value)} required />
                        </div>
                        <div className="form-group">
                            <label>密码</label>
                            <input type="password" value={loginPwd} onChange={(e) => setLoginPwd(e.target.value)} required />
                        </div>
                        <button type="submit" className="btn-primary">登录</button>
                    </form>
                ) : (
                    <form className="auth-form" onSubmit={handleRegister}>
                        <div className="form-group">
                            <label>用户名</label>
                            <input value={regUser} onChange={(e) => setRegUser(e.target.value)} required />
                        </div>
                        <div className="form-group">
                            <label>邮箱</label>
                            <input type="email" value={regEmail} onChange={(e) => setRegEmail(e.target.value)} />
                        </div>
                        <div className="form-group">
                            <label>密码</label>
                            <input type="password" value={regPwd} onChange={(e) => setRegPwd(e.target.value)} required />
                        </div>
                        <button type="submit" className="btn-primary">注册</button>
                    </form>
                )}

                {error && (
                    <div className="form-feedback" style={{ color: 'var(--danger)', textAlign: 'center' }}>
                        {error}
                    </div>
                )}
            </div>
        </div>
    );
}
