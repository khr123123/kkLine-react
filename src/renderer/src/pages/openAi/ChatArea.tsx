import React, { useState, useEffect } from 'react';
import { Bubble, Welcome, Prompts, Sender } from '@ant-design/x';
import { Button, Space, Spin, message } from 'antd';
import {
    ReloadOutlined,
    CopyOutlined,
    LikeOutlined,
    DislikeOutlined,
    BulbOutlined,
    FileTextOutlined,
    QuestionCircleOutlined,
} from '@ant-design/icons';
import { aiChat } from '@renderer/api/aiApis';
import { useUserStore } from '@renderer/store/useUserStore';

interface ChatAreaProps {
    sessionId: number | null;
    initialMessages: any[];
    onMessagesUpdate: (messages: any[]) => void;
}

// 快捷提示词
const QUICK_PROMPTS = [
    { key: '1', description: '帮我写一篇文章', icon: <FileTextOutlined /> },
    { key: '2', description: '解答技术问题', icon: <QuestionCircleOutlined /> },
    { key: '3', description: '创意灵感', icon: <BulbOutlined /> },
];

const ChatArea: React.FC<ChatAreaProps> = ({ sessionId, initialMessages, onMessagesUpdate }) => {
    const [inputValue, setInputValue] = useState('');
    const [messages, setMessages] = useState<any[]>(initialMessages);
    const [loading, setLoading] = useState(false);
    const userInfo = useUserStore().user

    useEffect(() => {
        setMessages(initialMessages);
    }, [initialMessages]);

    useEffect(() => {
        onMessagesUpdate(messages);
    }, [messages]);

    const onSubmit = async (val: string) => {
        if (!val.trim()) {
            message.warning('请输入消息');
            return;
        }
        if (!sessionId) {
            message.warning('请先创建或选择会话');
            return;
        }
        if (loading) {
            message.error('请等待当前请求完成');
            return;
        }

        setMessages((prev) => [
            ...prev,
            { message: { role: 'user', content: val }, status: 'done' },
            { message: { role: 'assistant', content: '', loading: true }, status: 'loading' },
        ]);
        setLoading(true);
        setInputValue('');

        try {
            const response = await aiChat({ prompt: val, sessionId });
            setMessages((prev) =>
                prev.map((msg) =>
                    msg.status === 'loading' && msg.message.role === 'assistant'
                        ? { message: { role: 'assistant', content: response, loading: false }, status: 'done' }
                        : msg
                )
            );
        } catch (error) {
            console.error(error);
            message.error('获取AI回复失败');
            setMessages((prev) =>
                prev.map((msg) =>
                    msg.status === 'loading' && msg.message.role === 'assistant'
                        ? { message: { role: 'assistant', content: '抱歉，获取回复失败，请稍后重试。' }, status: 'done' }
                        : msg
                )
            );
        } finally {
            setLoading(false);
        }
    };

    const copyMessage = (content: string) => {
        navigator.clipboard.writeText(content);
        message.success('已复制到剪贴板');
    };

    return (
        <div style={{
            flex: 1,
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
            padding: 24,
            paddingTop: 52,
            paddingRight: 6,
            paddingBottom: 8,
            background: '#ffffff'
        }}>
            {messages.length && sessionId ? (
                <Bubble.List
                    items={messages.map((i) => ({
                        ...i.message,
                        classNames: { content: i.status === 'loading' ? 'loadingMessage' : '' },
                        typing: i.status === 'loading' ? { step: 5, interval: 20, suffix: <>✨</> } : false,
                    }))}
                    style={{
                        flex: 1,
                        overflow: 'auto',
                        paddingInline: 'calc((100% - 800px) / 2)',
                        marginBottom: 16
                    }}
                    roles={{
                        ASSISTANT: {
                            placement: 'start',
                            avatar: {
                                icon: '🤖',
                                style: {
                                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                }
                            },
                            footer: (_, { content }) => (
                                <Space size={4}>
                                    <Button
                                        type="text"
                                        size="small"
                                        icon={<ReloadOutlined />}
                                        onClick={() => message.info('重新生成功能开发中')}
                                    />
                                    <Button
                                        type="text"
                                        size="small"
                                        icon={<CopyOutlined />}
                                        onClick={() => copyMessage(content as string)}
                                    />
                                    <Button type="text" size="small" icon={<LikeOutlined />} />
                                    <Button type="text" size="small" icon={<DislikeOutlined />} />
                                </Space>
                            ),
                            loadingRender: () => (
                                <Space>
                                    <Spin size="small" />
                                    <span style={{ color: '#999', fontSize: 12 }}>思考中...</span>
                                </Space>
                            ),
                        },
                        USER: {
                            placement: 'end',
                            avatar: {
                                src: userInfo?.userAvatar,
                                style: {
                                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                }
                            }
                        },
                    }}
                />
            ) : (
                <Space
                    direction="vertical"
                    size={24}
                    style={{
                        flex: 1,
                        paddingInline: 'calc((100% - 700px) / 2)',
                        display: 'flex',
                        justifyContent: 'center'
                    }}
                >
                    <Welcome
                        variant="borderless"
                        icon={
                            <div style={{
                                width: 64,
                                height: 64,
                                borderRadius: '50%',
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: 32,
                            }}>
                                🤖
                            </div>
                        }
                        title={<span style={{ fontSize: 24, fontWeight: 600 }}>你好，我是 AI 智能助手</span>}
                        description={
                            <span style={{ fontSize: 14, color: '#666' }}>
                                我可以帮你解答问题、写作、翻译、编程等，有什么可以帮到你的吗？
                            </span>
                        }
                        extra={
                            <Space>
                                <Button icon={<LikeOutlined />} type="text">赞</Button>
                                <Button icon={<ReloadOutlined />} type="text">刷新</Button>
                            </Space>
                        }
                        style={{
                            background: 'linear-gradient(180deg, rgba(102, 126, 234, 0.03) 0%, rgba(118, 75, 162, 0.03) 100%)',
                            borderRadius: 16,
                            padding: 40,
                        }}
                    />
                </Space>
            )}

            {sessionId && (
                <Prompts
                    items={QUICK_PROMPTS}
                    onItemClick={(info) => onSubmit(info.data.description as string)}
                    style={{
                        padding: '12px 0',
                        paddingInline: 'calc((100% - 800px) / 2)',
                    }}
                    wrap
                />
            )}

            <div style={{ paddingInline: 'calc((100% - 800px) / 2)' }}>
                <Sender
                    value={inputValue}
                    onSubmit={() => onSubmit(inputValue)}
                    onChange={setInputValue}
                    loading={loading}
                    placeholder={sessionId ? "输入消息，按 Enter 发送..." : "请先选择或创建会话"}
                    disabled={!sessionId}
                    style={{
                        borderRadius: 12,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                    }}
                />
            </div>
        </div>
    );
};

export default ChatArea;
