// @ts-ignore
/* eslint-disable */
import request from '@renderer/http/request'

/** 新增广告种类 POST /admin/adCategory/add */
export async function addAd(body: API.AdCategory, options?: { [key: string]: any }) {
  return request<API.BaseResponseBoolean>('/admin/adCategory/add', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    data: body,
    ...(options || {})
  })
}

/** 删除广告种类（逻辑删除） DELETE /admin/adCategory/delete/${param0} */
export async function deleteAd(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.deleteAdParams,
  options?: { [key: string]: any }
) {
  const { id: param0, ...queryParams } = params
  return request<API.BaseResponseBoolean>(`/admin/adCategory/delete/${param0}`, {
    method: 'DELETE',
    params: { ...queryParams },
    ...(options || {})
  })
}

/** 获取广告种类列表 GET /admin/adCategory/list */
export async function listAd(options?: { [key: string]: any }) {
  return request<API.BaseResponseListAdCategory>('/admin/adCategory/list', {
    method: 'GET',
    ...(options || {})
  })
}

/** 管理员发布广告 POST /admin/adCategory/pushAd */
export async function publicAd(body: API.PushAdRequest, options?: { [key: string]: any }) {
  return request<API.BaseResponseBoolean>('/admin/adCategory/pushAd', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    data: body,
    ...(options || {})
  })
}
