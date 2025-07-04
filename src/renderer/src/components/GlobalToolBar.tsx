import {
  CloseOutlined,
  MinusOutlined,
  PushpinOutlined,
  BorderOutlined,
  ShrinkOutlined,
} from '@ant-design/icons';
import { Button, Tooltip } from 'antd';
import React, { useState } from 'react';

type GlobalToolBarProps = {
  isLoginPage?: boolean;
};

const GlobalToolBar: React.FC<GlobalToolBarProps> = ({ isLoginPage = false }) => {
  const [isPinned, setIsPinned] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);

  const handleMinimize = (): void => window.electron.ipcRenderer.send('window-minimize');
  const handleClose = (): void => window.electron.ipcRenderer.send('window-close');
  const handleTogglePin = (): void => {
    window.electron.ipcRenderer.send('window-toggle-always-on-top');
    setIsPinned((prev) => !prev);
  };
  const handleToggleMaximize = (): void => {
    window.electron.ipcRenderer.send('window-toggle-maximize');
    setIsMaximized((prev) => !prev);
  };

  const loginPageStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    height: '28px',
    display: 'flex',
    justifyContent: 'flex-start',
  };

  const normalPageStyle: React.CSSProperties = {
    height: '28px',
    display: 'flex', justifyContent: "right",
  };

  return (
    <div className="drag" style={isLoginPage ? loginPageStyle : normalPageStyle}>
      <div className="no-drag" style={{ padding: '0 4px' }}>
        <Tooltip>
          <Button type="text" icon={<CloseOutlined />} size="large" onClick={handleClose} danger />
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
          <Button
            type="text"
            icon={isMaximized ? <ShrinkOutlined /> : <BorderOutlined />}
            size="large"
            onClick={handleToggleMaximize}
          />
        </Tooltip>

        <Tooltip>
          <Button type="text" icon={<MinusOutlined />} size="large" onClick={handleMinimize} />
        </Tooltip>
      </div>
    </div>
  );
};

export default GlobalToolBar;
