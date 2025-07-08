import { useUserStore } from '@renderer/store/useUserStore'
import React, { useEffect, useState } from 'react'
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
  // 3. 访问 /notifications 需要异步校验
  if (path.startsWith('/notifications')) {
    const [allowed, setAllowed] = useState<boolean | null>(null);
    useEffect(() => {
      window.electron.ipcRenderer
        .invoke('check-is-notification-window')
        .then((result: boolean) => {
          setAllowed(result);
        });
    }, []);
    if (allowed === null) return null;
    // 等待异步结果时可以渲染loading或null
    return allowed ? children : null;
  }
  // 4. 其他路径，必须登录，角色不限
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }
  // 5. 通过鉴权，放行
  return children
}
