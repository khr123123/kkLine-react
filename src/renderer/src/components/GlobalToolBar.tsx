import { CloseOutlined, MinusOutlined, PushpinOutlined } from '@ant-design/icons'
import { Button, Tooltip } from 'antd'
import React, { useState } from 'react'

const GlobalToolBar: React.FC = () => {
  const [isPinned, setIsPinned] = useState(false)
  const handleMinimize = (): void => window.electron.ipcRenderer.send('window-minimize')
  const handleClose = (): void => window.electron.ipcRenderer.send('window-close')
  const handleTogglePin = (): void => {
    window.electron.ipcRenderer.send('window-toggle-always-on-top')
    setIsPinned((prev) => !prev)
  }
  return (
    <>
      <div
        className="drag"
        style={{
          display: 'flex',
          justifyContent: 'right'
        }}
      >
        <div className="no-drag" style={{ padding: '0 4px' }}>
          <Tooltip>
            <Button
              type="text"
              icon={<CloseOutlined />}
              size="large"
              onClick={handleClose}
              danger
            />
          </Tooltip>
          <Tooltip>
            <Button
              type="text"
              icon={
                <PushpinOutlined
                  rotate={isPinned ? 0 : 45}
                  style={{ color: isPinned ? '#1890ff' : undefined }}
                />
              }
              size="large"
              onClick={handleTogglePin}
            />
          </Tooltip>
          <Tooltip>
            <Button type="text" icon={<MinusOutlined />} size="large" onClick={handleMinimize} />
          </Tooltip>
        </div>
      </div>
    </>
  )
}

export default GlobalToolBar
