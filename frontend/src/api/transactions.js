// 交易相关 API
import { apiRequest } from './client.js';

export const listTransactions = () => apiRequest('/api/transactions');

export const createTransaction = (t) =>
    apiRequest('/api/transactions', { method: 'POST', body: t });

export const updateTransaction = (id, t) =>
    apiRequest(`/api/transactions/${id}`, { method: 'PUT', body: t });

export const deleteTransaction = (id) =>
    apiRequest(`/api/transactions/${id}`, { method: 'DELETE' });

export const getSummary = (year) =>
    apiRequest(`/api/transactions/summary?year=${year}`);

export const importCSV = (rows) =>
    apiRequest('/api/transactions/import', { method: 'POST', body: { rows } });

export const bulkDelete = (filters) =>
    apiRequest('/api/transactions/bulk-delete', { method: 'POST', body: filters });
