import React, { useEffect, useState, useRef } from 'react';
import { RedoOutlined } from '@ant-design/icons';
import { Conversations, type ConversationsProps } from '@ant-design/x';
import { loadAllFriend } from '@renderer/api/contactApis';
import { Avatar, Divider, type GetProp, Input, Spin, theme } from 'antd';
import InfiniteScroll from 'react-infinite-scroll-component';
import { useNavigate } from 'react-router-dom';

const MAX_LETTER_SEGMENT = 3;

const FriendsPage: React.FC = () => {
    const [data, setData] = useState<GetProp<ConversationsProps, 'items'>>([]);
    const [currentSegment, setCurrentSegment] = useState(1);
    const [hasMore, setHasMore] = useState(true);

    const loadingRef = useRef(false);
    const scrollableDivRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();
    const { token } = theme.useToken();

    // 用 ref 保存所有好友，避免重复追加相同数据
    const allDataRef = useRef<GetProp<ConversationsProps, 'items'>>([]);

    const loadData = async (segment: number) => {
        if (loadingRef.current || segment > MAX_LETTER_SEGMENT) return;
        loadingRef.current = true;

        try {
            const res = await loadAllFriend({ letterSegment: segment });
            const newData = (res.data as API.FriendItemDTO[]).map(friend => ({
                key: friend.id,
                label: friend.userName,
                icon: <Avatar src={friend.userAvatar} />,
                group: friend.headLetter,
            }));

            // 用 ref 来保存合并数据，防止闭包旧数据问题
            allDataRef.current = [...allDataRef.current, ...newData];
            // 合并数据
            // 按 group (首字母) 和 label (用户名) 排序
            allDataRef.current.sort((a, b) => {
                if (a.group === b.group) {
                    return (a.label || '').localeCompare(b.label || '');
                }
                return (a.group || '').localeCompare(b.group || '');
            });

            // 更新状态
            setData([...allDataRef.current]);

            // 直接更新 state
            setData(allDataRef.current);

            setCurrentSegment(segment + 1);
            setHasMore(segment < MAX_LETTER_SEGMENT);

            // 等待DOM渲染，确保 scrollHeight 更新
            await new Promise((resolve) => setTimeout(resolve, 100));

            if (scrollableDivRef.current) {
                const scrollHeight = scrollableDivRef.current.scrollHeight;
                const clientHeight = scrollableDivRef.current.clientHeight;

                // 如果内容没铺满且还有下一区间，继续加载
                if (scrollHeight <= clientHeight && segment < MAX_LETTER_SEGMENT) {
                    loadingRef.current = false; // 先释放锁，允许下一次调用
                    await loadData(segment + 1); // 递归调用
                    return;
                }
            }
        } catch (error) {
            console.error(error);
        } finally {
            loadingRef.current = false;
        }
    };

    useEffect(() => {
        loadData(1);
    }, []);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
            <div className="drag" style={{ height: 25, width: '100%' }}></div>
            <div
                style={{
                    height: 46,
                    position: 'sticky',
                    top: 25,
                    background: token.colorBgContainer,
                    zIndex: 100,
                }}
            >
                <Input.Search
                    placeholder="搜索联系人"
                    style={{ margin: '12px 10px 0 10px', width: 'calc(100% - 20px)' }}
                    allowClear
                />
            </div>
            <div
                id="scrollableDiv"
                ref={scrollableDivRef}
                style={{
                    background: token.colorBgContainer,
                    borderRadius: token.borderRadius,
                    overflow: 'auto',
                    flex: 1,
                }}
                className="scrollableDiv"
            >
                <InfiniteScroll
                    dataLength={data.length}
                    next={() => loadData(currentSegment)}
                    hasMore={hasMore}
                    loader={
                        <div style={{ textAlign: 'center' }}>
                            <Spin indicator={<RedoOutlined spin />} size="small" />
                        </div>
                    }
                    endMessage={<Divider plain>没有更多好友了 🤐</Divider>}
                    scrollableTarget="scrollableDiv"
                    style={{ overflow: 'hidden' }}
                >
                    <Conversations
                        items={data}
                        defaultActiveKey={data.length > 0 ? data[0].key : undefined}
                        groupable
                        onActiveChange={(key) => navigate(`/friends/${key}`)}
                    />
                </InfiniteScroll>
            </div>
        </div>
    );
};

export default FriendsPage;
