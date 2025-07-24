import React, { useEffect, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useUserStore } from '@renderer/store/useUserStore'

type Props = {
  children: React.ReactElement
}

export const useIsAdmin = () => {
  const user = useUserStore((state) => state.user)
  return user?.userRole === 'admin'
}

export const RouteGuard: React.FC<Props> = ({ children }) => {
  const user = useUserStore((state) => state.user)
  const location = useLocation()
  const path = location.pathname

  const [allowed, setAllowed] = useState<boolean | null>(null)

  useEffect(() => {
    if (path.startsWith('/notifications')) {
      // 异步检查是否允许访问通知页面
      window.electron.ipcRenderer
        .invoke('check-is-notification-window')
        .then((result: boolean) => {
          setAllowed(result)
        })
    } else {
      // 对非 /notifications 路径，默认允许
      setAllowed(true)
    }
  }, [path])

  // 等待异步验证完成
  if (allowed === null) {
    return <div>Loading...</div> // 你也可以使用 Spin 等组件美化
  }

  // 1. 放行 /login
  if (path === '/login') {
    return children
  }

  // 2. /admin 路径必须登录且为 admin
  if (path.startsWith('/admin')) {
    if (!user) {
      return <Navigate to="/login" replace state={{ from: location }} />
    }
    if (user.userRole !== 'admin') {
      return <Navigate to="/no-access" replace />
    }
    return children
  }

  // 3. /notifications 路径需异步验证
  if (path.startsWith('/notifications')) {
    if (!allowed) {
      return <Navigate to="/no-access" replace />
    }
    return children
  }

  // 4. 其他路径必须登录
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  // 5. 默认放行
  return children
}
