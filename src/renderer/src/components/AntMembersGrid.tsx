import React, { useState } from 'react';
import { Avatar, Divider, Drawer, Space, Tooltip, Typography } from 'antd';
import { UserOutlined } from '@ant-design/icons';
const { Text } = Typography;
export interface GroupMember extends API.UserVO {
    isOwner?: boolean;
}

interface MembersGridProps {
    members: GroupMember[];
}

const AntMembersGrid: React.FC<MembersGridProps> = ({ members }) => {
    const sortedMembers = [...members].sort((a, b) => {
        if (a.isOwner && !b.isOwner) return -1;
        if (!a.isOwner && b.isOwner) return 1;
        return 0;
    });
    const [selectedMember, setSelectedMember] = useState<GroupMember | null>(null);

    return (
        <>
            <Avatar.Group max={{ count: 7 }} size="large" shape="square" style={{ maxWidth: '100%' }}>
                {sortedMembers.map((member) => (
                    <Tooltip key={member.id} title={`${member.userName}${member.isOwner ? '（群主）' : ''}`}>
                        <Avatar
                            src={member.userAvatar}
                            style={{
                                backgroundColor: member.userAvatar ? undefined : '#87d068',
                                fontWeight: 'bold',
                                cursor: 'pointer'
                            }}
                            icon={!member.userAvatar ? <UserOutlined /> : undefined}
                            onClick={() => setSelectedMember(member)}
                        >
                            {!member.userAvatar && member.userName?.charAt(0).toUpperCase()}
                        </Avatar>
                    </Tooltip>
                ))}
            </Avatar.Group>
            <Drawer
                title="用户详情"
                onClose={() => setSelectedMember(null)}
                open={!!selectedMember}
                width={200}
                maskStyle={{ backgroundColor: "rgba(0, 0, 0, 0.1)" }}
            >
                {selectedMember && (
                    <Space direction="vertical" size="middle" style={{ width: "100%" }}>
                        <Space align="center" size="large" style={{ width: "100%" }}>
                            <Avatar
                                size={64}
                                src={selectedMember.userAvatar}
                                alt="头像"
                                style={{ borderRadius: 8 }}
                            />
                            <Space direction="vertical" size={4} style={{ flex: 1 }}>
                                <Text strong style={{ fontSize: 18 }}>{selectedMember.userName}</Text>
                                <Text type="secondary">ID: {selectedMember.id}</Text>
                            </Space>
                        </Space>
                        <Divider size="small" style={{ margin: 0 }} />
                        <Space direction="vertical" size={12} style={{ width: "100%" }}>
                            <Text><Text strong>账号：</Text>{selectedMember.userAccount || "-"}</Text>
                            <Text><Text strong>性别：</Text>{selectedMember.userSex === 0 ? "女" : "男"}</Text>
                            <Text><Text strong>邮箱：</Text>{selectedMember.userEmail || "-"}</Text>
                            <Text><Text strong>地区：</Text>{selectedMember.areaName || "-"}</Text>
                            <Text><Text strong>区号：</Text>{selectedMember.areaCode || "-"}</Text>
                        </Space>
                        <Divider size="small" style={{ margin: 0 }} />
                        <div>
                            <Text strong>个人简介：</Text>
                            <div style={{ marginTop: 6, whiteSpace: "pre-wrap", color: "#666", minHeight: 40 }}>
                                {selectedMember.userProfile || "无简介"}
                            </div>
                        </div>
                    </Space>
                )}
            </Drawer>

        </>
    );
};

export default AntMembersGrid;
