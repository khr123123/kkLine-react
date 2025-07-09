import { EllipsisOutlined, PlusOutlined } from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import { listGroupByPage } from '@renderer/api/groupApis';
import { Button, Dropdown, message, Tag, Popconfirm, Image } from 'antd';
import { useRef, useState } from 'react';
import {
    EditOutlined,
    DeleteOutlined,
} from '@ant-design/icons';
import GlobalLoading from '@renderer/components/GlobalLoding';
import Title from 'antd/lib/typography/Title';
type Group = API.Group;
const columns: ProColumns<Group>[] = [
    {
        title: '群ID',
        dataIndex: 'id',
        width: 200,
        ellipsis: true,
        copyable: true,
    },
    {
        title: '群名称',
        dataIndex: 'groupName',
        width: 120,
    },
    {
        title: '群主',
        dataIndex: 'groupOwnerName',
        width: 100,
    },
    {
        title: '群头像',
        dataIndex: 'groupAvatar',
        search: false,
        width: 80,
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
        title: '群公告',
        dataIndex: 'groupNotice',
        ellipsis: true,
        width: 120,
        search: false,
    },
    {
        title: '加入方式',
        dataIndex: 'joinType',
        width: 100,
        render: (joinType) => {
            return joinType === 0 ? <Tag color="blue">自由加入</Tag> : <Tag color="orange">需审核</Tag>;
        },
    },
    {
        title: '成员数',
        dataIndex: 'memberCount',
        width: 70,
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
        title: '操作',
        valueType: 'option',
        fixed: 'right',
        width: 100,
        render: (text, record, _, action) => (
            <>
                <EditOutlined
                    style={{ fontSize: 20, color: '#1890ff', marginRight: 12, cursor: 'pointer' }}
                    onClick={() => action?.startEditable?.(record.id)}
                    title="编辑"
                />
                <Popconfirm
                    title="确定删除该群组吗？"
                    onConfirm={async () => {
                        try {
                            // await deleteGroupById(record.id);
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
                        style={{ color: 'red', cursor: 'pointer', fontSize: 20 }}
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
            <ProTable<Group>
                columns={columns}
                actionRef={actionRef}
                cardBordered
                rowKey="id"
                pagination={{
                    pageSize: 10,
                    showQuickJumper: true,
                }}
                search={{ labelWidth: 'auto' }}
                dateFormatter="string"
                toolbar={{
                    title: (
                        <Title level={3} style={{ margin: '16px 24px', marginBottom: 0, marginTop: 0 }}>
                            群组查询区
                        </Title>
                    ),
                    tooltip: '用于搜索群组信息',
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
                        const res = await listGroupByPage({
                            ...params,
                            sortField,
                            sortOrder,
                        });
                        const data = res.data as API.PageGroupVO
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
