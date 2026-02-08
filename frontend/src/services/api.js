import axios from 'axios';

const API_URL = 'http://127.0.0.1:5000/api/v1';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add a request interceptor to add the auth token to headers
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

export const login = async (email, password) => {
    const response = await api.post('/users/login', { email, password });
    return response.data;
};

export const register = async (username, email, password) => {
    const response = await api.post('/users/register', { username, email, password });
    return response.data;
};

export const getLeaderboard = async () => {
    const response = await api.get('/retrieve_leaderboard');
    return response.data;
};

export const getAttendanceHistory = async () => {
    const response = await api.get('/attendance_history');
    return response.data;
};

export const logAttendance = async (module_code, image_id) => {
    const response = await api.post('/log_attendance', { module_code, image_id });
    return response.data;
};

export const uploadImage = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/images/upload', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return response.data;
};

export const joinModule = async (module_code) => {
    const response = await api.post('/join_module', { module_code });
    return response.data;
};

export const getModules = async () => {
    const response = await api.get('/modules');
    return response.data;
};

export const getAttendanceCount = async () => {
    const response = await api.get('/count_attendance');
    return response.data;
}

export default api;
