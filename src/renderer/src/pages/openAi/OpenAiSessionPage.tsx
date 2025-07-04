import React, { useState } from 'react';
import { Button, Avatar,  } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import { Conversations } from '@ant-design/x';
import dayjs from 'dayjs';

const DEFAULT_CONVERSATIONS = [
    { key: 'default-0', label: 'What is Ant Design X?', group: 'Today' },
    { key: 'default-1', label: 'How to quickly install and import components?', group: 'Today' },
    { key: 'default-2', label: 'New AGI Hybrid Interface', group: 'Yesterday' },
];

const DEFAULT_MESSAGES = {
    'default-0': [
        { message: { role: 'assistant', content: 'Ant Design X is a design system and React UI library.' }, status: 'done' },
    ],
    'default-1': [
        { message: { role: 'assistant', content: 'You can install via npm or yarn and import components directly.' }, status: 'done' },
    ],
    'default-2': [
        { message: { role: 'assistant', content: 'AGI Hybrid Interface combines AI chat and functional components.' }, status: 'done' },
    ],
};

const Sidebar: React.FC = () => {
    const [conversations, setConversations] = useState(DEFAULT_CONVERSATIONS);
    const [curConversation, setCurConversation] = useState(DEFAULT_CONVERSATIONS[0].key);
    const [messageHistory, setMessageHistory] = useState<Record<string, any[]>>(DEFAULT_MESSAGES);
    const [messages, setMessages] = useState(DEFAULT_MESSAGES[curConversation] || []);

    // 切换会话时，更新当前消息列表
    const onConversationChange = (key: string) => {
        setCurConversation(key);
        setMessages(messageHistory[key] || []);
    };

    // 新建会话
    const onAddConversation = () => {
        const now = dayjs().valueOf().toString();
        const newConv = { key: now, label: `New Conversation ${conversations.length + 1}`, group: 'Today' };
        const newConvs = [newConv, ...conversations];
        setConversations(newConvs);
        setCurConversation(now);
        setMessageHistory({ ...messageHistory, [now]: [] });
        setMessages([]);
    };

    // 删除会话
    const onDeleteConversation = (key: string) => {
        const newList = conversations.filter((item) => item.key !== key);
        const newMessageHistory = { ...messageHistory };
        delete newMessageHistory[key];

        setConversations(newList);
        setMessageHistory(newMessageHistory);

        if (key === curConversation) {
            const newKey = newList.length > 0 ? newList[0].key : '';
            setCurConversation(newKey);
            setMessages(newMessageHistory[newKey] || []);
        }
    };

    // 这里监听 messages 变化，保持 messageHistory 更新
    React.useEffect(() => {
        setMessageHistory((prev) => ({ ...prev, [curConversation]: messages }));
    }, [messages, curConversation]);

    return (
        <div
            style={{
                background: 'rgba(0,0,0,0.05)',
                width: 280,
                height: '100vh',
                display: 'flex',
                flexDirection: 'column',
                padding: 12,
                boxSizing: 'border-box',
            }}
        >
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    margin: '24px 0',
                    padding: '0 24px',
                }}
            >
                <img
                    src="https://mdn.alipayobjects.com/huamei_iwk9zp/afts/img/A*eco6RrQhxbMAAAAAAAAAAAAADgCCAQ/original"
                    alt="logo"
                    width={24}
                    height={24}
                    draggable={false}
                />
                <span style={{ fontWeight: 'bold', fontSize: 16 }}>Ant Design X</span>
            </div>

            <Button
                icon={<PlusOutlined />}
                type="link"
                style={{
                    background: '#1677ff0f',
                    border: '1px solid #1677ff34',
                    height: 40,
                    marginBottom: 12,
                }}
                onClick={onAddConversation}
            >
                New Conversation
            </Button>

            <Conversations
                items={conversations}
                activeKey={curConversation}
                onActiveChange={onConversationChange}
                groupable
                menu={(conversation) => ({
                    items: [
                        { label: 'Rename', key: 'rename', icon: <EditOutlined /> },
                        {
                            label: 'Delete',
                            key: 'delete',
                            danger: true,
                            icon: <DeleteOutlined />,
                            onClick: () => onDeleteConversation(conversation.key),
                        },
                    ],
                })}
                style={{ flex: 1, overflowY: 'auto', paddingInlineStart: 0 }}
            />

            <div
                style={{
                    borderTop: '1px solid #ddd',
                    height: 40,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                }}
            >
                <Avatar size={24} />
                <Button type="text" icon={<QuestionCircleOutlined />} />
            </div>
        </div>
    );
};

export default Sidebar;
