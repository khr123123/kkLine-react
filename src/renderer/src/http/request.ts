// src/utils/request.ts
import { useUserStore } from '../store/useUserStore'
import { message } from 'antd'
import axios, { AxiosInstance } from 'axios'

// 创建 axios 实例
const request: AxiosInstance = axios.create({
    baseURL: "http://127.0.0.1:8080/api",
    timeout: 50000,
    withCredentials: true,
})

// 请求拦截器
request.interceptors.request.use(
    (config) => {
        const user = useUserStore.getState().user // 注意这里改成非 Hook 方式
        if (user && user.token && config.headers) {
            config.headers.Authorization = `${user.token}`
        }
        return config
    },
    (error) => {
        return Promise.reject(error)
    }
)

// 响应拦截器
request.interceptors.response.use(
    (response) => {
        const res = response.data
        if (res.code && res.code == 401) {
            message.error(res.message)
            return Promise.reject(new Error(res.message || 'Error'))
        } else {
            return res
        }
    },
    (error) => {
        return Promise.reject(error)
    }
)

export default request
