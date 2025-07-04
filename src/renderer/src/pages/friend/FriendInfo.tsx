import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
    Card,
    Avatar,
    Typography,
    Space,
    Tag,
    Button,
    Divider,
    Spin,
    Descriptions,
    ConfigProvider,
    message,
} from "antd";
import {
    ManOutlined,
    WomanOutlined,
    QuestionOutlined,
    WechatOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { createStyles } from "antd-style";
const { Title, Text, Paragraph } = Typography;

interface UserProfile {
    userName: string;
    userAvatar?: string;
    userSex: 0 | 1 | 2;
    userEmail?: string;
    userAccount: string;
    areaName?: string;
    areaCode?: string;
    userProfile?: string;
    lastLogOutTime: string;
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

const FriendInfo: React.FC = () => {
    const { friendId } = useParams();
    const [user, setUser] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const { styles } = useStyle();

    useEffect(() => {
        if (!friendId) return;

        const fetchUser = async () => {
            setLoading(true);
            try {
                const res = await new Promise<UserProfile>((resolve) =>
                    setTimeout(() => {
                        resolve({
                            userName: "况浩然",
                            userAvatar: "https://i.pravatar.cc/40?img=10",
                            userSex: 0,
                            userEmail: "khr@example.com",
                            userAccount: "khr123",
                            areaName: "神奈川県横浜市",
                            areaCode: "123-4567",
                            userProfile: "热爱全栈开发，熟悉 Java、React、Netty 等。热爱全栈开发，熟悉 Java、React、Netty 等。热爱全栈开发，熟悉 Java、React、Netty 等。热爱全栈开发，熟悉 Java、React、Netty 等。",
                            lastLogOutTime: "2025-07-04T10:24:00",
                        });
                    }, 200)
                );
                setUser(res);
            } catch (err) {
                console.error("用户获取失败", err);
            } finally {
                setLoading(false);
            }
        };

        fetchUser();
    }, [friendId]);

    if (loading) {
        return (
            <div style={{ textAlign: "center", padding: 60 }}>
                <Spin size="large" tip="加载用户信息中..." />
            </div>
        );
    }

    if (!user) {
        return <div style={{ textAlign: "center", padding: 60 }}>未找到用户信息</div>;
    }

    const renderSexIcon = () => {
        switch (user.userSex) {
            case 0:
                return <Tag icon={<WomanOutlined />} color="magenta">女</Tag>;
            case 1:
                return <Tag icon={<ManOutlined />} color="blue">男</Tag>;
            default:
                return <Tag icon={<QuestionOutlined />} color="default">未知</Tag>;
        }
    };

    return (
        <Card style={{ width: "calc(100% - 40px)", borderRadius: 16, margin: "0 auto", marginTop: 26 }}>
            {/* 头像居中 */}
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 2 }}>
                <Avatar size={84} src={user.userAvatar} >
                    {!user.userAvatar && user.userName.charAt(0)}
                </Avatar>
            </div>
            {/* 昵称 + 性别标签 */}
            <div style={{ textAlign: "center", }}>
                <Space>
                    <Title level={4} style={{ margin: 0 }}>{user.userName}</Title>
                    {renderSexIcon()}
                </Space>
            </div>

            <Divider size={"middle"} />

            <Descriptions column={1} size="small">
                <Descriptions.Item label="账号">{user.userAccount}</Descriptions.Item>
                <Descriptions.Item label="邮箱">{friendId || "—"}</Descriptions.Item>
                <Descriptions.Item label="地区">
                    {user.areaName || "—"}（{user.areaCode || "无"}）
                </Descriptions.Item>
                <Descriptions.Item label="最后登录">
                    {dayjs(user.lastLogOutTime).format("YYYY年MM月DD日 HH:mm")}
                </Descriptions.Item>
            </Descriptions>

            {user.userProfile && (
                <>
                    <Divider size={"middle"} />
                    <Text strong>个人简介</Text>
                    <Paragraph style={{ marginTop: 8 }} ellipsis={{ rows: 2, expandable: true, symbol: "更多" }}>
                        {user.userProfile}
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

export default FriendInfo;
