// @ts-ignore
/* eslint-disable */
import request from '../http/request'

/** 此处后端没有提供注释 POST /artist/getAllArtists */
export async function getAllArtists(body: API.ArtistDTO, options?: { [key: string]: any }) {
  return request<API.BaseResponsePageArtistVO>('/artist/getAllArtists', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    data: body,
    ...(options || {})
  })
}

/** 此处后端没有提供注释 GET /artist/getArtistDetail/${param0} */
export async function getArtistDetail(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.getArtistDetailParams,
  options?: { [key: string]: any }
) {
  const { id: param0, ...queryParams } = params
  return request<API.BaseResponseArtistDetailVO>(`/artist/getArtistDetail/${param0}`, {
    method: 'GET',
    params: { ...queryParams },
    ...(options || {})
  })
}

/** 此处后端没有提供注释 GET /artist/getRandomArtists */
export async function getRandomArtists(options?: { [key: string]: any }) {
  return request<API.BaseResponseListArtistVO>('/artist/getRandomArtists', {
    method: 'GET',
    ...(options || {})
  })
}
