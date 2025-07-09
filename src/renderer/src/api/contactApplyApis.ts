// @ts-ignore
/* eslint-disable */
import request from '@renderer/http/request'

/** 申请添加好友或加入群组 发起好友或群组的申请请求 POST /contactApply/applyAdd */
export async function applyAdd(body: API.ApplyRequest, options?: { [key: string]: any }) {
  return request<API.BaseResponseLong>('/contactApply/applyAdd', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    data: body,
    ...(options || {})
  })
}

/** 处理好友或群组申请 接受或拒绝好友或群组的申请请求 POST /contactApply/dealWithApply */
export async function dealWithApply(
  body: API.ApplyDealWithRequest,
  options?: { [key: string]: any }
) {
  return request<API.BaseResponseBoolean>('/contactApply/dealWithApply', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    data: body,
    ...(options || {})
  })
}

/** 加载收到的好友或群组申请 分页查询当前用户收到的申请记录 POST /contactApply/loadApply */
export async function loadApply(body: API.ApplyQueryRequest, options?: { [key: string]: any }) {
  return request<API.BaseResponsePageContactApplyVO>('/contactApply/loadApply', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    data: body,
    ...(options || {})
  })
}
