import React, { useCallback, useEffect, useState } from 'react';
import {
    Button,
    Card,
    Typography,
    Tooltip,
    Avatar,
    Dropdown,
    Space,
    Tag,
    MenuProps,
    Pagination,
    message,
    Empty,
} from 'antd';
import { CloseOutlined, UserOutlined, TeamOutlined } from '@ant-design/icons';
import { useUserStore } from '@renderer/store/useUserStore';
import { dealWithApply, loadApply } from '@renderer/api/contactApplyApis';

const { Title, Text } = Typography;

// 状态标签映射
const statusTextMap = {
    1: { text: '已接受', color: 'green' },
    2: { text: '已拒绝', color: 'red' },
    3: { text: '已拉黑', color: 'volcano' },
};

const NotifiPage: React.FC = () => {
    const setUser = useUserStore((state) => state.setUser);
    const [data, setData] = useState<API.ContactApplyVO[]>([]);
    const [total, setTotal] = useState<number>(0);
    const [current, setCurrent] = useState<number>(1);
    const [pageSize, setPageSize] = useState<number>(3);
    const [loading, setLoading] = useState<boolean>(false);

    const handleClose = useCallback(() => {
        window.electron.ipcRenderer.send('window-close-notifications');
    }, []);

    const fetchApplyList = async (page = 1, size = 3) => {
        setLoading(true);
        try {
            const res = await loadApply({ current: page, pageSize: size });
            const resData = res.data as API.PageContactApplyVO;
            setData(resData.records || []);
            setTotal(resData.total || 0);
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

    const handleMenuClick = async (item: API.ContactApplyVO, key: string) => {
        const labelMap = { '2': '拒绝', '3': '拉黑' };
        const res = await dealWithApply({ applyId: item.id!, applyStatus: Number(key) }) as unknown as API.BaseResponseBoolean;
        if (res.code === 0) {
            message.success(`对申请 ${item.id} 执行操作：${labelMap[key]}`);
            fetchApplyList(current, pageSize);
        } else {
            message.error(`${res.message}`);
        }
    };

    const handleAccept = async (item: API.ContactApplyVO) => {
        const res = await dealWithApply({ applyId: item.id!, applyStatus: 1 }) as unknown as API.BaseResponseBoolean;
        if (res.code === 0) {
            message.success(`接受申请 ${item.id}`);
            fetchApplyList(current, pageSize);
        } else {
            message.error(`${res.message}`);
        }
    };

    return (
        <>
            <div className="drag" style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Title level={4} style={{ margin: 0, padding: 16, paddingBottom: 4 }}>好友/群申请列表</Title>
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

            <Card style={{ width: 'calc(100% - 20px)', margin: '2px auto', minHeight: 550, }} loading={loading}>
                {data.length === 0 ? (
                    <Empty description="暂无申请消息" />
                ) : (
                    data.map((item) => {
                        const isGroup = !!item.groupId;
                        const applyStatus = item.applyStatus;
                        const userVO = item.userVO;
                        const group = item.groupVO;

                        const menuItems: MenuProps['items'] = [
                            { key: '2', label: '拒绝' },
                            { key: '3', label: '拉黑' },
                        ];

                        const actionNode = applyStatus === 0 ? (
                            <Dropdown.Button
                                onClick={() => handleAccept(item)}
                                menu={{
                                    items: menuItems,
                                    onClick: ({ key }) => handleMenuClick(item, key),
                                }}
                            >
                                接受
                            </Dropdown.Button>
                        ) : (
                            <Tag color={statusTextMap[applyStatus as 1 | 2 | 3]?.color}>
                                {statusTextMap[applyStatus as 1 | 2 | 3]?.text}
                            </Tag>
                        );

                        return (
                            <Card
                                key={item.id}
                                size="small"
                                style={{ marginBottom: 4, }}
                                title={
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: 52 }}>
                                        <Space>
                                            {isGroup ? <TeamOutlined style={{ fontSize: 20 }} /> : <UserOutlined style={{ fontSize: 20 }} />}
                                            {isGroup ? (
                                                <>
                                                    <Text strong>{group?.groupName}</Text>
                                                    <Avatar shape="square" size={34} src={group?.groupAvatar} />
                                                </>
                                            ) : (
                                                <>
                                                    <Text>{item.applyInfo || '无附言'}</Text>
                                                    <Tag color="pink">来自 {userVO?.userName || userVO?.userAccount}</Tag>
                                                </>
                                            )}
                                        </Space>
                                        <Text strong>{isGroup ? '加群申请' : '好友申请'}</Text>
                                    </div>
                                }
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        {isGroup && (
                                            <>
                                                <Text strong>申请人：</Text><Text>{item.applyInfo || '-'}</Text><br />
                                            </>
                                        )}
                                        <div style={{ display: 'flex', alignItems: 'center', padding: 4, minWidth: 220 }}>
                                            <Avatar size={68} shape="square" src={userVO?.userAvatar} icon={<UserOutlined />} />
                                            <div style={{ marginLeft: 16 }}>
                                                <Text type="secondary">{userVO?.userName || '-'}</Text><br />
                                                <Text type="secondary">ID：{userVO?.id || '-'}</Text><br />
                                                <Text type="secondary">邮箱：{userVO?.userEmail || '-'}</Text><br />
                                                {userVO?.areaName && <Text type="secondary">地区：{userVO?.areaName}</Text>}
                                            </div>
                                        </div>
                                    </div>
                                    <div>
                                        {actionNode}
                                    </div>
                                </div>
                            </Card>
                        );
                    })
                )}

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
