import ToolBar from './components/GlobalToolBar';
import DemoPage from './pages/DemoPage';


function App(): React.JSX.Element {
  //const ipcHandle = (): void => window.electron.ipcRenderer.send('ping')

  return (
    <>
      <ToolBar />
      <DemoPage />
    </>
  )
}

export default App
