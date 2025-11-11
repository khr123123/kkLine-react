import React, {
    useState,
    useRef,
    useEffect,
    useCallback,
    useMemo,
} from 'react';
import {
    Input,
    List,
    Card,
    Modal,
    message,
    Spin,
    Tabs,
    Pagination,
    Tag,
    Row,
    Col,
    Button,
    Space,
    Typography,
} from 'antd';
import {
    PlayCircleOutlined,
    CloseOutlined,
    CalendarOutlined,
    EnvironmentOutlined,
} from '@ant-design/icons';
import Hls from 'hls.js';
import DPlayer from 'dplayer';
import { useUserStore } from '@renderer/store/useUserStore';
import videoIcon from '@renderer/assets/yutube.png';

const { Search } = Input;
const { Text, Title, Paragraph } = Typography;

// ==================== 类型定义 ====================
interface VideoItem {
    vod_id: number;
    vod_name: string;
    vod_pic: string;
    vod_remarks: string;
    vod_year?: string;
    vod_area?: string;
    vod_actor?: string;
    vod_director?: string;
    vod_content?: string;
    type_name?: string;
    vod_play_url?: string;
    vod_play_from?: string;
}

interface Category {
    type_id: number;
    type_name: string;
}

interface Episode {
    name: string;
    url: string;
}

interface PlaySource {
    name: string;
    episodes: Episode[];
}

// ==================== 自定义 Hook：API 请求封装 ====================
const useApi = (token: string) => {
    return useCallback(
        async (url: string): Promise<any> => {
            try {
                const res = await fetch(url, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                return await res.json();
            } catch (error) {
                console.error('API 请求失败:', error);
                throw error;
            }
        },
        [token]
    );
};

// ==================== 视频卡片组件 ====================
const VideoCard: React.FC<{ item: VideoItem; onClick: () => void }> = ({
    item,
    onClick,
}) => {
    return (
        <Card
            hoverable
            onClick={onClick}
            cover={
                <div style={{ position: 'relative', paddingTop: '140%' }}>
                    <img
                        alt={item.vod_name}
                        src={item.vod_pic || videoIcon}
                        style={item.vod_pic ? {
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover'
                        } : {
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            width: '50%',
                            height: '50%',
                            objectFit: 'contain',
                            transform: 'translate(-50%, -50%)'
                        }}
                    />
                    {/* 播放图标悬浮 */}
                    <div className="play-overlay">
                        <PlayCircleOutlined style={{ fontSize: 48, color: 'white' }} />
                    </div>
                    {/* 更新标签 */}
                    {item.vod_remarks && (
                        <Tag
                            color="red"
                            style={{ position: 'absolute', top: 8, right: 8 }}
                        >
                            {item.vod_remarks}
                        </Tag>
                    )}
                </div>
            }
            bodyStyle={{ padding: 12 }}
        >
            <Text strong ellipsis style={{ display: 'block', marginBottom: 8 }}>
                {item.vod_name}
            </Text>
            <Space size={4} wrap>
                {item.type_name && (
                    <Tag color="blue" style={{ fontSize: 11 }}>
                        {item.type_name}
                    </Tag>
                )}
                {item.vod_year && (
                    <Tag style={{ fontSize: 11 }}>
                        <CalendarOutlined /> {item.vod_year}
                    </Tag>
                )}
                {item.vod_area && (
                    <Tag color="green" style={{ fontSize: 11 }}>
                        <EnvironmentOutlined /> {item.vod_area}
                    </Tag>
                )}
            </Space>
        </Card>
    );
};

// ==================== 主组件 ====================
const VideoPlayerModal: React.FC = () => {
    // 用户信息
    const AUTH_TOKEN = useUserStore().user?.token || '';
    const BASE_URL = 'http://localhost:8080/api';

    const apiFetch = useApi(AUTH_TOKEN);

    // ========== 状态管理 ==========
    const [keyword, setKeyword] = useState('');
    const [inputValue, setInputValue] = useState('');
    const [videoList, setVideoList] = useState<VideoItem[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [activeCategory, setActiveCategory] = useState<string>('0');

    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(20);
    const [totalCount, setTotalCount] = useState(0);
    const [pageCount, setPageCount] = useState(0);

    const [modalVisible, setModalVisible] = useState(false);
    const [currentVideo, setCurrentVideo] = useState<VideoItem | null>(null);
    const [playSources, setPlaySources] = useState<PlaySource[]>([]);
    const [currentSource, setCurrentSource] = useState<string>('');
    const [currentEpisode, setCurrentEpisode] = useState<Episode | null>(null);

    const [loading, setLoading] = useState(false);
    const [loadingDetail, setLoadingDetail] = useState(false);

    const playerRef = useRef<DPlayer | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // ========== 加载分类列表 ==========
    const loadCategories = useCallback(async () => {
        try {
            const data = await apiFetch(`${BASE_URL}/video/categories`);
            if (data.code === 1 && Array.isArray(data.data)) {
                setCategories([{ type_id: 0, type_name: '推荐' }, ...data.data]);
            } else {
                message.warning('暂无分类数据');
            }
        } catch (err) {
            message.error('加载分类失败');
        }
    }, [apiFetch]);

    // ========== 解析播放源 ==========
    const parsePlaySources = useCallback((video: VideoItem): PlaySource[] => {
        if (!video.vod_play_from || !video.vod_play_url) return [];

        const fromList = video.vod_play_from.split('$$$');
        const urlList = video.vod_play_url.split('$$$');

        return fromList.map((fromName, index) => {
            const episodesStr = urlList[index] || '';
            const episodes: Episode[] = episodesStr
                .split('#')
                .filter(Boolean)
                .map(ep => {
                    const [name, url] = ep.split('$');
                    return { name: name || '未知', url: url || '' };
                });

            return { name: fromName, episodes };
        });
    }, []);

    // ========== 加载视频列表 ==========
    const loadVideoList = useCallback(async () => {
        setLoading(true);
        try {
            let url = `${BASE_URL}/video/proxy?pg=${currentPage}&limit=${pageSize}`;
            if (keyword.trim()) {
                url += `&ac=videolist&wd=${encodeURIComponent(keyword.trim())}`;
            } else {
                url += `&ac=list`;
                if (activeCategory !== '0') url += `&t=${activeCategory}`;
            }

            const data = await apiFetch(url);
            if (data.code === 1 && Array.isArray(data.list)) {
                setVideoList(data.list);
                setTotalCount(data.total || 0);
                setPageCount(data.pagecount || Math.ceil((data.total || 0) / pageSize));
            } else {
                setVideoList([]);
                message.error(data.message || '暂无数据');
            }
        } catch (err) {
            setVideoList([]);
            message.error('加载失败，请检查网络');
        } finally {
            setLoading(false);
        }
    }, [
        currentPage,
        pageSize,
        keyword,
        activeCategory,
        apiFetch,
        BASE_URL,
    ]);

    // ========== 初始加载分类 ==========
    useEffect(() => {
        loadCategories();
    }, [loadCategories]);

    // ========== 根据条件加载视频 ==========
    useEffect(() => {
        if (categories.length > 0) {
            loadVideoList();
        }
    }, [categories, loadVideoList]);

    // ========== 播放视频详情 ==========
    const playVideoById = useCallback(
        async (id: number) => {
            setLoadingDetail(true);
            setModalVisible(true);
            try {
                const data = await apiFetch(
                    `${BASE_URL}/video/proxy?ac=detail&ids=${id}`
                );
                if (data.code === 1 && data.list?.length > 0) {
                    const video = data.list[0];
                    setCurrentVideo(video);

                    const sources = parsePlaySources(video);
                    setPlaySources(sources);

                    if (sources.length > 0 && sources[0].episodes.length > 0) {
                        setCurrentSource(sources[0].name);
                        setCurrentEpisode(sources[0].episodes[0]);
                    }
                } else {
                    message.error('未找到该视频');
                    setModalVisible(false);
                }
            } catch (err) {
                message.error('获取详情失败');
                setModalVisible(false);
            } finally {
                setLoadingDetail(false);
            }
        },
        [apiFetch, parsePlaySources]
    );

    // ========== 切换播放源 ==========
    const handleSourceChange = useCallback(
        (key: string) => {
            setCurrentSource(key);
            const source = playSources.find(s => s.name === key);
            if (source?.episodes.length! > 0) {
                setCurrentEpisode(source!.episodes[0]);
            }
        },
        [playSources]
    );

    // ========== 初始化播放器 ==========
    useEffect(() => {
        if (!modalVisible || !currentEpisode || !containerRef.current) return;

        const videoUrl = currentEpisode.url; // 直接用原始视频 URL

        // 销毁旧播放器
        if (playerRef.current) {
            playerRef.current.destroy();
        }

        // 延迟确保 DOM 就绪
        const timer = setTimeout(() => {
            if (!containerRef.current) return;
            try {
                playerRef.current = new DPlayer({
                    container: containerRef.current!,
                    autoplay: true,
                    video: {
                        url: videoUrl,
                        type: 'customHls',
                        customType: {
                            customHls: (video: HTMLVideoElement) => {
                                if (Hls.isSupported()) {
                                    const hls = new Hls({
                                        enableWorker: true,
                                        lowLatencyMode: true,
                                    });
                                    hls.loadSource(videoUrl);
                                    hls.attachMedia(video);
                                } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
                                    video.src = videoUrl;
                                }
                            },
                        },
                    },
                });
            } catch (err) {
                console.error('DPlayer 初始化失败:', err);
                message.error('播放器初始化失败');
            }
        }, 50);

        return () => {
            clearTimeout(timer);
            if (playerRef.current) {
                playerRef.current.destroy();
                playerRef.current = null;
            }
        };
    }, [modalVisible, currentEpisode]);


    // ========== 关闭模态框 ==========
    const handleCloseModal = useCallback(() => {
        setModalVisible(false);
        setCurrentVideo(null);
        setPlaySources([]);
        setCurrentSource('');
        setCurrentEpisode(null);

        if (playerRef.current) {
            playerRef.current.destroy();
            playerRef.current = null;
        }
    }, []);

    // ========== Tab Items 缓存 ==========
    const tabItems = useMemo(
        () =>
            categories.map(cat => ({
                key: String(cat.type_id),
                label: cat.type_name,
            })),
        [categories]
    );

    const currentCategoryName =
        categories.find(c => String(c.type_id) === activeCategory)?.type_name ||
        '推荐';

    return (
        <div style={{ height: '92vh', display: 'flex', flexDirection: 'column' }}>
            {/* 头部导航栏 */}
            <div
                style={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    padding: '12px 24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderRadius: 8,
                    marginLeft: 12,
                    width: '78%',
                    marginTop: -14,
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                    <img src={videoIcon} alt="logo" style={{ width: 50, height: 45, marginRight: 12 }} />
                    <span style={{
                        fontWeight: 'bold',
                        fontSize: 24,
                        color: 'white',
                        textShadow: '2px 2px 4px rgba(0,0,0,0.2)'
                    }}>
                        KK VIDEO
                    </span>
                </div>

                <Search
                    placeholder="搜索电影、电视剧、动漫..."
                    value={inputValue}
                    onChange={e => setInputValue(e.target.value)}
                    onSearch={(value) => {
                        setKeyword(value);
                        setCurrentPage(1);
                    }}
                    allowClear
                    style={{ width: 350 }}
                />
            </div>

            {/* 分类 Tabs */}
            <div style={{ padding: '0 24px' }}>
                <Tabs activeKey={activeCategory} onChange={setActiveCategory} items={tabItems} size="large" />
            </div>

            {/* 内容区 */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '0 24px' }}>
                <div style={{ marginBottom: 16 }}>
                    <Space>
                        <Title level={4} style={{ margin: 0 }}>
                            {currentCategoryName}
                            {keyword && ` - "${keyword}"`}
                        </Title>
                        <Text type="secondary">共 {totalCount} 条结果</Text>
                    </Space>
                </div>

                <Spin spinning={loading}>
                    {videoList.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '100px 0', color: '#999' }}>
                            {keyword ? `未找到 "${keyword}" 相关内容` : '暂无视频数据'}
                        </div>
                    ) : (
                        <>
                            <List
                                grid={{
                                    gutter: 16,
                                    xs: 2,
                                    sm: 3,
                                    md: 4,
                                    lg: 5,
                                    xl: 6,
                                    xxl: 7,
                                }}
                                dataSource={videoList}
                                renderItem={item => (
                                    <List.Item>
                                        <VideoCard item={item} onClick={() => playVideoById(item.vod_id)} />
                                    </List.Item>
                                )}
                            />

                            <Pagination
                                style={{ marginTop: 16 }}
                                current={currentPage}
                                pageSize={pageSize}
                                total={pageCount * pageSize}
                                onChange={(page, size) => {
                                    setCurrentPage(page);
                                    if (size !== pageSize) setPageSize(size);
                                }}
                                showSizeChanger
                                showQuickJumper
                                showTotal={() => `共 ${pageCount} 页`}
                                pageSizeOptions={['20', '30', '40', '50']}
                            />
                        </>
                    )}
                </Spin>
            </div>

            {/* 播放器弹窗 */}
            <Modal
                open={modalVisible}
                footer={null}
                width="90%"
                style={{ top: 20, maxWidth: 1400 }}
                closeIcon={<CloseOutlined style={{ color: 'white', fontSize: 20 }} />}
                onCancel={handleCloseModal}
            >
                {loadingDetail ? (
                    <div style={{ textAlign: 'center', padding: 100, background: '#000' }}>
                        <Spin size="large" tip="加载中..." />
                    </div>
                ) : currentVideo ? (
                    <div>
                        <div
                            ref={containerRef}
                            style={{
                                width: '100%',
                                height: '60vh',
                                minHeight: 450,
                                background: '#000',
                            }}
                        />

                        <div style={{ background: '#fff', padding: 24 }}>
                            <Title level={3}>{currentVideo.vod_name}</Title>

                            <Space size={16} wrap style={{ marginBottom: 24 }}>
                                {currentVideo.vod_remarks && (
                                    <Tag color="red" icon={<PlayCircleOutlined />}>
                                        {currentVideo.vod_remarks}
                                    </Tag>
                                )}
                                {currentVideo.vod_year && (
                                    <Text type="secondary">
                                        <CalendarOutlined /> {currentVideo.vod_year}
                                    </Text>
                                )}
                                {currentVideo.vod_area && (
                                    <Text type="secondary">
                                        <EnvironmentOutlined /> {currentVideo.vod_area}
                                    </Text>
                                )}
                                {currentVideo.type_name && <Tag color="blue">{currentVideo.type_name}</Tag>}
                            </Space>

                            {(currentVideo.vod_director || currentVideo.vod_actor) && (
                                <div style={{ marginBottom: 24 }}>
                                    {currentVideo.vod_director && (
                                        <Text type="secondary" style={{ display: 'block', marginBottom: 8 }}>
                                            <strong>导演：</strong>{currentVideo.vod_director}
                                        </Text>
                                    )}
                                    {currentVideo.vod_actor && (
                                        <Text type="secondary" style={{ display: 'block' }}>
                                            <strong>主演：</strong>{currentVideo.vod_actor}
                                        </Text>
                                    )}
                                </div>
                            )}

                            {playSources.length > 0 && (
                                <div style={{ marginBottom: 24 }}>
                                    <Title level={5}>播放列表</Title>
                                    <Tabs
                                        activeKey={currentSource}
                                        onChange={handleSourceChange}
                                        items={playSources.map(source => ({
                                            key: source.name,
                                            label: `${source.name} (${source.episodes.length}集)`,
                                            children: (
                                                <Row gutter={[8, 8]} style={{ maxHeight: 300, overflowY: 'auto', padding: '8px 0' }}>
                                                    {source.episodes.map((ep, idx) => (
                                                        <Col key={idx} xs={8} sm={6} md={4} lg={3}>
                                                            <Button
                                                                type={currentEpisode?.url === ep.url ? 'primary' : 'default'}
                                                                block
                                                                onClick={() => setCurrentEpisode(ep)}
                                                                style={{ height: 40 }}
                                                            >
                                                                {ep.name}
                                                            </Button>
                                                        </Col>
                                                    ))}
                                                </Row>
                                            ),
                                        }))}
                                    />
                                </div>
                            )}

                            {currentVideo.vod_content && (
                                <div>
                                    <Title level={5}>剧情简介</Title>
                                    <Paragraph
                                        ellipsis={{
                                            rows: 3,
                                            expandable: true,
                                            symbol: '展开',
                                        }}
                                        style={{ color: '#666' }}
                                    >
                                        {currentVideo.vod_content.replace(/<[^>]+>/g, '')}
                                    </Paragraph>
                                </div>
                            )}
                        </div>
                    </div>
                ) : null}
            </Modal>

            {/* 全局样式 */}
            <style>{`
            .play-overlay {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            background: rgba(0, 0, 0, 0.3);
            opacity: 0;
            transition: opacity 0.3s ease;
            }
            .ant-card-hoverable:hover .play-overlay {
            opacity: 1;
            }
            .ant-card-hoverable:hover {
            transform: translateY(-4px);
            box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
            }
            .ant-tabs-tab {
            font-size: 16px;
            padding: 12px 20px;
            }
        `}</style>
        </div>
    );
};

export default VideoPlayerModal;