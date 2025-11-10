// @ts-ignore
/* eslint-disable */
import request from '../http/request'

/** 取消收藏歌单 从用户收藏列表中移除指定歌单 DELETE /favorite/cancelCollectPlaylist */
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

/** 取消收藏歌曲 从用户收藏列表中移除指定歌曲 DELETE /favorite/cancelCollectSong */
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

/** 收藏歌单 将指定歌单添加到用户收藏列表 POST /favorite/collectPlaylist */
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

/** 收藏歌曲 将指定歌曲添加到用户收藏列表 POST /favorite/collectSong */
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

/** 获取用户收藏的歌单列表 分页获取当前用户收藏的歌单列表 POST /favorite/getFavoritePlaylists */
export async function getFavoritePlaylists(
  body: API.PlaylistDTO,
  options?: { [key: string]: any }
) {
  return request<API.BaseResponse>('/favorite/getFavoritePlaylists', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    data: body,
    ...(options || {})
  })
}

/** 获取用户收藏的歌曲列表 分页获取当前用户收藏的歌曲列表 POST /favorite/getFavoriteSongs */
export async function getUserFavoriteSongs(body: API.SongDTO, options?: { [key: string]: any }) {
  return request<API.BaseResponse>('/favorite/getFavoriteSongs', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    data: body,
    ...(options || {})
  })
}
