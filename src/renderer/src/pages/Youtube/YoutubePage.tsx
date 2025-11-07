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
    Menu,
} from 'antd';
import logo from '../../assets/yutube.png';
import "./index.css"
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
        <div
            className="music-container h-screen flex flex-col"
            style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                minHeight: '100vh'
            }}
        >
            {/* 导航栏 */}
            <div className="video-menu navigation-bar flex items-center bg-white shadow-sm px-6 h-16 border-b border-red-100">
                {/* Logo 区域 —— 去掉圆形背景 */}
                <div className="logo flex items-center mr-8 cursor-pointer">
                    {/* 直接显示 YouTube 图标，无圆形包裹 */}
                    <Image
                        src={logo}
                        width={40}
                        height={40}
                        preview={false}
                        style={{ borderRadius: 4 }}
                    />
                    <span className="font-bold text-xl text-red-600 ml-2">KK VIDEO</span>
                </div>
                {/* 分类菜单 */}
                <Menu
                    mode="horizontal"
                    selectedKeys={[activeTab]}
                    onClick={(v) => setActiveTab(v.key)}
                    style={{
                        borderBottom: 'none',
                        flex: 1,
                        fontWeight: 500
                    }}
                    items={[
                        { key: 'movie', label: '🎬 电影' },
                        { key: 'tv', label: '📺 电视剧' },
                        { key: 'anime', label: '🎨 动漫' },
                    ]}
                />
                <Search
                    placeholder="搜索视频..."
                    allowClear
                    onSearch={setSearchTerm}
                    size="middle"
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ maxWidth: 250 }}
                    className="absolute top-12 right-4 z-50"
                />
            </div>

            {/* 内容区 */}
            <div style={{ padding: '24px', flexGrow: 1, overflowY: 'auto' }} className="scrollableDiv">
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
                    <Row gutter={[24, 24]} style={{ marginTop: -20 }}>
                        {filteredData.map((item) => (
                            <Col key={item.id} xs={24} sm={12} md={8} lg={6} xl={4}>
                                <Card
                                    hoverable
                                    style={{
                                        borderRadius: 12,
                                        boxShadow: '0 4px 12px rgba(255, 100, 100, 0.15)',
                                        transition: 'all 0.2s ease',
                                        overflow: 'hidden',
                                    }}
                                    cover={
                                        <div style={{}}>
                                            <Image
                                                alt={item.name}
                                                src={item.picture}
                                                preview={false}
                                            />
                                        </div>
                                    }
                                >
                                    <Card.Meta
                                        title={
                                            <Text strong style={{ fontSize: 15, color: '#d32f2f' }}>
                                                {item.name}
                                            </Text>
                                        }
                                        description={
                                            <div style={{ marginTop: 8 }}>
                                                <div style={{ fontSize: 13 }}>
                                                    <Text type="secondary">类型：</Text>{item.cName}
                                                </div>
                                                <div style={{ fontSize: 13 }}>
                                                    <Text type="secondary">年份：</Text>{item.year}
                                                </div>
                                                <div style={{ fontSize: 12, color: '#757575', marginTop: 4 }}>
                                                    主演: {item.actor?.slice(0, 20)}{item.actor?.length > 20 ? '...' : ''}
                                                </div>
                                            </div>
                                        }
                                    />
                                </Card>
                            </Col>
                        ))}
                    </Row>
                )}
            </div>
        </div>
    );
};

export default VideoListTabs;