import { Avatar, Card, Tag, Typography } from 'antd'
import React from 'react'
import { useNavigate } from 'react-router-dom'

const { Text, Paragraph } = Typography

interface UserVO {
    id: string
    userAccount: string
    userEmail: string
    userName: string
    userAvatar: string
    userProfile: string
    userRole: string
    userSex: number
    areaName: string
    areaCode: string
}

interface GroupVO {
    id: string
    groupName: string
    groupAvatar: string
    groupDescription?: string
}

interface ShareItemProps {
    item: {
        userId: string
        contactId: string
        contactType: number
        userVO: UserVO | null
        groupVO: GroupVO | null
        joined: boolean
    }
}

const ShareInfoCard: React.FC<ShareItemProps> = ({ item }) => {
    const navigate = useNavigate()
    if (item.userVO) {
        const user = item.userVO
        return (
            <Card
                style={{ maxWidth: 400, margin: '10px auto', borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
                hoverable
                onClick={() => navigate(`/search?searchId=${user.id}`)}
            >
                <Card.Meta
                    avatar={<Avatar size={64} src={user.userAvatar} />}
                    title={
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Text strong style={{ fontSize: 18 }}>
                                {user.userName}
                            </Text>
                            <Tag color={user.userRole === 'user' ? 'blue' : 'green'}>
                                {user.userRole === 'user' ? '用户' : user.userRole}
                            </Tag>
                        </div>
                    }
                    description={
                        <>
                            <Paragraph style={{ marginBottom: 4 }}>{user.userProfile}</Paragraph>
                            <div style={{ fontSize: 12, color: '#999', marginTop: 8 }}>
                                <Text>性别: {user.userSex === 1 ? '男' : '女'}</Text> | <Text>地区: {user.areaName} ({user.areaCode})</Text>
                            </div>
                        </>
                    }
                />
            </Card>
        )
    }

    if (item.groupVO) {
        const group = item.groupVO
        return (
            <Card
                style={{ maxWidth: 400, margin: '10px auto', borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
                hoverable
                onClick={() => navigate(`/search?searchId=${group.id}`)}
            >
                <Card.Meta
                    avatar={<Avatar size={64} src={group.groupAvatar} />}
                    title={
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Text strong style={{ fontSize: 18 }}>
                                {group.groupName}
                            </Text>
                            <Tag color="purple">群组</Tag>
                        </div>
                    }
                    description={
                        group.groupDescription ? (
                            <Paragraph style={{ marginTop: 8, fontSize: 14, color: '#666' }}>
                                {group.groupDescription}
                            </Paragraph>
                        ) : (
                            <Text type="secondary">暂无群组描述</Text>
                        )
                    }
                />
            </Card>
        )
    }

    return <div>无有效分享信息</div>
}

export default ShareInfoCard
