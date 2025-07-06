// src/utils/request.ts
import { useUserStore } from '@renderer/store/useUserStore'
import { message } from 'antd'
import axios, { AxiosInstance } from 'axios'

// 创建 axios 实例
const request: AxiosInstance = axios.create({
    baseURL: "http://127.0.0.1:8080/api", // 接口基础地址，可在 .env 里配置
    timeout: 50000, // 请求超时时间，单位 ms
    withCredentials: true, // 跨域请求时是否携带凭证（cookie）
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
        // 请求错误处理
        return Promise.reject(error)
    }
)

// 响应拦截器
request.interceptors.response.use(
    (response) => {
        // 一般后端接口规范返回数据格式统一，直接返回 data
        const res = response.data
        // 可以根据后端实际情况判断返回 code，错误时 reject
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
