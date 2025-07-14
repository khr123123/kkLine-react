// @ts-ignore
/* eslint-disable */
import request from '@renderer/http/request'

/** 删除消息 POST /chat/deleteMsg */
export async function delectMsg(body: API.RevokeMsgDto, options?: { [key: string]: any }) {
  return request<API.BaseResponseBoolean>('/chat/deleteMsg', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    data: body,
    ...(options || {})
  })
}

/** 撤回消息 POST /chat/revokeMsg */
export async function revokeMsg(body: API.RevokeMsgDto, options?: { [key: string]: any }) {
  return request<API.BaseResponseBoolean>('/chat/revokeMsg', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    data: body,
    ...(options || {})
  })
}

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

/** 发送输入状态（true=正在输入，false=已停止） GET /chat/typingState */
export async function sendTypingState(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.sendTypingStateParams,
  options?: { [key: string]: any }
) {
  return request<API.BaseResponseBoolean>('/chat/typingState', {
    method: 'GET',
    params: {
      ...params
    },
    ...(options || {})
  })
}
