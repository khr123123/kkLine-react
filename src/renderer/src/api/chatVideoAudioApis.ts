// @ts-ignore
/* eslint-disable */
import request from '../http/request'

/** 发送Answer响应 POST /chatVideoAudio/sendAnswer */
export async function sendAnswer(
  body: API.ChatVideoAudioRequest,
  options?: { [key: string]: any }
) {
  return request<API.BaseResponseMessageSendDTO>('/chatVideoAudio/sendAnswer', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    data: body,
    ...(options || {})
  })
}

/** 交换 ICE Candidate POST /chatVideoAudio/sendIce */
export async function sendIce(body: API.ChatVideoAudioRequest, options?: { [key: string]: any }) {
  return request<API.BaseResponseMessageSendDTO>('/chatVideoAudio/sendIce', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    data: body,
    ...(options || {})
  })
}

/** 发送视频/语音通话请求（Offer） POST /chatVideoAudio/sendOffer */
export async function sendOffer(body: API.ChatVideoAudioRequest, options?: { [key: string]: any }) {
  return request<API.BaseResponseMessageSendDTO>('/chatVideoAudio/sendOffer', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    data: body,
    ...(options || {})
  })
}
