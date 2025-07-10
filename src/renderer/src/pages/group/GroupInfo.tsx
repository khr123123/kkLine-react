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
    Dropdown,
    Flex,
    Menu,
    Popconfirm,
    Result,
} from "antd";
import { DeleteOutlined, DownOutlined, UserOutlined, WechatOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { useNavigate, useParams } from "react-router-dom";
import { createStyles } from "antd-style";
import MembersGrid from "@renderer/components/MembersGrid";
import { delGroup, getGroupInfoWithMembers } from "@renderer/api/groupApis";
import { useGlobalReloadStore } from "@renderer/store/useGlobalReloadStore";
const { Title, Text, Paragraph } = Typography;

interface Member {
    name: string;
    avatar?: string;
    isOwner?: boolean;
}

interface GroupData {
    groupName: string | undefined;
    groupAvatar?: string;
    joinType: number | undefined;
    createTime: string | undefined;
    groupNotice?: string;
    members: Member[];
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
    const triggerReload = useGlobalReloadStore(state => state.triggerReload)
    const navigate = useNavigate();
    const fetchGroupInfo = async () => {
        if (!groupId) return;
        setLoading(true);
        try {
            const res = await getGroupInfoWithMembers({ id: groupId });
            const resData = res.data as API.GroupVO;
            const members: Member[] = resData.userVOList?.map((item) => ({
                name: item.userName,
                avatar: item.userAvatar,
                isOwner: resData.groupOwner === item?.id, //  判断是否是群主
            })) as Member[]
            setGroup({
                groupName: resData.groupName,
                groupAvatar: resData.groupAvatar,
                joinType: resData.joinType,
                createTime: resData.createTime,
                groupNotice: resData.groupNotice,
                members,
            });
        } finally {
            setLoading(false);
        }
    };
    useEffect(() => {
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
        return <Result status="404" title="404" subTitle="未找到该群聊" />;
    }


    const handleRemoveGroup = async () => {
        if (!groupId) return;
        const hide = message.loading(`正在删除群聊 [${group.groupName}]...`, 0);
        try {
            const res = await delGroup({ id: groupId }) as API.BaseResponseGroupVO
            if (res.code === 0) {
                hide();
                message.success(`群聊「${group.groupName}」已成功删除`);
                triggerReload('groupList')
                navigate('/groups')
            }
        } catch (e) {
            hide();
            message.error("删除失败，请稍后重试");
        }
    };

    const menu = (
        <Menu>
            <Menu.Item key="1">
                <Popconfirm
                    title="确认删除该群聊？"
                    description="删除后无法恢复，是否继续？"
                    okText="确认"
                    cancelText="取消"
                    onConfirm={handleRemoveGroup}
                >
                    <Space>
                        <DeleteOutlined />
                        删除群聊
                    </Space>
                </Popconfirm>
            </Menu.Item>
            <Menu.Item key="2" onClick={() => message.info('点击了...')}>
                ...
            </Menu.Item>
        </Menu>
    );
    return (
        <Card style={{ width: "calc(100% - 40px)", borderRadius: 16, margin: "0 auto", marginTop: 26 }}>
            <Flex justify="space-between" align="center" style={{ width: '100%' }}>
                <Flex align="center" gap={16}>
                    <Avatar
                        size={64}
                        src={group.groupAvatar}
                        icon={<UserOutlined />}
                        style={{ flexShrink: 0 }}
                    />
                    <Flex vertical justify="center">
                        <Space size="small" align="center">
                            <Title level={4} style={{ margin: 0 }}>{group.groupName}</Title>
                            {
                                group.joinType === 0
                                    ? <Tag color="green">直接加入</Tag>
                                    : <Tag color="orange">管理员同意</Tag>
                            }
                        </Space>
                        <Text type="secondary" style={{ fontSize: 14 }}>
                            ID: {groupId}<br />创建时间：{dayjs(group.createTime).format("YYYY年MM月DD日")}
                        </Text>
                    </Flex>
                </Flex>
                <Dropdown overlay={menu} trigger={['click']}>
                    <a onClick={(e) => e.preventDefault()}>
                        <Space>
                            操作菜单 <DownOutlined />
                        </Space>
                    </a>
                </Dropdown>
            </Flex>
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
