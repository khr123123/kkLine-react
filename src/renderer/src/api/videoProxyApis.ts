// @ts-ignore
/* eslint-disable */
import request from '../http/request'

/** 获取分类列表 从门户API获取所有视频分类 GET /video/categories */
export async function getCategories(options?: { [key: string]: any }) {
  return request<string>('/video/categories', {
    method: 'GET',
    ...(options || {})
  })
}

/** 健康检查 检查服务是否正常运行 GET /video/health */
export async function health(options?: { [key: string]: any }) {
  return request<string>('/video/health', {
    method: 'GET',
    ...(options || {})
  })
}

/** 视频代理接口 代理视频API请求,支持搜索、列表、详情等操作 GET /video/proxy */
export async function proxy(options?: { [key: string]: any }) {
  return request<string>('/video/proxy', {
    method: 'GET',
    ...(options || {})
  })
}

/** 获取视频源 获取所有可用的视频API源 GET /video/sources */
export async function getSources(options?: { [key: string]: any }) {
  return request<string>('/video/sources', {
    method: 'GET',
    ...(options || {})
  })
}

/** 视频流代理 代理视频流播放,解决跨域问题 GET /video/stream */
export async function streamProxy(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.streamProxyParams,
  options?: { [key: string]: any }
) {
  return request<any>('/video/stream', {
    method: 'GET',
    params: {
      ...params
    },
    ...(options || {})
  })
}
