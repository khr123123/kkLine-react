// @ts-ignore
/* eslint-disable */
import request from '@renderer/http/request'

/** 此处后端没有提供注释 POST /callback */
export async function handleCallback(options?: { [key: string]: any }) {
  return request<API.BaseResponseMessageSendDTO>('/callback', {
    method: 'POST',
    ...(options || {})
  })
}
