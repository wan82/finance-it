import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Vite 配置：启用 React 插件（让它认识 JSX 语法）
export default defineConfig({
    plugins: [react()],
    server: {
        port: 5173, // 开发服务器端口（默认就是 5173）
    },
});
