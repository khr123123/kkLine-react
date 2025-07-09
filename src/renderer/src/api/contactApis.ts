// @ts-ignore
/* eslint-disable */
import request from '@renderer/http/request'

/** 断绝联系关系(拉黑或删除好友/退出群) 拉黑或删除好友，或退出群组 POST /contact/delContact */
export async function delContact(body: API.ContactDelRequest, options?: { [key: string]: any }) {
  return request<API.BaseResponseBoolean>('/contact/delContact', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    data: body,
    ...(options || {})
  })
}

/** 分段查询所有联系人 POST /contact/loadAllFriend */
export async function loadAllFriend(body: API.FriendListRequest, options?: { [key: string]: any }) {
  return request<API.BaseResponseListFriendItemDTO>('/contact/loadAllFriend', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    data: body,
    ...(options || {})
  })
}

/** 查询所有所有群组 POST /contact/loadAllGroup */
export async function loadAllGroup(options?: { [key: string]: any }) {
  return request<API.BaseResponseListContactVO>('/contact/loadAllGroup', {
    method: 'POST',
    ...(options || {})
  })
}

/** 搜索联系人（好友或群） 根据联系人ID搜索好友或群信息 POST /contact/search */
export async function search(body: API.ContactQueryRequest, options?: { [key: string]: any }) {
  return request<API.BaseResponseContactVO>('/contact/search', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    data: body,
    ...(options || {})
  })
}
