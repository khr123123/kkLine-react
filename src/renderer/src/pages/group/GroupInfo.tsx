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
    Modal,
} from "antd";
import { DeleteOutlined, DownOutlined, EditOutlined, LogoutOutlined, UserOutlined, WechatOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { useNavigate, useParams } from "react-router-dom";
import { createStyles } from "antd-style";
import MembersGrid, { GroupMember } from "@renderer/components/MembersGrid";
import { delGroup, editGroup, getGroupInfoWithMembers } from "@renderer/api/groupApis";
import { useGlobalReloadStore } from "@renderer/store/useGlobalReloadStore";
import GroupForm from "@renderer/components/GroupForm";
import { useUserStore } from "@renderer/store/useUserStore";
import { checkRelation, delContact } from "@renderer/api/contactApis";
const { Title, Text, Paragraph } = Typography;

interface GroupData {
    groupName: string | undefined;
    groupAvatar?: string;
    joinType: number | undefined;
    createTime: string | undefined;
    groupNotice?: string;
    isOner: boolean;
    members: GroupMember[];
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
    //全局事件触发器
    const triggerReload = useGlobalReloadStore(state => state.triggerReload)
    //全局事件接收器
    const reloadCount = useGlobalReloadStore(state => state.reloadMap['groupList'] || 0)
    const user = useUserStore(state => state.user);
    const navigate = useNavigate();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const fetchGroupInfo = async () => {
        if (!groupId) return;
        setLoading(true);
        try {
            const res = await getGroupInfoWithMembers({ id: groupId });
            const resData = res.data as API.GroupVO;
            const members: GroupMember[] = resData.userVOList?.map((item) => ({
                ...item,
                isOwner: resData.groupOwner === item?.id,
            })) as GroupMember[]
            setGroup({
                groupName: resData.groupName,
                groupAvatar: resData.groupAvatar,
                joinType: resData.joinType,
                createTime: resData.createTime,
                groupNotice: resData.groupNotice,
                isOner: resData.groupOwner === user?.id,
                members,
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchGroupInfo();
    }, [groupId, reloadCount]);

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
    const handleLeaveGroup = async () => {
        if (!groupId) return;
        const hide = message.loading(`已成功退出群聊「${group.groupName}」...`, 0);
        try {
            const res = await delContact({ contactId: groupId, applyStatus: 2 }) as API.BaseResponseGroupVO
            if (res.code === 0) {
                message.success(`已成功退出群聊「${group.groupName}」`);
                triggerReload('groupList')
                navigate('/groups')
            } else {
                message.error(res.message);
            }
            hide();
        } catch (e) {
            hide();
            message.error("退出失败，请稍后重试");
        }
    };

    const handleCancel = () => setIsModalOpen(false);
    const menu = () => {
        return !group.isOner ? (
            <Menu>
                <Menu.Item key="1">
                    <Popconfirm
                        title="确认退出该群聊？"
                        description="退出后无法恢复，是否继续？"
                        okText="确认"
                        cancelText="取消"
                        onConfirm={handleLeaveGroup}
                    >
                        <Space>
                            <LogoutOutlined />
                            退出该群
                        </Space>
                    </Popconfirm>
                </Menu.Item>
            </Menu>
        ) : (
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
                <Menu.Item key="2" onClick={() => setIsModalOpen(true)} icon={<EditOutlined />}>
                    编辑群聊
                </Menu.Item>
            </Menu>
        );
    };
    return (
        <>
            <Modal
                title="修改群组"
                closable={{ 'aria-label': 'Custom Close Button' }}
                open={isModalOpen}
                onCancel={handleCancel}
                footer={null} // 表单组件自己控制提交
            >
                <GroupForm
                    initialValues={group}
                    onSubmit={async (data) => {
                        try {
                            const res = await editGroup({ id: groupId!, ...data }) as API.BaseResponseGroupVO
                            if (res.code === 0) {
                                message.success('群聊修改!');
                                setIsModalOpen(false);
                                triggerReload('groupList')
                                fetchGroupInfo()
                            } else {
                                message.error(`群聊修改失败,${res.message}.`);
                            }
                        } catch (e) {
                            message.error('群聊修改失败' + e);
                        }
                    }}
                />
            </Modal>
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
                            onClick={async () => {
                                if (!groupId) return
                                const res = await checkRelation({ contactId: groupId }) as API.BaseResponseChatSessionVO
                                if (res.code !== 0) {
                                    message.error(res.message)
                                    return
                                }
                                const chatSession = res.data
                                window.electron.ipcRenderer.invoke('user-goto-session', chatSession).then((sessionId) => {
                                    navigate('/sessions/' + sessionId)
                                });
                            }}
                        >
                            发消息
                        </Button>
                    </ConfigProvider>
                </Space>
            </Card>

        </>
    );
};

export default GroupInfo;
