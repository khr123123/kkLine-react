import { UsergroupAddOutlined } from '@ant-design/icons'
import GroupForm from '@renderer/components/GroupForm'
import { Avatar, Button, Input, List, message, Modal, Typography } from 'antd'
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const { Text } = Typography

interface Group {
    id: number
    name: string
    avatar: string
    members: number
    joinedAt: string // 加入时间
}

const initialGroups: Group[] = [
    {
        id: 101,
        name: '技术交流群',
        avatar: 'https://cdn-icons-png.flaticon.com/512/2922/2922510.png',
        members: 36,
        joinedAt: '2024-03-15'
    },
    {
        id: 102,
        name: 'React 开发组',
        avatar: 'https://cdn-icons-png.flaticon.com/512/2922/2922656.png',
        members: 18,
        joinedAt: '2024-08-01'
    },
    {
        id: 103,
        name: '前端技术大会',
        avatar: 'https://cdn-icons-png.flaticon.com/512/2922/2922650.png',
        members: 128,
        joinedAt: '2025-01-10'
    },
    {
        id: 104,
        name: '算法每日一题',
        avatar: 'https://cdn-icons-png.flaticon.com/512/2922/2922662.png',
        members: 52,
        joinedAt: '2024-11-23'
    },
    {
        id: 105,
        name: '开源项目协作',
        avatar: 'https://cdn-icons-png.flaticon.com/512/2922/2922636.png',
        members: 74,
        joinedAt: '2024-12-05'
    },
    {
        id: 106,
        name: 'Go语言学习群',
        avatar: 'https://cdn-icons-png.flaticon.com/512/2922/2922676.png',
        members: 22,
        joinedAt: '2025-02-14'
    },
    {
        id: 107,
        name: '面试突击营',
        avatar: 'https://cdn-icons-png.flaticon.com/512/2922/2922694.png',
        members: 91,
        joinedAt: '2024-09-10'
    },
    {
        id: 108,
        name: '日语互助交流群',
        avatar: 'https://cdn-icons-png.flaticon.com/512/2922/2922608.png',
        members: 47,
        joinedAt: '2023-12-20'
    },
    {
        id: 109,
        name: 'AI 创作交流群',
        avatar: 'https://cdn-icons-png.flaticon.com/512/2922/2922616.png',
        members: 66,
        joinedAt: '2025-03-01'
    },
    {
        id: 110,
        name: '全栈开发者圈',
        avatar: 'https://cdn-icons-png.flaticon.com/512/2922/2922646.png',
        members: 120,
        joinedAt: '2025-01-25'
    }
]

const GroupsPage: React.FC = () => {
    const [groups] = useState<Group[]>(initialGroups)
    const [selectedGroup, setSelectedGroup] = useState<Group | null>(null)
    const navigate = useNavigate()
    const [isModalOpen, setIsModalOpen] = useState(false);
    const handleCancel = () => setIsModalOpen(false);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
            <div className="drag" style={{ height: 25, width: '100%' }}></div>
            <div
                style={{
                    height: 46,
                    position: 'sticky',
                    top: 25,
                    display: 'flex',
                    alignItems: 'center',
                    padding: '0 10px',
                    paddingBottom: 10,
                    background: '#fff',
                    zIndex: 10,
                }}
            >
                <Input.Search
                    placeholder="搜索群组"
                    allowClear
                    style={{ flex: 1, marginRight: 10 }}
                />
                <Button
                    type="primary"
                    icon={<UsergroupAddOutlined />}
                    style={{ fontSize: 18 }}
                    onClick={() => setIsModalOpen(true)}
                />
                <Modal
                    title="创建群组"
                    closable={{ 'aria-label': 'Custom Close Button' }}
                    open={isModalOpen}
                    onCancel={handleCancel}
                    footer={null} // 表单组件自己控制提交
                >
                    <GroupForm
                        onSubmit={async (data) => {
                            console.log('创建群聊数据', data);
                            try {
                                // const res = await createGroup(data); // 调用API
                                message.success('创建成功');
                                setIsModalOpen(false);
                            } catch (e) {
                                message.error('创建失败');
                            }
                        }}
                    />
                </Modal>
            </div>

            <List
                className='scrollableDiv'
                itemLayout="horizontal"
                dataSource={groups}
                style={{ flexGrow: 1, overflowY: 'auto' }}
                renderItem={(item) => (
                    <List.Item
                        className={"list-item"}
                        key={item.id}
                        style={{
                            backgroundColor: selectedGroup?.id === item.id ? '#bae7ff' : undefined,
                            cursor: 'pointer',
                            padding: '12px 16px'
                        }}
                        onClick={() => {
                            setSelectedGroup(item)
                            navigate(`/groups/${item.id}`)
                        }}
                    >
                        <List.Item.Meta
                            avatar={<Avatar shape="square" size={50} src={item.avatar} />}
                            title={
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <Text
                                        strong
                                        style={{
                                            whiteSpace: 'nowrap',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis'
                                        }}
                                    >
                                        {item.name}
                                    </Text>
                                    <Text type="secondary" style={{ fontSize: 12 }}>
                                        （{item.members}）
                                    </Text>
                                </div>
                            }
                            description={
                                <Text type="secondary" style={{ fontSize: 12 }}>
                                    加入时间：{item.joinedAt}
                                </Text>
                            }
                        />
                    </List.Item>
                )}
            />
        </div>
    )
}

export default GroupsPage
