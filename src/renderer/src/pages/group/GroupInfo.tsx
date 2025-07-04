import React, { useEffect, useState } from "react";
import {
    Avatar,
    Card,
    Space,
    Tag,
    Typography,
    Spin,
    Divider,
    ConfigProvider,
    Button,
    message,
} from "antd";
import { UserOutlined, WechatOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { useParams } from "react-router-dom";
import { createStyles } from "antd-style";
import MembersGrid from "@renderer/components/MembersGrid";
const { Title, Text, Paragraph } = Typography;

interface GroupMember {
    name: string;
    avatar?: string;
    isOwner?: boolean;
}

interface GroupData {
    groupName: string;
    groupAvatar?: string;
    joinType: 0 | 1;
    createTime: string;
    members: GroupMember[];
    groupNotice?: string;
}
const useStyle = createStyles(({ prefixCls, css }) => ({
    linearGradientButton: css`
    &.${prefixCls}-btn-primary:not([disabled]):not(.${prefixCls}-btn-dangerous) {
      > span {
        position: relative;
      }

      &::before {
        content: '';
        background: linear-gradient(135deg, #6253e1, #04befe);
        position: absolute;
        inset: -1px;
        opacity: 1;
        transition: all 0.3s;
        border-radius: inherit;
      }

      &:hover::before {
        opacity: 0;
      }
    }
  `,
}));
const GroupInfo: React.FC = () => {
    const [group, setGroup] = useState<GroupData | null>(null);
    const [loading, setLoading] = useState(true);
    const { groupId } = useParams();
    const { styles } = useStyle();

    useEffect(() => {
        const fetchGroupInfo = async () => {
            setLoading(true);
            try {
                const res = await new Promise<GroupData>((resolve) =>
                    setTimeout(() => {
                        resolve({
                            groupName: "Netty 技术交流群",
                            groupAvatar: "https://i.pravatar.cc/100?img=12",
                            joinType: 1,
                            createTime: "2024-11-20T15:30:00",
                            members: [
                                { name: "Alice", avatar: "https://i.pravatar.cc/40?img=3", isOwner: true },
                                { name: "Bob", avatar: "https://i.pravatar.cc/40?img=5" },
                                { name: "Cindy", avatar: "https://i.pravatar.cc/40?img=6" },
                                { name: "David", avatar: "https://i.pravatar.cc/40?img=7" },
                                { name: "Eva", avatar: "https://i.pravatar.cc/40?img=8" },
                                { name: "Frank", avatar: "https://i.pravatar.cc/40?img=9" },
                                { name: "Grace", avatar: "https://i.pravatar.cc/40?img=10" },
                                { name: "Grace", avatar: "https://i.pravatar.cc/40?img=10" },
                                { name: "Grace", avatar: "https://i.pravatar.cc/40?img=10" },
                                { name: "Grace", avatar: "https://i.pravatar.cc/40?img=10" },
                                { name: "Grace", avatar: "https://i.pravatar.cc/40?img=10" },
                                { name: "Grace", avatar: "https://i.pravatar.cc/40?img=10" }, { name: "Grace", avatar: "https://i.pravatar.cc/40?img=10" },
                                { name: "Grace", avatar: "https://i.pravatar.cc/40?img=10" },
                                { name: "Grace", avatar: "https://i.pravatar.cc/40?img=10" },
                                { name: "Grace", avatar: "https://i.pravatar.cc/40?img=10" }, { name: "Grace", avatar: "https://i.pravatar.cc/40?img=10" },
                                { name: "Grace", avatar: "https://i.pravatar.cc/40?img=10" },
                                { name: "Grace", avatar: "https://i.pravatar.cc/40?img=10" },
                                { name: "Grace", avatar: "https://i.pravatar.cc/40?img=10" }, { name: "Grace", avatar: "https://i.pravatar.cc/40?img=10" },
                                { name: "Grace", avatar: "https://i.pravatar.cc/40?img=10" },
                                { name: "Grace", avatar: "https://i.pravatar.cc/40?img=10" },
                                { name: "Grace", avatar: "https://i.pravatar.cc/40?img=10" },
                                { name: "Grace", avatar: "https://i.pravatar.cc/40?img=10" },
                                { name: "Grace", avatar: "https://i.pravatar.cc/40?img=10" }, { name: "Grace", avatar: "https://i.pravatar.cc/40?img=10" },
                                { name: "Grace", avatar: "https://i.pravatar.cc/40?img=10" },
                                { name: "Grace", avatar: "https://i.pravatar.cc/40?img=10" },
                                { name: "Grace", avatar: "https://i.pravatar.cc/40?img=10" }, { name: "Grace", avatar: "https://i.pravatar.cc/40?img=10" },
                                { name: "Grace", avatar: "https://i.pravatar.cc/40?img=10" },
                                { name: "Grace", avatar: "https://i.pravatar.cc/40?img=10" },
                                { name: "Grace", avatar: "https://i.pravatar.cc/40?img=10" }, { name: "Grace", avatar: "https://i.pravatar.cc/40?img=10" },
                                { name: "Grace", avatar: "https://i.pravatar.cc/40?img=10" },
                                { name: "Grace", avatar: "https://i.pravatar.cc/40?img=10" },
                                { name: "Grace", avatar: "https://i.pravatar.cc/40?img=10" },
                                { name: "Grace", avatar: "https://i.pravatar.cc/40?img=10" },
                                { name: "Grace", avatar: "https://i.pravatar.cc/40?img=10" }, { name: "Grace", avatar: "https://i.pravatar.cc/40?img=10" },
                                { name: "Grace", avatar: "https://i.pravatar.cc/40?img=10" },
                                { name: "Grace", avatar: "https://i.pravatar.cc/40?img=10" },
                                { name: "Grace", avatar: "https://i.pravatar.cc/40?img=10" }, { name: "Grace", avatar: "https://i.pravatar.cc/40?img=10" },
                                { name: "Grace", avatar: "https://i.pravatar.cc/40?img=10" },
                                { name: "Grace", avatar: "https://i.pravatar.cc/40?img=10" },
                                { name: "Grace", avatar: "https://i.pravatar.cc/40?img=10" }, { name: "Grace", avatar: "https://i.pravatar.cc/40?img=10" },
                            ],
                            groupNotice: "请大家文明交流，不允许发布广告或不当言论。",
                        });
                    }, 500)
                );
                setGroup(res);
            } finally {
                setLoading(false);
            }
        };

        fetchGroupInfo();
    }, [groupId]);

    if (loading) {
        return (
            <div style={{ textAlign: "center", padding: 60 }}>
                <Spin size="large" tip="加载群信息中..." />
            </div>
        );
    }

    if (!group) {
        return <div style={{ textAlign: "center", padding: 60 }}>未找到群信息</div>;
    }

    const renderJoinTag = () =>
        group.joinType === 0 ? (
            <Tag color="green">直接加入</Tag>
        ) : (
            <Tag color="orange">管理员同意</Tag>
        );

    return (
        <Card style={{ width: "calc(100% - 40px)", borderRadius: 16, margin: "0 auto", marginTop: 26 }}>
            {/* 群头像 + 群名称信息 */}
            <Space align="start">
                <Avatar size={64} src={group.groupAvatar} icon={<UserOutlined />} />
                <Space direction="vertical" size={4}>
                    <Space>
                        <Title level={4} style={{ margin: 0 }}>
                            {group.groupName}（ID: {groupId}）
                        </Title>
                        {renderJoinTag()}
                    </Space>
                    <Text type="secondary">
                        创建时间：{dayjs(group.createTime).format("YYYY年MM月DD日 HH:mm")}
                    </Text>
                </Space>
            </Space>

            <Divider />

            {/* 群成员 */}
            <div style={{ marginBottom: 16 }}>
                <Text strong>
                    群成员（{group.members.length}人）
                </Text>
                <div style={{ height: 18 }}></div>
                <MembersGrid members={group.members} />
            </div>


            {/* 公告 */}
            {group.groupNotice && (
                <>
                    <Divider />
                    <Text strong>群公告</Text>
                    <Paragraph style={{ marginTop: 8 }} ellipsis={{ rows: 2, expandable: true, symbol: "更多" }}>
                        {group.groupNotice}
                    </Paragraph>
                </>
            )}

            <Divider />

            <Space style={{ justifyContent: "center", width: "100%" }}>
                <ConfigProvider
                    button={{
                        className: styles.linearGradientButton,
                    }}
                >
                    <Button
                        style={{ width: 180 }}
                        block
                        type="primary"
                        size="large"
                        icon={<WechatOutlined style={{ fontSize: 26 }} />}
                        onClick={() => {
                            message.success(`发消息`);
                        }}
                    >
                        发消息
                    </Button>
                </ConfigProvider>
            </Space>
        </Card>
    );
};

export default GroupInfo;
