// @ts-ignore
/* eslint-disable */
import request from '../http/request'

/** 此处后端没有提供注释 GET /ai/history/${param0} */
export async function getHistoryChatList(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.getHistoryChatListParams,
  options?: { [key: string]: any }
) {
  const { type: param0, ...queryParams } = params
  return request<API.AiSession[]>(`/ai/history/${param0}`, {
    method: 'GET',
    params: { ...queryParams },
    ...(options || {})
  })
}

/** 此处后端没有提供注释 GET /ai/history/${param0}/${param1} */
export async function getHistoryChatDetail(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.getHistoryChatDetailParams,
  options?: { [key: string]: any }
) {
  const { type: param0, sessionId: param1, ...queryParams } = params
  return request<API.Message[]>(`/ai/history/${param0}/${param1}`, {
    method: 'GET',
    params: { ...queryParams },
    ...(options || {})
  })
}

/** 此处后端没有提供注释 GET /ai/simple/chat */
export async function aiChat(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.aiChatParams,
  options?: { [key: string]: any }
) {
  return request<string>('/ai/simple/chat', {
    method: 'GET',
    params: {
      ...params
    },
    ...(options || {})
  })
}
