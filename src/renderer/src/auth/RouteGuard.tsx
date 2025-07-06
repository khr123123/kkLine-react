import { useUserStore } from '@renderer/store/useUserStore'
import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'

type Props = { children: React.ReactElement }
export const useIsAdmin = () => {
  const user = useUserStore((state) => state.user)
  return user?.userRole === 'admin'
}

export const RouteGuard: React.FC<Props> = ({ children }) => {
  const user = useUserStore((state) => state.user)
  const location = useLocation()
  const path = location.pathname
  // 1. 访问 /login 放行，不鉴权
  if (path === '/login') {
    return children
  }

  // 2. 访问 /admin 开头的路径，必须登录且角色是 admin
  if (path.startsWith('/admin')) {
    if (!user) {
      return <Navigate to="/login" replace state={{ from: location }} />
    }
    if (user.userRole !== 'admin') {
      return <Navigate to="/no-access" replace />
    }
    return children
  }

  // 3. 其他路径，必须登录，角色不限
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  // 4. 通过鉴权，放行
  return children
}
