// @ts-ignore
/* eslint-disable */
import request from '../http/request'

/** 获取所有歌曲 根据条件分页获取所有歌曲列表 POST /song/getAllSongs */
export async function getAllSongs(body: API.SongDTO, options?: { [key: string]: any }) {
  return request<API.BaseResponse>('/song/getAllSongs', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    data: body,
    ...(options || {})
  })
}

/** 获取推荐歌曲 获取20首推荐歌曲列表 GET /song/getRecommendedSongs */
export async function getRecommendedSongs(options?: { [key: string]: any }) {
  return request<API.BaseResponse>('/song/getRecommendedSongs', {
    method: 'GET',
    ...(options || {})
  })
}

/** 获取歌曲详情 根据歌曲ID获取歌曲详细信息 GET /song/getSongDetail/${param0} */
export async function getSongDetail(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.getSongDetailParams,
  options?: { [key: string]: any }
) {
  const { id: param0, ...queryParams } = params
  return request<API.BaseResponse>(`/song/getSongDetail/${param0}`, {
    method: 'GET',
    params: { ...queryParams },
    ...(options || {})
  })
}
