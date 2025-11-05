// @ts-ignore
/* eslint-disable */
import request from '../http/request'

/** 此处后端没有提供注释 POST /comment/addPlaylistComment */
export async function addPlaylistComment(
  body: API.CommentPlaylistDTO,
  options?: { [key: string]: any }
) {
  return request<API.BaseResponse>('/comment/addPlaylistComment', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    data: body,
    ...(options || {})
  })
}

/** 此处后端没有提供注释 POST /comment/addSongComment */
export async function addSongComment(body: API.CommentSongDTO, options?: { [key: string]: any }) {
  return request<API.BaseResponse>('/comment/addSongComment', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    data: body,
    ...(options || {})
  })
}

/** 此处后端没有提供注释 PATCH /comment/cancelLikeComment/${param0} */
export async function cancelLikeComment(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.cancelLikeCommentParams,
  options?: { [key: string]: any }
) {
  const { id: param0, ...queryParams } = params
  return request<API.BaseResponse>(`/comment/cancelLikeComment/${param0}`, {
    method: 'PATCH',
    params: { ...queryParams },
    ...(options || {})
  })
}

/** 此处后端没有提供注释 DELETE /comment/deleteComment/${param0} */
export async function deleteComment(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.deleteCommentParams,
  options?: { [key: string]: any }
) {
  const { id: param0, ...queryParams } = params
  return request<API.BaseResponse>(`/comment/deleteComment/${param0}`, {
    method: 'DELETE',
    params: { ...queryParams },
    ...(options || {})
  })
}

/** 此处后端没有提供注释 PATCH /comment/likeComment/${param0} */
export async function likeComment(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.likeCommentParams,
  options?: { [key: string]: any }
) {
  const { id: param0, ...queryParams } = params
  return request<API.BaseResponse>(`/comment/likeComment/${param0}`, {
    method: 'PATCH',
    params: { ...queryParams },
    ...(options || {})
  })
}
