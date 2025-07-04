import { RedoOutlined } from '@ant-design/icons';
import { Conversations, type ConversationsProps } from '@ant-design/x';
import { Avatar, Divider, type GetProp, Input, Spin, theme } from 'antd';
import React, { useEffect, useState } from 'react';
import InfiniteScroll from 'react-infinite-scroll-component';
import { useNavigate } from 'react-router-dom';
const FriendsPage: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<GetProp<ConversationsProps, 'items'>>([]);
    const navigate = useNavigate();
    const { token } = theme.useToken();
    const loadMoreData = () => {
        if (loading) {
            return;
        }
        setLoading(true);
        fetch('https://randomuser.me/api/?results=10&inc=name,gender,email,nat,picture&noinfo')
            .then((res) => res.json())
            .then((body) => {
                const formmatedData = body.results.map((i: any) => ({
                    key: i.email,
                    label: `${i.name.title} ${i.name.first} ${i.name.last}`,
                    icon: <Avatar src={i.picture.thumbnail} />,
                    group: i.nat,
                }));

                setData([...data, ...formmatedData]);
                setLoading(false);
            })
            .catch(() => {
                setLoading(false);
            });
    };

    useEffect(() => {
        loadMoreData();
    }, []);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
            <div className="drag" style={{ height: 25, width: '100%' }}></div>
            <div
                style={{
                    height: 46,
                    position: 'sticky',
                    top: 25,
                }}
            >
                <Input.Search
                    placeholder="搜索联系人"
                    style={{ margin: '12px', marginTop: 0, width: '260px' }}
                    allowClear
                />
            </div>
            <div style={{
                background: token.colorBgContainer,
                borderRadius: token.borderRadius,
                overflow: 'auto',
            }} className='scrollableDiv'>
                <InfiniteScroll
                    dataLength={data.length}
                    next={loadMoreData}
                    hasMore={data.length < 50}
                    loader={
                        <div style={{ textAlign: 'center' }}>
                            <Spin indicator={<RedoOutlined spin />} size="small" />
                        </div>
                    }
                    endMessage={<Divider plain>It is all, nothing more 🤐</Divider>}
                    style={{ overflow: 'hidden' }}
                >
                    <Conversations items={data} defaultActiveKey="demo1" groupable onActiveChange={(key) => navigate(`/friends/${key}`)} />
                </InfiniteScroll>
            </div>
        </div>
    );
};

export default FriendsPage;