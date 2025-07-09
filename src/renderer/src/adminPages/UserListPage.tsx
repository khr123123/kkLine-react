import { EllipsisOutlined, PlusOutlined } from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import { listUserByPage } from '@renderer/api/userApis';
import { Button, Dropdown, message, Tag, Popconfirm, Image } from 'antd';
import { useRef, useState } from 'react';
import {
    EditOutlined,
    DeleteOutlined,
    ManOutlined,
    WomanOutlined,
    QuestionOutlined,
} from '@ant-design/icons';
import GlobalLoading from '@renderer/components/GlobalLoding';
import Title from 'antd/lib/typography/Title';

// 用户类型
type User = API.User;

const columns: ProColumns<User>[] = [
    {
        title: 'ID',
        dataIndex: 'id',
        width: 80,
        ellipsis: true,
        copyable: true,
    },
    {
        title: '账号',
        dataIndex: 'userAccount',
        copyable: true,
        width: 80,
    },
    {
        title: '昵称',
        dataIndex: 'userName',
        width: 80,
    },
    {
        title: '头像',
        dataIndex: 'userAvatar',
        search: false,
        width: 50,
        render: (avatarUrl) => {
            return avatarUrl ? (
                <Image
                    src={avatarUrl as string}
                    width={40}
                    height={40}
                    style={{ borderRadius: '50%' }}
                    alt="头像"
                    placeholder={<div style={{ width: 40, height: 40, background: '#f0f0f0', borderRadius: '50%' }} />}
                />
            ) : (
                <div style={{ width: 40, height: 40, background: '#f0f0f0', borderRadius: '50%' }} />
            );
        },
    },
    {
        title: '邮箱',
        dataIndex: 'userEmail',
        ellipsis: true,
        width: 140,
        copyable: true,
    },
    {
        title: '简介',
        dataIndex: 'userProfile',
        ellipsis: true,
        width: 50,
        search: false,
    },
    {
        title: '角色',
        dataIndex: 'userRole',
        width: 60,
        render: (role) => {
            let color = 'default';
            let text = role;
            if (role === 'admin') {
                color = '#f50';
                text = '管理员';
            } else if (role === 'user') {
                color = '#2db7f5';
                text = '用户';
            }
            return <Tag color={color}>{text}</Tag>;
        }
    },
    {
        title: '性别',
        dataIndex: 'userSex',
        search: false,
        width: 50,
        render: (sex) => {
            if (sex === 1) {
                return <ManOutlined style={{ color: '#1890ff', fontSize: 18 }} />;
            } else if (sex === 0) {
                return <WomanOutlined style={{ color: '#eb2f96', fontSize: 18 }} />;
            } else {
                return <QuestionOutlined style={{ color: '#999', fontSize: 18 }} />;
            }
        },
    },
    {
        title: '地区/邮编',
        dataIndex: 'areaName',
        render: (_, record) => (
            <>
                <div>{record.areaName || '-'}</div>
                <div style={{ color: '#888', fontSize: 12 }}>{record.areaCode || '-'}</div>
            </>
        ),
        width: 80,
    },
    {
        title: '创建时间',
        dataIndex: 'createTime',
        valueType: 'dateTime',
        sorter: true,
        search: false,
        width: 120,
    },
    {
        title: '上次登出',
        dataIndex: 'lastLogOutTime',
        valueType: 'dateTime',
        width: 120,
        search: false,
        sorter: true,
    },
    {
        title: '操作',
        valueType: 'option',
        fixed: 'right',
        width: 80,
        render: (text, record, _, action) => (
            <>
                <EditOutlined
                    style={{ fontSize: 20, color: '#1890ff', marginRight: 12, cursor: 'pointer' }}
                    onClick={() => action?.startEditable?.(record.id as any)}
                    title="编辑"
                />
                <Popconfirm
                    title="确定删除吗？"
                    onConfirm={async () => {
                        try {
                            // await deleteUserById(record.id);
                            message.success('删除成功');
                            action?.reload();
                        } catch (error) {
                            message.error('删除失败');
                        }
                    }}
                    okText="是"
                    cancelText="否"
                >
                    <DeleteOutlined
                        style={{ color: 'red', cursor: 'pointer', fontSize: 20, }}
                        title="删除"
                    />
                </Popconfirm>
            </>
        ),
    }

];

// 主表格组件
export default () => {
    const actionRef = useRef<ActionType | undefined>(undefined);
    const [loading, setLoading] = useState(false);
    return (
        <div style={{
            overflow: 'hidden',
            background: '#fff',
            padding: 16,
        }}>
            <GlobalLoading loading={loading} />
            <ProTable<User>
                columns={columns}
                actionRef={actionRef}
                className='scrollableDiv'
                cardBordered
                rowKey="id"
                pagination={{
                    pageSize: 10,
                    showQuickJumper: true,
                }}
                search={{ labelWidth: 'auto' }}
                dateFormatter="string"
                headerTitle="用户列表"
                toolbar={{
                    title: (
                        <Title level={3} style={{ margin: '16px 24px', marginBottom: 0, marginTop: 0 }}>
                            用户查询区
                        </Title>
                    ),
                    tooltip: '用于搜索用户信息',
                }}
                toolBarRender={() => [
                    <Button
                        key="new"
                        icon={<PlusOutlined />}
                        type="primary"
                        onClick={() => actionRef.current?.reload()}
                    >
                        新建
                    </Button>,
                    <Dropdown
                        key="menu"
                        menu={{
                            items: [
                                { label: '导出', key: 'export' },
                                { label: '批量删除', key: 'delete' },
                            ],
                        }}
                    >
                        <Button icon={<EllipsisOutlined />} />
                    </Dropdown>,
                ]}
                request={async (params, sort, filter) => {
                    setLoading(true);
                    try {
                        const sortField = Object.keys(sort || {})[0];
                        const sortOrder = sort?.[sortField] ?? undefined;
                        const res = await listUserByPage({
                            ...params,
                            sortField,
                            sortOrder,
                        });
                        const data = res.data as API.PageUser
                        return {
                            data: data.records,
                            total: data.total,
                            success: true,
                        };
                    } finally {
                        setLoading(false);
                    }

                }}
                editable={{ type: 'multiple' }}
            />
        </div>
    );
};
