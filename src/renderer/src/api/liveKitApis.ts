// @ts-ignore
/* eslint-disable */
import request from '../http/request'

/** 创建房间获取token POST /livekit/token */
export async function createToken(body: API.CreateRoomRequest, options?: { [key: string]: any }) {
  return request<API.BaseResponseMapStringString>('/livekit/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    data: body,
    ...(options || {})
  })
}
