// App.tsx
import { ConfigProvider, theme } from 'antd'
import { useEffect } from 'react'
import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom'
import AdminLayout from './adminPages/AdminLayout'
import GroupListpage from './adminPages/GroupListpage'
import UserListPage from './adminPages/UserListPage'
import { RouteGuard } from './auth/RouteGuard'
import BaseLayout from './components/BaseLayout'
import WatermarkPage from './components/WatermarkPage'
import FriendInfo from './pages/friend/FriendInfo'
import FriendsPage from './pages/friend/FriendsPage'
import GroupInfo from './pages/group/GroupInfo'
import GroupsPage from './pages/group/GroupsPage'
import LoginPage from './pages/LoginPage'
import NotifiPage from './pages/NotifiPage'
import OpenAiChatPage from './pages/openAi/OpenAiChatPage'
import OpenAiSessionPage from './pages/openAi/OpenAiSessionPage'
import SearchPage from './pages/SearchPage'
import ChatPage from './pages/session/ChatPage'
import SessionsPage from './pages/session/SessionsPage'
import SettingPage from './pages/SettingPage'
import YoutubePage from './pages/YoutubePage'
import { useThemeStore } from './store/useThemeStore'
import AdManagerPage from './adminPages/AdManagerPage'
const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />
  },
  {
    path: '/notifications',
    element: (
      <RouteGuard>
        <NotifiPage />
      </RouteGuard>
    )
  },
  {
    path: '/',
    element: (
      <RouteGuard>
        <BaseLayout />
      </RouteGuard>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="/sessions" replace />
      },
      {
        path: 'sessions',
        element: <SessionsPage />,
        handle: {
          RightArea: () => <WatermarkPage />
        }
      },
      {
        path: 'sessions/:sessionId',
        element: <SessionsPage />,
        handle: {
          RightArea: () => <ChatPage />
        }
      },
      {
        path: 'friends',
        element: <FriendsPage />,
        handle: {
          RightArea: () => <WatermarkPage />
        }
      },
      {
        path: 'friends/:friendId',
        element: <FriendsPage />,
        handle: {
          RightArea: () => <FriendInfo />
        }
      },
      {
        path: 'groups',
        element: <GroupsPage />,
        handle: {
          RightArea: () => <WatermarkPage />
        }
      },
      {
        path: 'groups/:groupId',
        element: <GroupsPage />,
        handle: {
          RightArea: () => <GroupInfo />
        }
      },
      {
        path: 'search',
        element: <SearchPage />
      },
      {
        path: 'openai',
        element: <OpenAiSessionPage />,
        handle: {
          RightArea: () => <OpenAiChatPage />
        }
      },
      {
        path: 'youtube',
        element: <YoutubePage />
      },
      {
        path: 'setting',
        element: <SettingPage />
      }
    ]
  },
  {
    path: '/admin',
    element: (
      <RouteGuard>
        <AdminLayout />
      </RouteGuard>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="/admin/userList" replace />
      },
      {
        path: 'userList',
        element: <UserListPage />
      },
      {
        path: 'gourpList',
        element: <GroupListpage />
      },
      {
        path: 'messagePanel',
        element: <>messagePanel</>
      },
      {
        path: 'adManager',
        element: <AdManagerPage />
      }
    ]
  }
])

export default function App() {
  const { themeMode } = useThemeStore()
  const getAlgorithm = () => {
    if (themeMode === 'light') return theme.defaultAlgorithm
    if (themeMode === 'dark') return theme.darkAlgorithm
    if (themeMode === 'compact') return theme.compactAlgorithm
    return theme.defaultAlgorithm
  }
  useEffect(() => {
    const root = document.documentElement
    switch (themeMode) {
      case 'dark':
        root.style.setProperty('--my-hover-color', '#1F1F1F')
        root.style.setProperty('--my-active-color', '#15417E')
        break
      case 'compact':
      case 'light':
      default:
        root.style.setProperty('--my-hover-color', '#E7E7E7')
        root.style.setProperty('--my-active-color', '#bae7ff')
        break
    }
  }, [themeMode])
  return (
    <ConfigProvider theme={{ algorithm: getAlgorithm(), hashed: false }}>
      <RouterProvider router={router} />
    </ConfigProvider>
  )
}
