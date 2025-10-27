// @ts-ignore
/* eslint-disable */
import request from '../http/request'

/** Ai简单调用 GET /ai/simple/chat */
export async function simpleChat(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.simpleChatParams,
  options?: { [key: string]: any }
) {
  return request<string>('/ai/simple/chat', {
    method: 'GET',
    params: {
      // query has a default value: 你好，很高兴认识你，能简单介绍一下自己吗？
      query: '你好，很高兴认识你，能简单介绍一下自己吗？',
      ...params
    },
    ...(options || {})
  })
}
