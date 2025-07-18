import React, { useEffect, useState, useRef } from "react";
import { Avatar, Drawer, Space, Tooltip, message, Typography, Divider, Button, ConfigProvider, Popover } from "antd";
import { RestOutlined, UserOutlined } from "@ant-design/icons";
import { useParams } from "react-router-dom";
import { createStyles } from "antd-style";
import { kickMember } from "@renderer/api/groupApis";
import { useGlobalReloadStore } from "@renderer/store/useGlobalReloadStore";
import { useUserStore } from "@renderer/store/useUserStore";
const { Text } = Typography;


export interface GroupMember extends API.UserVO {
    isOwner?: boolean;
}

const AVATAR_SIZE = 48;
const GAP = 10;
const ROWS = 2;

const useStyle = createStyles(({ prefixCls, css }) => ({
    dangerousKickButton: css`
    &.${prefixCls}-btn-primary:not([disabled]):not(.${prefixCls}-btn-dangerous) {
      > span {
        position: relative;
      }
     &::before {
  content: '';
  background: linear-gradient(135deg, rgb(253, 54, 28), rgba(243, 49, 0, 0.58));
  position: absolute;
  inset: -1px;
  opacity: 1;
  transition: all 0.3s;
  border-radius: inherit;
}
&:hover::before {
  background: linear-gradient(135deg, rgb(255, 100, 60), rgba(255, 80, 20, 0.8));
  opacity: 1;
}
    }
  `,
}));
const MembersGrid: React.FC<{ members: GroupMember[] }> = ({ members }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [columns, setColumns] = useState(8); // 默认8列
    const { styles } = useStyle();
    const { groupId } = useParams();
    const user = useUserStore(state => state.user);
    useEffect(() => {
        const handleResize = () => {
            if (!containerRef.current) return;
            const width = containerRef.current.clientWidth;
            const colWidth = AVATAR_SIZE + GAP;
            const cols = Math.floor(width / colWidth);
            setColumns(cols > 0 ? cols : 1);
        };

        handleResize();
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    const maxShowCount = columns * ROWS;
    const showMore = members.length > maxShowCount;

    const [selectedMember, setSelectedMember] = useState<GroupMember | null>(null);
    const triggerReload = useGlobalReloadStore(state => state.triggerReload)

    const kickMemberHandel = async () => {
        if (!selectedMember || !groupId) return
        try {
            const res = await kickMember({
                memberIds: [selectedMember.id!],
                groupId: groupId,
            }) as API.BaseResponseGroupVO
            if (res.code === 0) {
                message.success(`已成功把用户[${selectedMember.userName}]踢出群聊！`);
                triggerReload('groupList')
                setSelectedMember(null);
            } else {
                message.error(res.message);
            }
        } catch (e) {
            message.error('踢人失败' + e);
        }
    };
    const more = (
        <div
            className="scrollableDiv"
            style={{
                maxWidth: 380,
                maxHeight: 220, // ✅ 固定高度
                overflowY: 'auto', // ✅ 超出滚动
                display: 'flex',
                flexWrap: 'wrap',
                gap: 12,
                padding: 8,
                justifyContent: 'flex-start',
            }}
        >
            {members.slice(maxShowCount - 1).map((member) => (
                <div
                    key={member.id}
                    style={{
                        width: 64,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        textAlign: 'center',
                    }}
                    onClick={() => setSelectedMember(member)}
                >
                    <Avatar
                        size={32}
                        src={member.userAvatar}
                        icon={<UserOutlined />}
                        style={{ backgroundColor: '#ccc', marginBottom: 4, cursor: 'pointer' }}
                    >
                        {!member.userAvatar && member.userName?.charAt(0).toUpperCase()}
                    </Avatar>
                    <Text
                        style={{ fontSize: 12, width: '100%' }}
                        ellipsis={{ tooltip: member.userName }}
                    >
                        {member.userName}
                    </Text>
                </div>
            ))}
        </div>
    );


    return (
        <>
            <div
                ref={containerRef}
                style={{
                    display: "grid",
                    gridTemplateColumns: `repeat(${columns}, ${AVATAR_SIZE}px)`,
                    gap: GAP,
                    maxHeight: ROWS * AVATAR_SIZE + GAP * (ROWS - 1),
                }}
            >
                {[...members]
                    .sort((a, b) => {
                        if (a.isOwner && !b.isOwner) return -1;
                        if (!a.isOwner && b.isOwner) return 1;
                        return 0;
                    })
                    .slice(0, maxShowCount - (showMore ? 1 : 0))
                    .map((member) => (
                        <div
                            key={member.id}
                            style={{ textAlign: "center", position: "relative", height: AVATAR_SIZE }}
                        >
                            {member.isOwner && (
                                <div
                                    style={{
                                        position: "absolute",
                                        top: 0,
                                        left: "50%",
                                        transform: "translate(-50%, -50%)",
                                        backgroundColor: "rgba(253, 75, 15, 0.85)",
                                        color: "#fff",
                                        borderRadius: 4,
                                        padding: "0 6px",
                                        fontSize: 12,
                                        fontWeight: "bold",
                                        zIndex: 10,
                                        pointerEvents: "none",
                                        whiteSpace: "nowrap",
                                    }}
                                >
                                    群主
                                </div>
                            )}
                            <Tooltip title={member.userName}>
                                <Avatar
                                    size={AVATAR_SIZE}
                                    src={member.userAvatar}
                                    icon={<UserOutlined />}
                                    style={{ backgroundColor: "#ccc", cursor: "pointer" }}
                                    onClick={() => setSelectedMember(member)}
                                >
                                    {!member.userAvatar && member.userName?.charAt(0).toUpperCase()}
                                </Avatar>
                            </Tooltip>
                        </div>
                    ))}

                {showMore && (
                    <div style={{ textAlign: "center", cursor: "pointer", userSelect: "none", height: AVATAR_SIZE }}>
                        <Popover content={more} trigger="hover" placement="topRight">
                            <Avatar
                                size={AVATAR_SIZE}
                                style={{ backgroundColor: "#999", color: "#fff", fontWeight: "bold" }}
                            >
                                +{members.length - (maxShowCount - 1)}
                            </Avatar>
                        </Popover>
                    </div>
                )}
            </div >

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
                        {!selectedMember.isOwner && user?.id === members.find(item => item.isOwner)?.id &&
                            <ConfigProvider
                                button={{
                                    className: styles.dangerousKickButton,
                                }}
                            >
                                <Button
                                    style={{ width: 120, }}
                                    block
                                    type="primary"
                                    size="large"
                                    icon={<RestOutlined style={{ fontSize: 26 }} />}
                                    onClick={kickMemberHandel}
                                >
                                    踢出
                                </Button>
                            </ConfigProvider>
                        }
                    </Space>
                )}
            </Drawer>
        </>
    );
};

export default MembersGrid;
