// @ts-ignore
/* eslint-disable */
import request from '../http/request'

/** 获取所有歌手列表 根据条件分页获取歌手列表信息 POST /artist/getAllArtists */
export async function getAllArtists(body: API.ArtistDTO, options?: { [key: string]: any }) {
  return request<API.BaseResponse>('/artist/getAllArtists', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    data: body,
    ...(options || {})
  })
}

/** 获取歌手详情 根据歌手ID获取歌手详细信息 GET /artist/getArtistDetail/${param0} */
export async function getArtistDetail(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.getArtistDetailParams,
  options?: { [key: string]: any }
) {
  const { id: param0, ...queryParams } = params
  return request<API.BaseResponse>(`/artist/getArtistDetail/${param0}`, {
    method: 'GET',
    params: { ...queryParams },
    ...(options || {})
  })
}

/** 获取随机歌手 随机获取10个歌手信息 GET /artist/getRandomArtists */
export async function getRandomArtists(options?: { [key: string]: any }) {
  return request<API.BaseResponse>('/artist/getRandomArtists', {
    method: 'GET',
    ...(options || {})
  })
}
