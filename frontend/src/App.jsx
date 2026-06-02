// 路由配置：根据 URL 决定渲染哪个页面组件
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Transactions from './pages/Transactions.jsx';
import Import from './pages/Import.jsx';
import DeletePage from './pages/Delete.jsx';
import Profile from './pages/Profile.jsx';

export default function App() {
    return (
        <Routes>
            {/* 公开路由 */}
            <Route path="/login" element={<Login />} />

            {/* 受保护路由：用 ProtectedRoute 包一层，未登录会被踢回 /login */}
            <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/transactions" element={<ProtectedRoute><Transactions /></ProtectedRoute>} />
            <Route path="/import" element={<ProtectedRoute><Import /></ProtectedRoute>} />
            <Route path="/delete" element={<ProtectedRoute><DeletePage /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />

            {/* 兜底：未知 URL 跳回首页 */}
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}
