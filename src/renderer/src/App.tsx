// App.tsx
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom'
import BaseLayout from './components/BaseLayout'
import SessionsPage from './pages/session/SessionsPage'
import ChatPage from './pages/session/ChatPage'
import FriendsPage from './pages/friend/FriendsPage'
import FriendInfo from './pages/friend/FriendInfo'
import GroupsPage from './pages/group/GroupsPage'
import GroupInfo from './pages/group/GroupInfo'
import LoginPage from './pages/LoginPage'
import WatermarkPage from './components/WatermarkPage'
import SearchPage from './pages/SearchPage'
const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/',
    element: <BaseLayout />,
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
        element: <>openai</>
      },
      {
        path: 'youtube',
        element: <>youtube</>
      },

      {
        path: 'setting',
        element: <>setting</>
      },
    ]
  }
])

export default function App() {
  return <RouterProvider router={router} />
}
