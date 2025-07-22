// @ts-ignore
/* eslint-disable */
import request from '../http/request'

/** 添加用户（管理员权限） POST /user/add */
export async function addUser(body: API.UserAddRequest, options?: { [key: string]: any }) {
  return request<API.BaseResponseLong>('/user/add', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    data: body,
    ...(options || {})
  })
}

/** 删除用户（管理员权限） POST /user/delete */
export async function deleteUser(body: API.DeleteRequest, options?: { [key: string]: any }) {
  return request<API.BaseResponseBoolean>('/user/delete', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    data: body,
    ...(options || {})
  })
}

/** 根据ID查询用户（管理员权限） GET /user/get */
export async function getUserById(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.getUserByIdParams,
  options?: { [key: string]: any }
) {
  return request<API.BaseResponseUser>('/user/get', {
    method: 'GET',
    params: {
      ...params
    },
    ...(options || {})
  })
}

/** 获取当前登录用户信息 GET /user/get/login */
export async function getLoginUser(options?: { [key: string]: any }) {
  return request<API.BaseResponseUserVO>('/user/get/login', {
    method: 'GET',
    ...(options || {})
  })
}
// logoutService.ts（你可以放在主进程任意可导入的地方）
import axios from 'axios';

export async function logoutWithToken(token: string): Promise<void> {
  try {
    const response = await axios.post('http://127.0.0.1:8080/api/user/logout', {}, {
      headers: {
        Authorization: `${token}`,
        'Content-Type': 'application/json',
      },
      timeout: 50000,
      withCredentials: true,
    });

    console.log('登出成功:', response.data);
  } catch (error) {
    console.error('登出失败:', error);
  }
}
/** 根据用户ID获取用户视图对象 GET /user/get/vo */
export async function getUserVoById(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.getUserVOByIdParams,
  options?: { [key: string]: any }
) {
  return request<API.BaseResponseUserVO>('/user/get/vo', {
    method: 'GET',
    params: {
      ...params
    },
    ...(options || {})
  })
}

/** 发送邮箱验证码 根据邮箱地址发送验证码至用户邮箱 GET /user/getEmailCode */
export async function getRegisterEmailCode(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.getRegisterEmailCodeParams,
  options?: { [key: string]: any }
) {
  return request<API.BaseResponseMapStringString>('/user/getEmailCode', {
    method: 'GET',
    params: {
      ...params
    },
    ...(options || {})
  })
}

/** 分页查询用户（管理员权限） POST /user/list/page */
export async function listUserByPage(body: API.UserQueryRequest, options?: { [key: string]: any }) {
  return request<API.BaseResponsePageUser>('/user/list/page', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    data: body,
    ...(options || {})
  })
}

/** 分页查询用户（VO） POST /user/list/page/vo */
export async function listUserVoByPage(
  body: API.UserQueryRequest,
  options?: { [key: string]: any }
) {
  return request<API.BaseResponsePageUserVO>('/user/list/page/vo', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    data: body,
    ...(options || {})
  })
}

/** 邮箱验证码登录 通过邮箱验证码登录，返回用户信息和token POST /user/loginByEmail */
export async function loginByEmail(
  body: API.UserLoginByEmailRequest,
  options?: { [key: string]: any }
) {
  return request<API.BaseResponseLoginUserVO>('/user/loginByEmail', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    data: body,
    ...(options || {})
  })
}

/** 账号密码登录 通过账号和密码登录，返回用户信息和token POST /user/loginByPwd */
export async function loginByPwd(
  body: API.UserLoginByPwdRequest,
  options?: { [key: string]: any }
) {
  return request<API.BaseResponseLoginUserVO>('/user/loginByPwd', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    data: body,
    ...(options || {})
  })
}

/** 用户登出 当前登录用户登出 POST /user/logout */
export async function userLogout(options?: { [key: string]: any }) {
  return request<API.BaseResponseBoolean>('/user/logout', {
    method: 'POST',
    ...(options || {})
  })
}

/** 用户注册 根据请求体中的注册信息创建新用户 POST /user/register */
export async function userRegister(
  body: API.UserRegisterRequest,
  options?: { [key: string]: any }
) {
  return request<API.BaseResponseLong>('/user/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    data: body,
    ...(options || {})
  })
}

/** 更新用户信息（管理员权限） POST /user/update */
export async function updateUser(body: API.UserUpdateRequest, options?: { [key: string]: any }) {
  return request<API.BaseResponseBoolean>('/user/update', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    data: body,
    ...(options || {})
  })
}

/** 修改当前登录用户信息 POST /user/update/my */
export async function updateMyUser(
  body: API.UserUpdateMyRequest,
  options?: { [key: string]: any }
) {
  return request<API.BaseResponseBoolean>('/user/update/my', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    data: body,
    ...(options || {})
  })
}

/** 修改当前用户密码 POST /user/update/myPassword */
export async function updateMyPassword(
  body: API.UserUpdateMyPasswordRequest,
  options?: { [key: string]: any }
) {
  return request<API.BaseResponseBoolean>('/user/update/myPassword', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    data: body,
    ...(options || {})
  })
}
