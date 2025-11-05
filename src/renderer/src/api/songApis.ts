// @ts-ignore
/* eslint-disable */
import request from '../http/request'

/** 此处后端没有提供注释 POST /song/getAllSongs */
export async function getAllSongs(body: API.SongDTO, options?: { [key: string]: any }) {
  return request<API.BaseResponsePageSongVO>('/song/getAllSongs', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    data: body,
    ...(options || {})
  })
}

/** 此处后端没有提供注释 GET /song/getRecommendedSongs */
export async function getRecommendedSongs(options?: { [key: string]: any }) {
  return request<API.BaseResponseListSongVO>('/song/getRecommendedSongs', {
    method: 'GET',
    ...(options || {})
  })
}

/** 此处后端没有提供注释 GET /song/getSongDetail/${param0} */
export async function getSongDetail(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.getSongDetailParams,
  options?: { [key: string]: any }
) {
  const { id: param0, ...queryParams } = params
  return request<API.BaseResponseSongDetailVO>(`/song/getSongDetail/${param0}`, {
    method: 'GET',
    params: { ...queryParams },
    ...(options || {})
  })
}
