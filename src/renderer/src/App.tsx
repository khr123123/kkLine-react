// App.tsx
import { ConfigProvider, theme } from 'antd'
import { useEffect } from 'react'
import { createBrowserRouter, data, Navigate, RouterProvider } from 'react-router-dom'
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
import AudioCallModal from './pages/session/components/AudioCallPage'
import VideoCallModal from './pages/session/components/VideoCallPage'
import VideoCallPageWithComponents from './pages/session/components/VideoCallLiveKitPage'
import MusicPage from './pages/music'
// Define routes
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
    path: '/audioCallWindow',
    element: (
      <RouteGuard>
        <AudioCallModal />
      </RouteGuard>
    )
  },
  {
    path: '/videoCallWindow',
    element: (
      <RouteGuard>
        <VideoCallModal />
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
      },
      {
        path: 'music',
        element: <MusicPage />
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
        element: <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "200px",
            fontSize: "18px",
            fontWeight: "500",
            color: "#666",
          }}
        >
          管理员 暂不支持查看用户的聊天记录
        </div>
      },
      {
        path: 'adManager',
        element: <AdManagerPage />
      }
    ]
  }
])

export default function App() {
  // 主题切换
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

  //绑定 收到语音消息 和 视频消息的msg
  useEffect(() => {
    window.electron.ipcRenderer.on('receive-audio-offer', (_, data: any) => {
      window.electron.ipcRenderer.invoke('open-audioCall-window', data);
    });
    window.electron.ipcRenderer.on('reviced-video-offer', (_, data: any) => {
      window.electron.ipcRenderer.invoke('open-videoCall-window', data);
    });
    return () => {
      window.electron.ipcRenderer.removeAllListeners('receive-audio-offer');
      window.electron.ipcRenderer.removeAllListeners('reviced-video-offer');
    };
  }, []);

  return (
    <ConfigProvider theme={{ algorithm: getAlgorithm(), hashed: false }}>
      <RouterProvider router={router} />
    </ConfigProvider>
  )
}
