// @ts-ignore
/* eslint-disable */
import request from '../http/request'

/** 获取所有歌单 根据条件分页获取所有歌单列表 POST /playlist/getAllPlaylists */
export async function getAllPlaylists(body: API.PlaylistDTO, options?: { [key: string]: any }) {
  return request<API.BaseResponse>('/playlist/getAllPlaylists', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    data: body,
    ...(options || {})
  })
}

/** 获取歌单详情 根据歌单ID获取歌单详细信息 GET /playlist/getPlaylistDetail/${param0} */
export async function getPlaylistDetail(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.getPlaylistDetailParams,
  options?: { [key: string]: any }
) {
  const { id: param0, ...queryParams } = params
  return request<API.BaseResponse>(`/playlist/getPlaylistDetail/${param0}`, {
    method: 'GET',
    params: { ...queryParams },
    ...(options || {})
  })
}

/** 获取推荐歌单 根据用户偏好获取推荐歌单列表 GET /playlist/getRecommendedPlaylists */
export async function getRecommendedPlaylists(options?: { [key: string]: any }) {
  return request<API.BaseResponse>('/playlist/getRecommendedPlaylists', {
    method: 'GET',
    ...(options || {})
  })
}
