// App.tsx
import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom'
import AdminLayout from './adminPages/AdminLayout'
import { RouteGuard } from './auth/RouteGuard'
import BaseLayout from './components/BaseLayout'
import WatermarkPage from './components/WatermarkPage'
import FriendInfo from './pages/friend/FriendInfo'
import FriendsPage from './pages/friend/FriendsPage'
import GroupInfo from './pages/group/GroupInfo'
import GroupsPage from './pages/group/GroupsPage'
import LoginPage from './pages/LoginPage'
import OpenAiChatPage from './pages/openAi/OpenAiChatPage'
import OpenAiSessionPage from './pages/openAi/OpenAiSessionPage'
import SearchPage from './pages/SearchPage'
import ChatPage from './pages/session/ChatPage'
import SessionsPage from './pages/session/SessionsPage'
import SettingPage from './pages/SettingPage'
import YoutubePage from './pages/YoutubePage'
import UserListPage from './adminPages/UserListPage'
import GroupListpage from './adminPages/GroupListpage'
const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />
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
        element: <UserListPage/>
      },
      {
        path: 'gourpList',
        element: <GroupListpage/>
      },
      {
        path: 'messagePanel',
        element: <>messagePanel</>
      }
    ]
  }
])

export default function App() {
  return <RouterProvider router={router}></RouterProvider>
}
