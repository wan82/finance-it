// 受保护路由：未登录直接重定向到 /login
import { Navigate } from 'react-router-dom';
import { isLoggedIn } from '../api/auth.js';

export default function ProtectedRoute({ children }) {
    if (!isLoggedIn()) {
        return <Navigate to="/login" replace />;
    }
    return children;
}
