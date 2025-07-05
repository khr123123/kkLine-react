// src/utils/request.ts
import axios, { AxiosInstance, AxiosResponse } from 'axios'

// 创建 axios 实例
const request: AxiosInstance = axios.create({
    baseURL: process.env.REACT_APP_API_BASE_URL || '', // 接口基础地址，可在 .env 里配置
    timeout: 10000, // 请求超时时间，单位 ms
    withCredentials: true, // 跨域请求时是否携带凭证（cookie）
})

// 请求拦截器
request.interceptors.request.use(
    (config) => {
        // 这里可以添加请求头，比如携带 token
        const token = localStorage.getItem('token') // 或者从 zustand、redux 取
        if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`
        }
        return config
    },
    (error) => {
        // 请求错误处理
        return Promise.reject(error)
    }
)

// 响应拦截器
request.interceptors.response.use(
    (response: AxiosResponse) => {
        // 一般后端接口规范返回数据格式统一，直接返回 data
        const res = response.data
        // 可以根据后端实际情况判断返回 code，错误时 reject
        if (res.code && res.code !== 200) {
            // 比如 401 未登录，或者 403 无权限等
            if (res.code === 401) {
                // 处理未登录，跳登录页等
            }
            return Promise.reject(new Error(res.message || 'Error'))
        } else {
            return res
        }
    },
    (error) => {
        // 响应错误处理
        console.error('请求出错:', error)
        return Promise.reject(error)
    }
)

export default request
