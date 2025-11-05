// @ts-ignore
/* eslint-disable */
import request from '../http/request'

/** 此处后端没有提供注释 POST /playlist/getAllPlaylists */
export async function getAllPlaylists(body: API.PlaylistDTO, options?: { [key: string]: any }) {
  return request<API.BaseResponsePagePlaylistVO>('/playlist/getAllPlaylists', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    data: body,
    ...(options || {})
  })
}

/** 此处后端没有提供注释 GET /playlist/getPlaylistDetail/${param0} */
export async function getPlaylistDetail(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.getPlaylistDetailParams,
  options?: { [key: string]: any }
) {
  const { id: param0, ...queryParams } = params
  return request<API.BaseResponsePlaylistDetailVO>(`/playlist/getPlaylistDetail/${param0}`, {
    method: 'GET',
    params: { ...queryParams },
    ...(options || {})
  })
}

/** 此处后端没有提供注释 GET /playlist/getRecommendedPlaylists */
export async function getRandomPlaylists(options?: { [key: string]: any }) {
  return request<API.BaseResponseListPlaylistVO>('/playlist/getRecommendedPlaylists', {
    method: 'GET',
    ...(options || {})
  })
}
