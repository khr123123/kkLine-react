// @ts-ignore
/* eslint-disable */
import request from '../http/request'

/** 此处后端没有提供注释 POST /admin/addBanner */
export async function addBanner(body: {}, options?: { [key: string]: any }) {
  return request<API.BaseResponse>('/admin/addBanner', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    data: body,
    ...(options || {})
  })
}

/** 此处后端没有提供注释 DELETE /admin/deleteBanner/${param0} */
export async function deleteBanner(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.deleteBannerParams,
  options?: { [key: string]: any }
) {
  const { id: param0, ...queryParams } = params
  return request<API.BaseResponse>(`/admin/deleteBanner/${param0}`, {
    method: 'DELETE',
    params: { ...queryParams },
    ...(options || {})
  })
}

/** 此处后端没有提供注释 DELETE /admin/deleteBanners */
export async function deleteBanners(body: number[], options?: { [key: string]: any }) {
  return request<API.BaseResponse>('/admin/deleteBanners', {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json'
    },
    data: body,
    ...(options || {})
  })
}

/** 此处后端没有提供注释 POST /admin/getAllBanners */
export async function getAllBanners(body: API.BannerDTO, options?: { [key: string]: any }) {
  return request<API.BaseResponsePageMusicBanner>('/admin/getAllBanners', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    data: body,
    ...(options || {})
  })
}

/** 此处后端没有提供注释 PATCH /admin/updateBanner/${param0} */
export async function updateBanner(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.updateBannerParams,
  body: {},
  options?: { [key: string]: any }
) {
  const { id: param0, ...queryParams } = params
  return request<API.BaseResponse>(`/admin/updateBanner/${param0}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json'
    },
    params: { ...queryParams },
    data: body,
    ...(options || {})
  })
}

/** 此处后端没有提供注释 PATCH /admin/updateBannerStatus/${param0} */
export async function updateBannerStatus(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.updateBannerStatusParams,
  options?: { [key: string]: any }
) {
  const { id: param0, ...queryParams } = params
  return request<API.BaseResponse>(`/admin/updateBannerStatus/${param0}`, {
    method: 'PATCH',
    params: {
      ...queryParams
    },
    ...(options || {})
  })
}

/** 此处后端没有提供注释 GET /banner/getBannerList */
export async function getBannerList(options?: { [key: string]: any }) {
  return request<API.BaseResponseListBannerVO>('/banner/getBannerList', {
    method: 'GET',
    ...(options || {})
  })
}
