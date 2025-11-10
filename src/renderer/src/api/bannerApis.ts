// @ts-ignore
/* eslint-disable */
import request from '../http/request'

/** 添加轮播图 上传并添加新的轮播图 POST /banner/admin/addBanner */
export async function addBanner(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.addBannerParams,
  body: {},
  options?: { [key: string]: any }
) {
  return request<API.BaseResponse>('/banner/admin/addBanner', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    params: {
      ...params
    },
    data: body,
    ...(options || {})
  })
}

/** 删除轮播图 根据ID删除指定轮播图 DELETE /banner/admin/deleteBanner/${param0} */
export async function deleteBanner(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.deleteBannerParams,
  options?: { [key: string]: any }
) {
  const { id: param0, ...queryParams } = params
  return request<API.BaseResponse>(`/banner/admin/deleteBanner/${param0}`, {
    method: 'DELETE',
    params: { ...queryParams },
    ...(options || {})
  })
}

/** 批量删除轮播图 批量删除多个轮播图 DELETE /banner/admin/deleteBanners */
export async function deleteBanners(body: string, options?: { [key: string]: any }) {
  return request<API.BaseResponse>('/banner/admin/deleteBanners', {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json'
    },
    data: body,
    ...(options || {})
  })
}

/** 获取轮播图列表 管理员端获取所有轮播图的分页列表 POST /banner/admin/getAllBanners */
export async function getAllBanners(body: API.BannerDTO, options?: { [key: string]: any }) {
  return request<API.BaseResponse>('/banner/admin/getAllBanners', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    data: body,
    ...(options || {})
  })
}

/** 更新轮播图 根据ID更新指定轮播图 PATCH /banner/admin/updateBanner/${param0} */
export async function updateBanner(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.updateBannerParams,
  body: {},
  options?: { [key: string]: any }
) {
  const { id: param0, ...queryParams } = params
  return request<API.BaseResponse>(`/banner/admin/updateBanner/${param0}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json'
    },
    params: {
      ...queryParams
    },
    data: body,
    ...(options || {})
  })
}

/** 更新轮播图状态 启用或禁用指定轮播图 PATCH /banner/admin/updateBannerStatus/${param0} */
export async function updateBannerStatus(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.updateBannerStatusParams,
  options?: { [key: string]: any }
) {
  const { id: param0, ...queryParams } = params
  return request<API.BaseResponse>(`/banner/admin/updateBannerStatus/${param0}`, {
    method: 'PATCH',
    params: {
      ...queryParams
    },
    ...(options || {})
  })
}

/** 获取轮播图列表（用户端） 用户端获取启用的轮播图列表 GET /banner/getBannerList */
export async function getBannerList(options?: { [key: string]: any }) {
  return request<API.BaseResponse>('/banner/getBannerList', {
    method: 'GET',
    ...(options || {})
  })
}
