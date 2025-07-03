// App.tsx
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom'
import BaseLayout from './components/BaseLayout'
import ContactsPage from './pages/ContactsPage'
import ChatPage from './pages/ChatPage'

const router = createBrowserRouter([
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
        element: <ContactsPage />
      },
      {
        path: 'sessions/:sessionId',
        element: <ContactsPage />,
        handle: {
          RightArea: () => <ChatPage />
        }
      },
      {
        path: 'friends',
        element: <>friends</>
      },
      {
        path: 'friends/:friendId',
        element: <>friends</>,
        handle: {
          RightArea: () => <>friendId</>
        }
      },
      {
        path: 'groups',
        element: <>groups</>,
      },
      {
        path: 'groups/:groupId',
        element: <>groups</>,
        handle: {
          RightArea: () => <>groupId</>
        }
      },
      {
        path: 'search',
        element: <div style={{ backgroundColor: "red", height: 500 }}>search</div>
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
