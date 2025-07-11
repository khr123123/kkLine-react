import { UsergroupAddOutlined } from '@ant-design/icons'
import { loadAllGroup } from '@renderer/api/contactApis'
import { genGroup } from '@renderer/api/groupApis'
import GroupForm from '@renderer/components/GroupForm'
import { useGlobalReloadStore } from '@renderer/store/useGlobalReloadStore'
import { useUserStore } from '@renderer/store/useUserStore'
import { Avatar, Badge, Button, Input, List, message, Modal, theme, Typography } from 'antd'
import dayjs from "dayjs"
import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
const { Text } = Typography

const GroupsPage: React.FC = () => {
    const [groups, setGroups] = useState<API.GroupVO[]>()
    const [selectedGroup, setSelectedGroup] = useState<API.GroupVO | null>(null)
    const navigate = useNavigate()
    const [isModalOpen, setIsModalOpen] = useState(false);
    const user = useUserStore(state => state.user)
    const reloadCount = useGlobalReloadStore(state => state.reloadMap['groupList'] || 0)
    const handleCancel = () => setIsModalOpen(false);
    const fetchGroups = async () => {
        const res = await loadAllGroup() as API.BaseResponseGroupVO
        if (res.code === 0 && Array.isArray(res.data)) {
            const groupList = res.data.map((item) => item.groupVO).filter(Boolean);
            setGroups(groupList);
        }
    };
    useEffect(() => {
        fetchGroups();
    }, [reloadCount]);
    const [formKey, setFormKey] = useState(0);
    const { token } = theme.useToken();
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
                    style={{ fontSize: 20 }}
                    onClick={() => {
                        setIsModalOpen(true)
                        setFormKey(prev => prev + 1);
                    }}
                />
                <Modal
                    title="创建群组"
                    closable={{ 'aria-label': 'Custom Close Button' }}
                    open={isModalOpen}
                    onCancel={handleCancel}
                    footer={null} // 表单组件自己控制提交
                >
                    <GroupForm
                        key={formKey}
                        onSubmit={async (data) => {
                            try {
                                const res = await genGroup(data) as API.BaseResponseGroupVO
                                if (res.code === 0) {
                                    message.success('创建群聊成功!');
                                    setIsModalOpen(false);
                                    fetchGroups()
                                } else {
                                    message.error(`群聊创建失败,${res.message}.`);
                                }
                            } catch (e) {
                                message.error('群聊创建失败' + e);
                            }
                        }}
                    />
                </Modal>
            </div>
            <List
                loading={!groups}
                className='scrollableDiv'
                itemLayout="horizontal"
                dataSource={groups}
                style={{ flexGrow: 1, overflowY: 'auto' }}
                renderItem={(item) => (
                    <>
                        <List.Item
                            className={"list-item"}
                            key={item.id}
                            style={{
                                backgroundColor:
                                    selectedGroup?.id === item.id ? token.controlItemBgActiveHover : undefined,
                                cursor: 'pointer',
                                padding: '12px 16px'
                            }}
                            onClick={() => {
                                setSelectedGroup(item)
                                navigate(`/groups/${item.id}`)
                            }}
                        >
                            <List.Item.Meta
                                avatar={<Avatar shape="square" size={50} src={item.groupAvatar} />}
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
                                            {item.groupName}
                                        </Text>
                                        <Text type="secondary" style={{ fontSize: 12 }}>
                                            （{item.memberCount}）
                                        </Text>
                                    </div>
                                }
                                description={
                                    <Text type="secondary" style={{ fontSize: 12 }}>
                                        {user?.id === item.groupOwner ? "创建" : "加入"}时间：{dayjs(item.createTime).format('YYYY-MM-DD')}
                                    </Text>
                                }
                            />
                            {user?.id === item.groupOwner && <Badge status="processing" />}
                        </List.Item>
                    </>
                )}
            />
        </div>
    )
}

export default GroupsPage
