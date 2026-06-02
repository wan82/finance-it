// 统一请求层：包装 fetch，自动带 JWT、统一错误处理
import { API_ORIGIN } from '../config.js';

const TOKEN_KEY = 'financeit_token';

export function getToken() {
    return localStorage.getItem(TOKEN_KEY);
}

export async function apiRequest(path, { method = 'GET', body } = {}) {
    const headers = { 'Content-Type': 'application/json' };
    const token = getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${API_ORIGIN}${path}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
    });

    if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `请求失败：${res.status}`);
    }
    if (res.status === 204) return null; // DELETE 无响应体
    return res.json();
}
