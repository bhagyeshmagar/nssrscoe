import axios from 'axios';
import type { AxiosInstance, AxiosResponse, AxiosRequestConfig } from 'axios';
import { useAuthStore } from '../../stores/authStore';
import type { ApiResponse } from '../types/response';

export type { ApiResponse, PaginatedResponse } from '../types/response';

let rawApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
rawApiUrl = rawApiUrl.replace(/\/+$/, '');
if (!rawApiUrl.endsWith('/api')) {
    rawApiUrl = `${rawApiUrl}/api`;
}
export const API_BASE_URL = rawApiUrl;
export const UPLOAD_BASE_URL = API_BASE_URL.replace(/\/api$/, '');

interface CustomAxiosInstance extends Omit<AxiosInstance, 'get' | 'post' | 'put' | 'patch' | 'delete'> {
    // T has no default — callers must be explicit, preventing silent `any` returns.
    get<T, R = AxiosResponse<ApiResponse<T>>, D = any>(url: string, config?: AxiosRequestConfig<D>): Promise<R>;
    post<T = any, R = AxiosResponse<ApiResponse<T>>, D = any>(url: string, data?: D, config?: AxiosRequestConfig<D>): Promise<R>;
    put<T = any, R = AxiosResponse<ApiResponse<T>>, D = any>(url: string, data?: D, config?: AxiosRequestConfig<D>): Promise<R>;
    patch<T = any, R = AxiosResponse<ApiResponse<T>>, D = any>(url: string, data?: D, config?: AxiosRequestConfig<D>): Promise<R>;
    delete<T = any, R = AxiosResponse<ApiResponse<T>>, D = any>(url: string, config?: AxiosRequestConfig<D>): Promise<R>;
}

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: { 'Content-Type': 'application/json' },
}) as CustomAxiosInstance;

api.interceptors.request.use((config) => {
    const token = useAuthStore.getState().token;
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            useAuthStore.getState().clearAuth();
            if (window.location.pathname !== '/login') {
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export const decodeToken = (token: string): { id: number; role: 'admin' | 'superadmin' | 'volunteer'; isSuperadmin?: boolean; username?: string; email?: string } | null => {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
            atob(base64).split('').map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')
        );
        return JSON.parse(jsonPayload);
    } catch { return null; }
};

// Protocol-relative URLs (//example.com), blob:, data: all correctly bypass prefix.
const isAbsoluteUrl = (path: string) => /^(https?:)?\/\/|^(blob|data):/.test(path);

export const uploadAPI = {
    uploadFile: async (file: File): Promise<{ url: string }> => {
        const formData = new FormData();
        formData.append('file', file);
        const response = await api.post<{ url: string }>('/upload/single', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data.data;
    },
    uploadMultiple: async (files: File[]): Promise<{ files: { url: string }[] }> => {
        const formData = new FormData();
        files.forEach(file => formData.append('files', file));
        const response = await api.post<{ files: { url: string }[] }>('/upload/multiple', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data.data;
    },
    deleteFile: async (url: string): Promise<void> => {
        if (!url || !url.startsWith('/uploads/')) return;
        const filename = url.replace('/uploads/', '');
        await api.delete(`/upload/${filename}`);
    },
    getFullUrl: (path: string) => {
        if (!path) return '';
        if (isAbsoluteUrl(path)) return path;
        return `${UPLOAD_BASE_URL}${path}`;
    },
};

export default api;
