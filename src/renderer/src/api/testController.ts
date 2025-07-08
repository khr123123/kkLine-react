// @ts-ignore
/* eslint-disable */
import request from '@renderer/http/request'

/** 此处后端没有提供注释 POST /test/testProgress */
export async function uploadFile(body: {}, options?: { [key: string]: any }) {
  return request<API.BaseResponseString>('/test/testProgress', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    data: body,
    ...(options || {})
  })
}
