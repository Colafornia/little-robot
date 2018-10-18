import axios from 'axios';
const config = require('../config');
const Instance = axios.create({
    baseURL: `http://localhost:${config.port}/api`,
    // timeout: 3000,
    headers: {
        post: {
            'Content-Type': 'application/json',
        }
    }
});

// http request 拦截器
Instance.interceptors.request.use(
    (config) => {
        // jwt 验证
        const token = config.token;
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`
        }
        return config;
    },
    error => {
        return Promise.reject(error);
    }
);

export default Instance;
