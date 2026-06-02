// 认证相关 API：注册、登录、注销账户
import { apiRequest } from './client.js';
import { APP_MODE } from '../config.js';

const AUTH_KEY = 'financeit_user';
const TOKEN_KEY = 'financeit_token';

export function getCurrentUser() {
    const raw = localStorage.getItem(AUTH_KEY);
    return raw ? JSON.parse(raw) : null;
}

export function isLoggedIn() {
    return getCurrentUser() !== null;
}

function saveSession(token, user) {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(AUTH_KEY, JSON.stringify(user));
}

export function clearSession() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(AUTH_KEY);
}

// 登录：根据 APP_MODE 自动分发到真实接口或模拟
export async function login(username, password) {
    if (APP_MODE === 'mock') {
        saveSession(null, { username, email: '' });
        return;
    }
    const data = await apiRequest('/api/auth/login', {
        method: 'POST',
        body: { username, password },
    });
    saveSession(data.token, data.user);
}

export async function register(username, email, password) {
    if (APP_MODE === 'mock') {
        saveSession(null, { username, email: email || '' });
        return;
    }
    const data = await apiRequest('/api/auth/register', {
        method: 'POST',
        body: { username, email, password },
    });
    saveSession(data.token, data.user);
}

// 注销账户：backend 模式先调后端删除用户及其数据，再清本地
export async function deleteAccount() {
    if (APP_MODE === 'backend') {
        await apiRequest('/api/users/me', { method: 'DELETE' });
    }
    clearSession();
}
