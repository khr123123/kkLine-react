// @ts-ignore
/* eslint-disable */
import request from '@renderer/http/request'

/** 添加成员 群主邀请用户加入群聊 POST /group/addMember */
export async function addMember(body: API.GroupAddMemberRequest, options?: { [key: string]: any }) {
  return request<API.BaseResponseBoolean>('/group/addMember', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    data: body,
    ...(options || {})
  })
}

/** 解散群聊 群主或管理员解散群聊 POST /group/delGroup */
export async function delGroup(body: API.GroupRemoveRequest, options?: { [key: string]: any }) {
  return request<API.BaseResponseBoolean>('/group/delGroup', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    data: body,
    ...(options || {})
  })
}

/** 编辑群聊 群主或管理员修改群聊信息 POST /group/editGroup */
export async function editGroup(body: API.GroupEditRequest, options?: { [key: string]: any }) {
  return request<API.BaseResponseBoolean>('/group/editGroup', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    data: body,
    ...(options || {})
  })
}

/** 创建群聊 创建一个新的群聊 POST /group/genGroup */
export async function genGroup(body: API.GroupCreateRequest, options?: { [key: string]: any }) {
  return request<API.BaseResponseString>('/group/genGroup', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    data: body,
    ...(options || {})
  })
}

/** 获取群聊详情（成员数） 获取群聊基本信息，包括成员总数 POST /group/getGroupInfo */
export async function getGroupInfo(body: API.GroupInfoRequest, options?: { [key: string]: any }) {
  return request<API.BaseResponseGroupVO>('/group/getGroupInfo', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    data: body,
    ...(options || {})
  })
}

/** 获取群聊详情（成员详情） 获取群聊详细信息及其成员列表 POST /group/getGroupInfoWithMembers */
export async function getGroupInfoWithMembers(
  body: API.GroupInfoRequest,
  options?: { [key: string]: any }
) {
  return request<API.BaseResponseGroupVO>('/group/getGroupInfoWithMembers', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    data: body,
    ...(options || {})
  })
}

/** 踢出成员 群主踢出指定成员 POST /group/kickMember */
export async function kickMember(body: API.GroupKickRequest, options?: { [key: string]: any }) {
  return request<API.BaseResponseBoolean>('/group/kickMember', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    data: body,
    ...(options || {})
  })
}

/** 分页获取群聊 管理员分页获取群聊列表 POST /group/list/page */
export async function listGroupByPage(
  body: API.GroupQueryRequest,
  options?: { [key: string]: any }
) {
  return request<API.BaseResponsePageGroupVO>('/group/list/page', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    data: body,
    ...(options || {})
  })
}

/** 查询我的群聊 查询我拥有的所有群聊 POST /group/listMyGroups */
export async function listMyGroups(body: API.GroupQueryRequest, options?: { [key: string]: any }) {
  return request<API.BaseResponseListGroup>('/group/listMyGroups', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    data: body,
    ...(options || {})
  })
}
