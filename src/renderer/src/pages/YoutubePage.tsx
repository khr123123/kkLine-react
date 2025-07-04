import React, { useState, useEffect } from 'react';
import {
    Input,
    Tabs,
    Card,
    Row,
    Col,
    Spin,
    message,
    Space,
    Image,
    Typography,
} from 'antd';
import logo from '../../../../resources/yutube.png';

const { TabPane } = Tabs;
const { Search } = Input;
const { Text, Title } = Typography;

const pidMap: Record<string, number> = {
    movie: 1,
    tv: 2,
    anime: 4,
};

const VideoListTabs = () => {
    const [activeTab, setActiveTab] = useState('movie');
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(false);
    const [dataMap, setDataMap] = useState<Record<string, any[]>>({
        movie: [],
        tv: [],
        anime: [],
    });

    const fetchData = async (tabKey: string) => {
        const pid = pidMap[tabKey];
        if (dataMap[tabKey].length > 0) return;

        setLoading(true);
        try {
            const response = await fetch(
                `https://m.mubai.link/api/filmClassify?Pid=${pid}`
            );
            const result = await response.json();

            if (result.code === 0) {
                const list = result.data?.content?.news || [];
                setDataMap((prev) => ({ ...prev, [tabKey]: list }));
            } else {
                message.error('接口返回错误');
            }
        } catch (error) {
            message.error('加载失败');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData(activeTab);
    }, [activeTab]);

    const filteredData = dataMap[activeTab].filter((item) =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div style={{ padding: 24 }} className='scrollableDiv'>
            {/* 顶部 Header：logo + 标题 + 搜索框 */}
            <Row align="middle" justify="space-between" >
                <Col>
                    <Space align="center">
                        <Image src={logo} width={36} preview={false} />
                        <Title level={3} style={{ margin: 0 }}>
                            KKVideo
                        </Title>
                    </Space>
                </Col>
                <Col>
                    <Search
                        placeholder="搜索当前分类视频..."
                        allowClear
                        onSearch={setSearchTerm}
                        size="large"
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ maxWidth: 300 }}
                        enterButton
                    />
                </Col>
            </Row>

            {/* 标签页 */}
            <Tabs defaultActiveKey="movie" onChange={setActiveTab}>
                <TabPane tab="🎬 电影" key="movie" />
                <TabPane tab="📺 电视剧" key="tv" />
                <TabPane tab="🌟 动漫" key="anime" />
            </Tabs>

            {/* 内容区 */}
            {loading ? (
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        height: '50vh',
                    }}
                >
                    <Spin size="large" tip="加载中..." />
                </div>
            ) : (
                <Row gutter={[16, 16]}>
                    {filteredData.map((item) => (
                        <Col key={item.id} xs={24} sm={12} md={8} lg={6}>
                            <Card
                                hoverable
                                cover={
                                    <Image
                                        alt={item.name}
                                        src={item.picture}
                                        height={260}
                                        style={{ objectFit: 'cover', overflow: 'hidden' }}
                                        preview={false}
                                    />
                                }
                            >
                                <Card.Meta
                                    title={item.name}
                                    description={
                                        <div>
                                            <Text strong>{item.cName}</Text> | <Text>{item.year}</Text>
                                            <br />
                                            <Text type="secondary" style={{ fontSize: 12 }}>
                                                {item.actor}
                                            </Text>
                                        </div>
                                    }
                                />
                            </Card>
                        </Col>
                    ))}
                </Row>
            )}
        </div>
    );
};

export default VideoListTabs;
