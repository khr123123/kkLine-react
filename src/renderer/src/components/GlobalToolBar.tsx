import React, { useState } from 'react';
import { Button, Tooltip } from 'antd';
import {
    CloseOutlined,
    PushpinOutlined,
    MinusOutlined
} from '@ant-design/icons';

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
                    display: 'none',
                    justifyContent: 'space-between',

                }}
            >
                <div className="no-drag" style={{ padding: '0 4px' }}>
                    <Tooltip title="关闭">
                        <Button
                            type="text"
                            icon={<CloseOutlined />}
                            size="large"
                            onClick={handleClose}
                            danger
                        />
                    </Tooltip>
                </div>
                <div className="no-drag" style={{ padding: '0 4px' }}>
                    <Tooltip title={isPinned ? '取消置顶' : '置顶'}>
                        <Button
                            type="text"
                            icon={
                                <PushpinOutlined
                                    rotate={isPinned ? 0 : 45}
                                    style={{ color: isPinned ? '#52c41a' : undefined }}
                                />
                            }
                            size="large"
                            onClick={handleTogglePin}
                        />
                    </Tooltip>
                    <Tooltip title="最小化">
                        <Button
                            type="text"
                            icon={<MinusOutlined />}
                            size="large"
                            onClick={handleMinimize}
                        />
                    </Tooltip>
                </div>
            </div>
        </>
    );
};

export default GlobalToolBar;
