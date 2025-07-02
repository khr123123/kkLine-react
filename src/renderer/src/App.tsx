import { Navigate, Route, BrowserRouter as Router, Routes } from 'react-router-dom'
import BaseLayout from './components/BaseLayout'
import ContactsPage from './pages/ContactsPage'
function App(): React.JSX.Element {
  //const ipcHandle = (): void => window.electron.ipcRenderer.send('ping')

  return (
    <Router>
      <Routes>
        <Route path="/" element={<BaseLayout />}>
          <Route index element={<Navigate to="/sessions" />} />
          <Route path="sessions" element={<ContactsPage />} />
          <Route path="friends" element={<>friends</>} />
          <Route path="groups" element={<>groups</>} />
          <Route path="setting" element={<>setting</>} />
          <Route path="youtube" element={<>youtube</>} />
          <Route path="search" element={<>search</>} />
          <Route path="openai" element={<>openai</>} />
        </Route>
      </Routes>
    </Router>
  )
}

export default App
