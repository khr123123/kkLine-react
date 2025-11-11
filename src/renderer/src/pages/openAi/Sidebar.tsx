import React, { useState, useEffect } from 'react';
import { Button, Avatar, Spin } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, QuestionCircleOutlined, RobotOutlined } from '@ant-design/icons';
import { Conversations } from '@ant-design/x';
import { getHistoryChatList, getHistoryChatDetail } from '@renderer/api/aiApis';

interface SidebarProps {
    onConversationChange: (sessionId: number, messages: any[]) => void;
    currentSessionId: number | null;
}

const Sidebar: React.FC<SidebarProps> = ({ onConversationChange, currentSessionId }) => {
    const [conversations, setConversations] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    // 加载会话列表
    const loadConversations = async () => {
        setLoading(true);
        try {
            const sessions = await getHistoryChatList({ type: 'chat' });

            const convs = sessions.map((session) => {
                const date = new Date(session.createdTime);
                const now = new Date();
                const isToday = date.toDateString() === now.toDateString();

                const yesterday = new Date();
                yesterday.setDate(now.getDate() - 1);
                const isYesterday = date.toDateString() === yesterday.toDateString();

                return {
                    key: session.id.toString(),
                    label: session.title || `会话 ${session.id}`,
                    group: isToday ? '今天' : isYesterday ? '昨天' : date.toISOString().slice(0, 10),
                };
            });

            setConversations(convs);

            if (convs.length > 0 && !currentSessionId) {
                loadConversationDetail(sessions[0].id);
            }
        } catch (error) {
            console.error('加载会话列表失败:', error);
        } finally {
            setLoading(false);
        }
    };


    // 加载会话详情
    const loadConversationDetail = async (sessionId: number) => {
        try {
            const messages = await getHistoryChatDetail({ type: 'chat', sessionId });
            const formattedMessages = messages.map((msg: any) => ({
                message: { role: msg.messageType, content: msg.text },
                status: 'done'
            }));
            onConversationChange(sessionId, formattedMessages);
        } catch (error) {
            console.error('加载会话详情失败:', error);
            onConversationChange(sessionId, []);
        }
    };

    useEffect(() => {
        loadConversations();
    }, []);

    const onAddConversation = () => {
        const newSessionId = Date.now();
        const newConv = {
            key: newSessionId.toString(),
            label: `新会话`,
            group: '今天'
        };
        setConversations([newConv, ...conversations]);
        onConversationChange(newSessionId, []);
    };

    const onDeleteConversation = (key: string) => {
        const newList = conversations.filter((item) => item.key !== key);
        setConversations(newList);

        if (key === currentSessionId?.toString() && newList.length > 0) {
            loadConversationDetail(parseInt(newList[0].key));
        }
    };

    return (
        <div
            style={{
                background: 'linear-gradient(180deg, #fafafa 0%, #f0f2f5 100%)',
                width: 220,
                height: '100vh',
                display: 'flex',
                flexDirection: 'column',
                padding: 12,
                boxSizing: 'border-box',
                borderRight: '1px solid rgba(5, 5, 5, 0.06)',
            }}
        >
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    margin: '20px 0',
                    padding: '0 16px',
                }}
            >
                <RobotOutlined style={{ fontSize: 24, color: '#1677ff' }} />
                <span style={{ fontWeight: 'bold', fontSize: 16, background: 'linear-gradient(135deg, #1677ff 0%, #69b1ff 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    AI 智能助手
                </span>
            </div>

            <Button
                icon={<PlusOutlined />}
                type="link"
                style={{
                    background: 'linear-gradient(135deg, #1677ff0f 0%, #69b1ff0f 100%)',
                    border: '1px solid #1677ff34',
                    height: 40,
                    marginBottom: 12,
                    borderRadius: 8,
                    fontWeight: 500,
                }}
                onClick={onAddConversation}
            >
                新建对话
            </Button>

            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
                    <Spin />
                </div>
            ) : (
                <Conversations
                    items={conversations}
                    activeKey={currentSessionId?.toString()}
                    onActiveChange={(key) => loadConversationDetail(parseInt(key))}
                    groupable
                    menu={(conversation) => ({
                        items: [
                            { label: '重命名', key: 'rename', icon: <EditOutlined /> },
                            {
                                label: '删除',
                                key: 'delete',
                                danger: true,
                                icon: <DeleteOutlined />,
                                onClick: () => onDeleteConversation(conversation.key),
                            },
                        ],
                    })}
                    style={{
                        flex: 1,
                        overflowY: 'auto',
                        paddingInlineStart: 0,
                    }}
                />
            )}

            <div
                style={{
                    borderTop: '1px solid rgba(5, 5, 5, 0.06)',
                    height: 48,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0 8px',
                }}
            >
                <Avatar size={32} style={{ background: 'linear-gradient(135deg, #1677ff 0%, #69b1ff 100%)' }}>U</Avatar>
                <Button type="text" icon={<QuestionCircleOutlined />} />
            </div>
        </div>
    );
};

export default Sidebar;
