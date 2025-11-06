import React, { useEffect, useState } from 'react';
import { Button, Avatar, Tag, Tabs, Spin } from 'antd';
import { PlayCircleOutlined, HeartOutlined, HeartFilled } from '@ant-design/icons';
import { SongTable } from './components/SongTable';
import { CommentSection } from './components/CommentSection';
import { useDataFetch } from './hooks/useDataFetch';
import { addImageParams } from '../../utils/timeUtil';
import { message } from 'antd';
import { cancelCollectPlaylist, collectPlaylist } from '@renderer/api/userFavoriteApis';
import { getPlaylistDetail } from '@renderer/api/playlistApis';
import { addPlaylistComment, deleteComment, likeComment } from '@renderer/api/commentApis';
import { useUserStore } from '@renderer/store/useUserStore';
import defaultIcon from "../../assets/music.png"
const { TabPane } = Tabs;

interface PlaylistDetailPageProps {
    playlistId: number;
    onPlaySong: (song: any, allSongs: any[]) => void;
    onPlayAll: (songs: any[]) => void;
}

export const PlaylistDetailPage: React.FC<PlaylistDetailPageProps> = ({
    playlistId,
    onPlaySong,
    onPlayAll,
}) => {
    const [activeTab, setActiveTab] = useState('songs');
    const [isCollected, setIsCollected] = useState(false);
    const [songs, setSongs] = useState([])
    const [comments, setComments] = useState([])
    const [playlistDetail, setPlaylistDetail] = useState<any>({});

    const currentUsername = useUserStore((state) => state.user);
    useEffect(() => {
        if (playlistId) {
            fetchPlaylistDetail();
        }
    }, [playlistId]);

    const fetchPlaylistDetail = async () => {
        const result = await getPlaylistDetail({ id: playlistId })
        if (result.code === 0) {
            setPlaylistDetail(result.data);
            setIsCollected(result.data.likeStatus == 1);
            setSongs(result.data.songs || []);
            setComments(result.data.comments || []);
        }
    };

    const handleToggleCollect = async () => {
        try {
            if (isCollected) {
                await cancelCollectPlaylist({ playlistId });
                message.success('取消收藏成功');
            } else {
                await collectPlaylist({ playlistId });
                message.success('收藏成功');
            }
            setIsCollected(!isCollected);
        } catch (error) {
            message.error('操作失败');
        }
    };

    const handleAddComment = async (content: string) => {
        try {
            const result = await addPlaylistComment({
                playlistId,
                content,
            });

            if (result.code === 0) {
                message.success('评论发布成功');
                await fetchPlaylistDetail();
            }
        } catch (error) {
            message.error('评论发布失败');
        }
    };

    const handleLikeComment = async (commentId: number) => {
        try {
            const result = await likeComment({ id: commentId });
            if (result.code === 0) {
                message.success('点赞成功');
                await fetchPlaylistDetail();
            }
        } catch (error) {
            message.error('点赞失败');
        }
    };

    const handleDeleteComment = async (commentId: number) => {
        try {
            const result = await deleteComment({ id: commentId });
            if (result.code === 0) {
                message.success('删除成功');
                await fetchPlaylistDetail();
            }
        } catch (error) {
            message.error('删除失败');
        }
    };


    return (
        <div className="p-6">
            {/* 歌单头部信息 */}
            <div className="flex gap-6 mb-6">
                <img
                    src={addImageParams(playlistDetail.coverUrl, 'param=500y500')}
                    alt={playlistDetail.title}
                    className="w-60 h-60 rounded-lg shadow-lg object-cover"
                />
                <div className="flex-1 flex flex-col justify-between">
                    <div>
                        <h1 className="text-3xl font-bold mb-2">{playlistDetail.title}</h1>
                        <p className="text-gray-600 mb-4 line-clamp-2">
                            {playlistDetail.introduction}
                        </p>
                        <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                            <Avatar shape="square" size="small" src={playlistDetail.creator?.avatarUrl || defaultIcon} />
                            <span>{playlistDetail.creator?.nickname || "KK MUSIC"}</span>
                            <span>•</span>
                            <span>{songs.length} 首歌曲</span>
                        </div>
                        {playlistDetail.tags && playlistDetail.tags.length > 0 && (
                            <div className="flex gap-2 flex-wrap">
                                {playlistDetail.tags.map((tag) => (
                                    <Tag key={tag}>{tag}</Tag>
                                ))}
                            </div>
                        )}
                    </div>
                    <div className="flex gap-4">
                        <Button
                            type="primary"
                            icon={<PlayCircleOutlined />}
                            onClick={() => onPlayAll(songs)}
                            disabled={songs.length === 0}
                        >
                            播放全部
                        </Button>
                        <Button
                            icon={isCollected ? <HeartFilled /> : <HeartOutlined />}
                            onClick={handleToggleCollect}
                            danger={isCollected}
                        >
                            {isCollected ? '已收藏' : '收藏'}
                        </Button>
                    </div>
                </div>
            </div>

            {/* 歌曲和评论 Tab */}
            <Tabs activeKey={activeTab} onChange={setActiveTab}>
                <TabPane tab="歌曲" key="songs">
                    <SongTable
                        songs={songs}
                        loading={false}
                        pagination={{
                            pageSize: 10,
                            showSizeChanger: true,
                            showQuickJumper: true,
                        }}
                        onPlay={(song) => onPlaySong(song, songs)}
                    />
                </TabPane>
                <TabPane tab="评论" key="comments">
                    <CommentSection
                        comments={comments}
                        currentUsername={currentUsername?.userName!}
                        isLoggedIn={currentUsername != null}
                        onAddComment={handleAddComment}
                        onLikeComment={handleLikeComment}
                        onDeleteComment={handleDeleteComment}
                    />
                </TabPane>
            </Tabs>
        </div>
    );
};
