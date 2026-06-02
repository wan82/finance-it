// 顶部导航栏（所有受保护页面共用）
import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { getCurrentUser, clearSession } from '../api/auth.js';

export default function TopBar() {
    const user = getCurrentUser();
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);
    const menuRef = useRef(null);

    // 点击下拉菜单外面就关掉它
    useEffect(() => {
        function handleClickOutside(e) {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                setOpen(false);
            }
        }
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    function handleLogout() {
        clearSession();
        navigate('/login');
    }

    return (
        <header className="topbar">
            <div className="topbar-left">
                <Link to="/dashboard" className="brand">Finance It</Link>
                <nav className="nav-links">
                    <NavLink to="/dashboard" className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}>
                        数据看板
                    </NavLink>
                    <NavLink to="/transactions" className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}>
                        交易记录
                    </NavLink>
                    <NavLink to="/import" className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}>
                        批量导入记录
                    </NavLink>
                    <NavLink to="/delete" className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}>
                        删除记录
                    </NavLink>
                </nav>
            </div>

            <div className="user-menu" ref={menuRef}>
                <button
                    className="user-trigger"
                    onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}
                >
                    <span>{user ? `你好，${user.username}` : ''}</span>
                    <span className="caret">▾</span>
                </button>
                <div className={'user-dropdown' + (open ? ' open' : '')}>
                    <Link to="/profile" className="dropdown-item" onClick={() => setOpen(false)}>
                        用户信息
                    </Link>
                    <button className="dropdown-item" onClick={handleLogout}>登出</button>
                </div>
            </div>
        </header>
    );
}
