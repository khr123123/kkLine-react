import ToolBar from './components/GlobalToolBar';


function App(): React.JSX.Element {
  //const ipcHandle = (): void => window.electron.ipcRenderer.send('ping')

  return (
    <>
      <ToolBar />
    </>
  )
}

export default App
