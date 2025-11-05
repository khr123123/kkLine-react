// @ts-ignore
/* eslint-disable */
import request from '../http/request'

/** 此处后端没有提供注释 DELETE /favorite/cancelCollectPlaylist */
export async function cancelCollectPlaylist(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.cancelCollectPlaylistParams,
  options?: { [key: string]: any }
) {
  return request<API.BaseResponse>('/favorite/cancelCollectPlaylist', {
    method: 'DELETE',
    params: {
      ...params
    },
    ...(options || {})
  })
}

/** 此处后端没有提供注释 DELETE /favorite/cancelCollectSong */
export async function cancelCollectSong(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.cancelCollectSongParams,
  options?: { [key: string]: any }
) {
  return request<API.BaseResponse>('/favorite/cancelCollectSong', {
    method: 'DELETE',
    params: {
      ...params
    },
    ...(options || {})
  })
}

/** 此处后端没有提供注释 POST /favorite/collectPlaylist */
export async function collectPlaylist(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.collectPlaylistParams,
  options?: { [key: string]: any }
) {
  return request<API.BaseResponse>('/favorite/collectPlaylist', {
    method: 'POST',
    params: {
      ...params
    },
    ...(options || {})
  })
}

/** 此处后端没有提供注释 POST /favorite/collectSong */
export async function collectSong(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.collectSongParams,
  options?: { [key: string]: any }
) {
  return request<API.BaseResponse>('/favorite/collectSong', {
    method: 'POST',
    params: {
      ...params
    },
    ...(options || {})
  })
}

/** 此处后端没有提供注释 POST /favorite/getFavoritePlaylists */
export async function getFavoritePlaylists(
  body: API.PlaylistDTO,
  options?: { [key: string]: any }
) {
  return request<API.BaseResponsePagePlaylistVO>('/favorite/getFavoritePlaylists', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    data: body,
    ...(options || {})
  })
}

/** 此处后端没有提供注释 POST /favorite/getFavoriteSongs */
export async function getUserFavoriteSongs(body: API.SongDTO, options?: { [key: string]: any }) {
  return request<API.BaseResponsePageSongVO>('/favorite/getFavoriteSongs', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    data: body,
    ...(options || {})
  })
}
