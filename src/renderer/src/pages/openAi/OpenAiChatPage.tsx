import React, { useState, useEffect, useRef } from 'react';
import { Bubble, Welcome, Prompts, Sender, Attachments } from '@ant-design/x';
import { Button, Space, Spin, message, Flex } from 'antd';
import {
    ReloadOutlined,
    CopyOutlined,
    LikeOutlined,
    DislikeOutlined,
    PaperClipOutlined,
    CloudUploadOutlined,
    ScheduleOutlined,
    ProductOutlined,
    FileSearchOutlined,
    AppstoreAddOutlined,
} from '@ant-design/icons';
import { simpleChat } from '@renderer/api/aiApis';


const HOT_TOPICS = {
    key: '1',
    label: 'Hot Topics',
    children: [
        { key: '1-1', description: 'What has Ant Design X upgraded?', icon: <span style={{ color: '#f93a4a', fontWeight: 700 }}>1</span> },
        { key: '1-2', description: 'New AGI Hybrid Interface', icon: <span style={{ color: '#ff6565', fontWeight: 700 }}>2</span> },
    ],
};

const DESIGN_GUIDE = {
    key: '2',
    label: 'Design Guide',
    children: [
        { key: '2-1', icon: <LikeOutlined />, label: 'Intention', description: 'AI understands user needs and provides solutions.' },
        { key: '2-2', icon: <LikeOutlined />, label: 'Role', description: "AI's public persona and image" },
    ],
};

const SENDER_PROMPTS = [
    { key: '1', description: 'Upgrades', icon: <ScheduleOutlined /> },
    { key: '2', description: 'Components', icon: <ProductOutlined /> },
    { key: '3', description: 'RICH Guide', icon: <FileSearchOutlined /> },
    { key: '4', description: 'Installation Introduction', icon: <AppstoreAddOutlined /> },
];

const ChatArea: React.FC = () => {
    const [attachmentsOpen, setAttachmentsOpen] = useState(false);
    const [attachedFiles, setAttachedFiles] = useState<any[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [messages, setMessages] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    // ✅ 真正调用后端 AI
    const onSubmit = async (val: string) => {
        if (!val.trim()) {
            message.warning('Please enter a message');
            return;
        }
        if (loading) {
            message.error('Request in progress, please wait');
            return;
        }
        // 添加用户消息与AI占位消息
        setMessages((prev) => [
            ...prev,
            { message: { role: 'user', content: val }, status: 'done' },
            { message: { role: 'assistant', content: '', loading: true }, status: 'loading' },
        ]);
        setLoading(true);
        setInputValue('');
        try {
            const response = await simpleChat({ query: val });
            const data = response; // 后端返回纯文本
            setMessages((prev) =>
                prev.map((msg) =>
                    msg.status === 'loading' && msg.message.role === 'assistant'
                        ? { message: { role: 'assistant', content: data, loading: false }, status: 'done' }
                        : msg
                )
            );
        } catch (error) {
            console.error(error);
            message.error('Failed to get AI response');
            setMessages((prev) =>
                prev.map((msg) =>
                    msg.status === 'loading' && msg.message.role === 'assistant'
                        ? { message: { role: 'assistant', content: 'Error: failed to fetch response.' }, status: 'done' }
                        : msg
                )
            );
        } finally {
            setLoading(false);
        }
    };

    const onCancel = () => {
        if (loading) {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
                timeoutRef.current = null;
            }
            setMessages((prev) =>
                prev.map((msg) =>
                    msg.status === 'loading' && msg.message.role === 'assistant'
                        ? { message: { role: 'assistant', content: 'Request cancelled.' }, status: 'done' }
                        : msg,
                ),
            );
            setLoading(false);
        }
    };

    const senderHeader = (
        <Sender.Header
            title="Upload File"
            open={attachmentsOpen}
            onOpenChange={setAttachmentsOpen}
            styles={{ content: { padding: 0 } }}
        >
            <Attachments
                beforeUpload={() => false}
                items={attachedFiles}
                onChange={(info) => setAttachedFiles(info.fileList)}
                placeholder={(type) =>
                    type === 'drop'
                        ? { title: 'Drop file here' }
                        : {
                            icon: <CloudUploadOutlined />,
                            title: 'Upload files',
                            description: 'Click or drag files to this area to upload',
                        }
                }
            />
        </Sender.Header>
    );

    return (
        <div style={{ flex: 1, maxHeight: '95vh', display: 'flex', flexDirection: 'column', padding: 24, paddingRight: 6, paddingBottom: 8 }}>
            {messages.length ? (
                <Bubble.List
                    items={messages.map((i) => ({
                        ...i.message,
                        classNames: { content: i.status === 'loading' ? 'loadingMessage' : '' },
                        typing: i.status === 'loading' ? { step: 5, interval: 20, suffix: <>💗</> } : false,
                    }))}
                    style={{ flex: 1, overflow: 'auto', paddingInline: 'calc(calc(100% - 700px) /2)' }}
                    roles={{
                        assistant: {
                            placement: 'start',
                            footer: (
                                <div style={{ display: 'flex' }}>
                                    <Button type="text" size="small" icon={<ReloadOutlined />} />
                                    <Button type="text" size="small" icon={<CopyOutlined />} />
                                    <Button type="text" size="small" icon={<LikeOutlined />} />
                                    <Button type="text" size="small" icon={<DislikeOutlined />} />
                                </div>
                            ),
                            loadingRender: () => <Spin size="small" />,
                        },
                        user: { placement: 'end' },
                    }}
                />
            ) : (
                <Space direction="vertical" size={16} style={{ flex: 1, paddingInline: 'calc(calc(100% - 700px) /2)' }}>
                    <Welcome
                        variant="borderless"
                        icon="https://mdn.alipayobjects.com/huamei_iwk9zp/afts/img/A*s5sNRo5LjfQAAAAAAAAAAAAADgCCAQ/fmt.webp"
                        title="Hello, I'm Ant Design X"
                        description="Base on Ant Design, AGI product interface solution, create a better intelligent vision~"
                        extra={
                            <Space>
                                <Button icon={<DislikeOutlined />} />
                                <Button icon={<ReloadOutlined />} />
                            </Space>
                        }
                    />
                    <Flex gap={16}>
                        <Prompts items={[HOT_TOPICS]} onItemClick={(info) => onSubmit(info.data.description as string)} />
                        <Prompts items={[DESIGN_GUIDE]} onItemClick={(info) => onSubmit(info.data.description as string)} />
                    </Flex>
                </Space>
            )}

            <Prompts items={SENDER_PROMPTS} onItemClick={(info) => onSubmit(info.data.description as string)} style={{ padding: '8px 0' }} />

            <Sender
                value={inputValue}
                header={senderHeader}
                onSubmit={() => onSubmit(inputValue)}
                onChange={setInputValue}
                onCancel={onCancel}
                prefix={
                    <Button
                        type="text"
                        icon={<PaperClipOutlined style={{ fontSize: 18 }} />}
                        onClick={() => setAttachmentsOpen(!attachmentsOpen)}
                    />
                }
                loading={loading}
                allowSpeech
            />
        </div>
    );
};

export default ChatArea;
