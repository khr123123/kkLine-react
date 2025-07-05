// @ts-ignore
/* eslint-disable */
import request from '@renderer/http/request'

/** 发送带文件的消息 POST /chat/sendFileMessage */
export async function sendFileMessage(
  body: {
    chatSendFileRequest?: API.ChatSendFileRequest
  },
  options?: { [key: string]: any }
) {
  return request<API.BaseResponseMessageSendDTO>('/chat/sendFileMessage', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    data: body,
    ...(options || {})
  })
}

/** 发送消息接口 POST /chat/sendMsg */
export async function sendMsg(body: API.ChatSendRequest, options?: { [key: string]: any }) {
  return request<API.BaseResponseMessageSendDTO>('/chat/sendMsg', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    data: body,
    ...(options || {})
  })
}
