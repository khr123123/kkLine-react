import React, { useCallback, useEffect, useState } from 'react';
import {
    Button,
    Card,
    Typography,
    Tooltip,
    Avatar,
    Dropdown,
    Space,
    Divider,
    Tag,
    MenuProps,
    Pagination,
    message,
    Empty,
} from 'antd';
import { CloseOutlined, UserOutlined, TeamOutlined } from '@ant-design/icons';
import { useUserStore } from '@renderer/store/useUserStore';
import { loadApply } from '@renderer/api/contactApplyApis';
import UserIconCard from '@renderer/components/UserIconCard';

const { Title, Text } = Typography;

const NotifiPage: React.FC = () => {
    const setUser = useUserStore((state) => state.setUser);
    const user = useUserStore((state) => state.user);
    const [data, setData] = useState<API.ContactApplyVO[]>([]);
    const [total, setTotal] = useState<number>(0);
    const [current, setCurrent] = useState<number>(1);
    const [pageSize, setPageSize] = useState<number>(3); // 一页最多显示3条
    const [loading, setLoading] = useState<boolean>(false);

    const handleClose = useCallback(() => {
        window.electron.ipcRenderer.send('window-close-notifications');
    }, []);

    const fetchApplyList = async (page = 1, size = 3) => {
        setLoading(true);
        try {
            const res = await loadApply({ current: page, pageSize: size });
            setData(res.data.records || []);
            setTotal(res.data.total || 0);
        } catch (e) {
            message.error('加载申请列表失败');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        window.electron.ipcRenderer.invoke('get-login-user').then((result: any) => {
            setUser(result);
            fetchApplyList(current, pageSize);
        });
    }, []);

    const handleMenuClick = (item: API.ContactApplyVO, key: string) => {
        const labelMap = { '2': '拒绝', '3': '拉黑' };
        message.success(`对申请 ${item.id} 执行操作：${labelMap[key]}`);
        console.log(`对申请 ${item.id} 执行操作：${labelMap[key]}`);
        // TODO: 调用接口 updateApplyStatus(item.id, Number(key))
    };

    const handleAccept = (item: API.ContactApplyVO) => {
        console.log(`接受申请 ${item.id}`);
        message.success(`接受申请 ${item.id}`);
        // TODO: 调用接口 updateApplyStatus(item.id, 1)
    };

    return (
        <>
            {/* 顶部关闭按钮 */}
            <div className="drag" style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Title level={4} style={{ margin: 0, padding: 12, paddingBottom: 4 }}>好友/群申请列表</Title>
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

            <Card style={{ width: 'calc(100% - 20px)', margin: '1px auto', minHeight: 550 }} loading={loading}>
                {data.length === 0 ? (
                    <Empty description="暂无申请消息" />
                ) : (
                    data.map((item) => {
                        const isGroup = !!item.groupId;

                        const menuItems: MenuProps['items'] = [
                            { key: '2', label: '拒绝' },
                            { key: '3', label: '拉黑' },
                        ];

                        if (isGroup) {
                            // 加群申请，展示群信息+加群人信息
                            const group = item.groupVO;
                            const userVO = item.userVO;

                            return (
                                <Card
                                    key={item.id}
                                    size="small"
                                    style={{ marginBottom: 12, }}
                                    title={
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: 52 }}>
                                            <Space>
                                                <TeamOutlined style={{ fontSize: 24, }} />
                                                <Text strong>{group?.groupName}</Text>
                                                <Avatar
                                                    shape="square"
                                                    src={group?.groupAvatar}
                                                    size={34}
                                                    icon={!group?.groupAvatar && <TeamOutlined />}
                                                />
                                            </Space>
                                            <Text strong>加群申请</Text>
                                        </div>

                                    }
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', }}>
                                        <div>
                                            <Text strong style={{ margin: 0, fontSize: 16 }} >申请人：</Text>
                                            <Text >{item.applyInfo || '-'}</Text><br />
                                            <div style={{ display: 'flex', alignItems: 'center', padding: 4, minWidth: 220 }}>
                                                <Avatar size={46} shape="square" src={userVO.userAvatar} icon={<UserOutlined />} />
                                                <div style={{ marginLeft: 16, flex: 1 }}>
                                                    <Text type="secondary">{userVO.userName || '-'}</Text><br />
                                                    <Text type="secondary">ID：{userVO.id || '-'}</Text><br />
                                                    <Text type="secondary">邮箱：{userVO.userEmail || '-'}</Text>
                                                </div>
                                            </div>
                                        </div>
                                        <div>
                                            <Dropdown.Button
                                                onClick={() => handleAccept(item)}
                                                menu={{
                                                    items: menuItems,
                                                    onClick: ({ key }) => handleMenuClick(item, key),
                                                }}
                                            >
                                                接受
                                            </Dropdown.Button>
                                        </div>
                                    </div>

                                </Card>
                            );
                        } else {
                            // 好友申请，展示好友信息
                            const userVO = item.userVO;
                            return (
                                <Card
                                    key={item.id}
                                    size="small"
                                    style={{ marginBottom: 12, }}
                                    title={
                                        <Space>
                                            <UserOutlined />
                                            <Text strong>好友申请</Text>
                                            <Tag color="green">来自 {userVO?.userName || userVO?.userAccount}</Tag>
                                        </Space>
                                    }
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', }}>
                                        <Space align="start">
                                            <Avatar
                                                src={userVO?.userAvatar}
                                                icon={!userVO?.userAvatar && <UserOutlined />}
                                            />
                                            <div>
                                                <Text>{item.applyInfo || '无附言'}</Text>
                                                <br />
                                                <Text type="secondary">{userVO?.userProfile}</Text>
                                                {userVO?.areaName && (
                                                    <>
                                                        <br />
                                                        <Text type="secondary">地区：{userVO.areaName}</Text>
                                                    </>
                                                )}
                                            </div>
                                        </Space>
                                        <Space>
                                            <Dropdown.Button
                                                onClick={() => handleAccept(item)}
                                                menu={{
                                                    items: menuItems,
                                                    onClick: ({ key }) => handleMenuClick(item, key),
                                                }}
                                            >
                                                接受
                                            </Dropdown.Button>
                                        </Space>
                                    </div>
                                </Card>
                            );
                        }
                    })
                )}

                {/* 分页组件 */}
                {total > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'center', marginTop: 16 }}>
                        <Pagination
                            current={current}
                            pageSize={pageSize}
                            total={total}
                            onChange={(page, size) => {
                                setCurrent(page);
                                setPageSize(size);
                                fetchApplyList(page, size);
                            }}
                        />
                    </div>
                )}
            </Card>
        </>
    );
};

export default NotifiPage;
