import { InteractionOutlined, SearchOutlined, WechatOutlined } from '@ant-design/icons';
import { Avatar, Button, Card, Empty, Input, message, Space, Typography } from 'antd';
import React, { useState } from 'react';

const { Title, Text } = Typography;

const MOCK_DATA = {
    G1234: {
        type: 'group',
        name: 'Netty 技术交流群',
        avatar: 'https://i.pravatar.cc/100?img=12',
        desc: '学习 Netty 框架、实战项目、Java 并发相关技术讨论群。',
    },
    U5678: {
        type: 'user',
        name: '况浩然',
        avatar: 'https://i.pravatar.cc/100?img=1',
        desc: '专注后端开发与 AI 应用构建。常驻东京 ☕',
    },
};

const SearchPage: React.FC = () => {
    const [keyword, setKeyword] = useState('');
    const [result, setResult] = useState<any | null>(null);
    const [loading, setLoading] = useState(false);

    const handleSearch = () => {
        const trimmed = keyword.trim();
        if (!trimmed) {
            message.warning('请输入好友号或群号');
            return;
        }

        setLoading(true);
        setTimeout(() => { // 模拟接口延迟
            const data = MOCK_DATA[trimmed.toUpperCase()];
            setResult(data || null);
            setLoading(false);
        }, 600);
    };

    return (
        <div
            style={{
                maxWidth: 600,
                margin: '40px auto',
                padding: '0 20px',
                textAlign: 'center',
                userSelect: 'none',
            }}
        >
            <Title level={2} style={{ fontWeight: 'bold', marginBottom: 24 }}>
                <WechatOutlined />   查找好友或群组
            </Title>

            <Space
                direction="horizontal"
                style={{ width: '100%', marginBottom: 32 }}
                size="middle"
            >
                <Input
                    size="large"
                    placeholder="请输入群号或好友号，例如 G1234 / U5678"
                    prefix={<SearchOutlined />}
                    allowClear
                    value={keyword}
                    onChange={e => setKeyword(e.target.value)}
                    onPressEnter={handleSearch}
                    style={{ flex: 1, borderRadius: 8, width: 400 }}
                    disabled={loading}
                />
                <Button
                    type="primary"
                    size="large"
                    onClick={handleSearch}
                    loading={loading}
                    style={{ borderRadius: 8 }}
                >
                    搜索
                </Button>
            </Space>

            {result ? (
                <Card
                    hoverable
                    style={{
                        borderRadius: 12,
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                        textAlign: 'left',
                        maxWidth: 480,
                        margin: '0 auto',
                    }}
                    bodyStyle={{ padding: '24px' }}
                    title={
                        <Space>
                            <Avatar size={56} src={result.avatar} />
                            <div>
                                <Text strong style={{ fontSize: 18 }}>
                                    {result.name}
                                </Text>
                                <br />
                                <Text type="secondary" style={{ fontSize: 14 }}>
                                    {result.type === 'group' ? '群组' : '用户'}
                                </Text>
                            </div>
                        </Space>
                    }
                    extra={
                        <Button
                            type={result.type === 'group' ? 'default' : 'primary'}
                            icon={<InteractionOutlined />}
                            onClick={() => message.success(result.type === 'group' ? '申请加入群组成功！' : '消息已发送！')}
                            style={{ borderRadius: 8 }}
                        >
                            {result.type === 'group' ? '申请加入' : '发送消息'}
                        </Button>
                    }
                >
                    <Text style={{ fontSize: 14, lineHeight: 1.6, color: '#444' }}>
                        {result.desc}
                    </Text>
                </Card>
            ) : keyword && !loading ? (
                <Empty
                    description={
                        <span style={{ fontSize: 16 }}>
                            未找到对应的群组或用户 🤷‍♂️<br />
                            请确认输入的群号或好友号是否正确。
                        </span>
                    }
                    imageStyle={{ height: 120 }}
                />
            ) : null}
        </div>
    );
};

export default SearchPage;
