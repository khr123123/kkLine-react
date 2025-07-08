import React, { useCallback, useEffect } from 'react';
import { Button, Card, Typography, Tooltip } from 'antd';
import { CloseOutlined } from '@ant-design/icons';
import { useUserStore } from '@renderer/store/useUserStore';

const { Title } = Typography;

// 模拟通知数据
const notifications = [
    '您有一条新消息',
    '系统维护通知',
    '收到好友邀请',
    '有可用更新',
    '您加入了一个群聊',
];

const NotifiPage: React.FC = () => {
    const setUser = useUserStore(state => state.setUser)
    const user = useUserStore(state => state.user)
    // 关闭窗口的事件处理函数
    const handleClose = useCallback(() => {
        window.electron.ipcRenderer.send('window-close-notifications');
    }, []);
    useEffect(() => {
        window.electron.ipcRenderer.invoke('get-login-user').then((result: any) => {
            setUser(result)
        });
    }, []);
    return (
        <>
            {/* 标题栏，支持拖拽，右侧放关闭按钮 */}
            <div
                className="drag"
                style={{ display: 'flex', justifyContent: 'flex-end' }}
            >
                <Tooltip title="关闭">
                    <Button
                        type="text"
                        icon={<CloseOutlined />}
                        size="large"
                        onClick={handleClose}
                        danger
                        className="no-drag"
                    />
                </Tooltip>
            </div>

            {/* 通知内容卡片 */}
            <Card style={{ width: 'calc(100% - 20px)', margin: '14px auto' }}>
                <Title level={3}>通知列表</Title>
                {notifications.map((text, index) => (
                    <Title key={index} level={5} style={{ marginTop: 12 }}>
                        {JSON.stringify(user)}
                    </Title>
                ))}
            </Card>
        </>
    );
};

export default NotifiPage;
