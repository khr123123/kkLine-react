// @ts-ignore
/* eslint-disable */
import request from '@renderer/http/request'

/** 文件上传并且监听上传进度 POST /file/uploadFileWithProgressListener */
export async function uploadFile(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.uploadFileParams,
  body: {},
  options?: { [key: string]: any }
) {
  return request<API.BaseResponseObject>('/file/uploadFileWithProgressListener', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    params: {
      ...params,
      uploadFileRequest: undefined,
      ...params['uploadFileRequest']
    },
    data: body,
    ...(options || {})
  })
}
