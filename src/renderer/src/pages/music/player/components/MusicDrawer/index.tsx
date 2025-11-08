// components/MusicDrawer/index.tsx
import React, { useState } from 'react';
import { Drawer, Tabs, Input, Button, List, Avatar, Empty } from 'antd';
import './index.css';
import { Track } from '@renderer/store/usePlayerStore';

const { TextArea } = Input;
const { TabPane } = Tabs;

interface MusicDrawerProps {
  visible: boolean;
  onClose: () => void;
  currentTrack: Track;
  isPlaying: boolean;
  trackList: Track[];
  currentSongIndex: number;
  setCurrentSongIndex: (index: number) => void;
  setIsPlaying: (playing: boolean) => void;
}

interface Comment {
  id: string;
  user: string;
  avatar: string;
  content: string;
  time: string;
}

const MusicDrawer: React.FC<MusicDrawerProps> = ({
  visible,
  onClose,
  currentTrack,
  isPlaying,
  trackList,
  currentSongIndex,
  setCurrentSongIndex,
  setIsPlaying,
}) => {
  const [comments, setComments] = useState<Comment[]>([
    {
      id: '1',
      user: '音乐爱好者',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=1',
      content: '这首歌太好听了！循环播放中...',
      time: '2小时前',
    },
    {
      id: '2',
      user: '夜听音乐',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=2',
      content: '每次听都有不同的感受',
      time: '5小时前',
    },
  ]);
  const [newComment, setNewComment] = useState('');

  const handleAddComment = () => {
    if (!newComment.trim()) return;

    const comment: Comment = {
      id: Date.now().toString(),
      user: '当前用户',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=current',
      content: newComment,
      time: '刚刚',
    };

    setComments([comment, ...comments]);
    setNewComment('');
  };

  const handlePlayTrack = (index: number) => {
    setCurrentSongIndex(index);
    setIsPlaying(true);
  };

  return (
    <Drawer
      title={null}
      placement="bottom"
      onClose={onClose}
      open={visible}
      height="80vh"
      closable={false}
      className="music-drawer"
    >
      <div className="flex h-full">
        {/* 左侧：专辑封面旋转区域 */}
        <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
          <div className="text-center">
            <div className={`album-cover-container ${isPlaying ? 'playing' : ''}`}>
              <div className="album-cover">
                <img
                  src={currentTrack.cover || 'https://via.placeholder.com/300'}
                  alt={currentTrack.title}
                  className="w-full h-full object-cover rounded-full"
                />
              </div>
              <div className="album-center"></div>
            </div>

            <div className="mt-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                {currentTrack.title}
              </h2>
              <p className="text-lg text-gray-600">
                {currentTrack.artist}
              </p>
              {currentTrack.album && (
                <p className="text-sm text-gray-400 mt-1">
                  专辑: {currentTrack.album}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* 右侧：详情和评论区域 */}
        <div className="w-96 bg-white border-l border-gray-200 p-4 rounded-tl-2xl overflow-hidden">
          <Tabs defaultActiveKey="1" className="h-full">
            <TabPane tab="歌曲详情" key="1">
              <div className="p-4">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold mb-2">歌曲信息</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex">
                      <span className="text-gray-500 w-20">歌曲名:</span>
                      <span className="flex-1">{currentTrack.title}</span>
                    </div>
                    <div className="flex">
                      <span className="text-gray-500 w-20">歌手:</span>
                      <span className="flex-1">{currentTrack.artist}</span>
                    </div>
                    {currentTrack.album && (
                      <div className="flex">
                        <span className="text-gray-500 w-20">专辑:</span>
                        <span className="flex-1">{currentTrack.album}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2">播放列表</h3>
                  <List
                    dataSource={trackList}
                    renderItem={(item, index) => (
                      <List.Item
                        className={`cursor-pointer ${index === currentSongIndex ? 'bg-blue-50' : ''
                          }`}
                        onClick={() => handlePlayTrack(index)}
                      >
                        <List.Item.Meta
                          avatar={<Avatar src={item.cover} shape="square" />}
                          title={item.title}
                          description={item.artist}
                          className='play-bar-tex play-bar'
                        />
                      </List.Item>
                    )}
                  />
                </div>
              </div>
            </TabPane>

            <TabPane tab={`评论 (${comments.length})`} key="2">
              <div className="p-4 h-full flex flex-col">
                <div className="mb-4">
                  <TextArea
                    rows={3}
                    placeholder="说点什么..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="mb-2"
                  />
                  <Button
                    type="primary"
                    onClick={handleAddComment}
                    disabled={!newComment.trim()}
                  >
                    发表评论
                  </Button>
                </div>

                <div className="flex-1 overflow-y-auto">
                  {comments.length === 0 ? (
                    <Empty description="暂无评论" />
                  ) : (
                    <List
                      dataSource={comments}
                      renderItem={(comment) => (
                        <List.Item key={comment.id}>
                          <List.Item.Meta
                            avatar={<Avatar src={comment.avatar} />}
                            title={comment.user}
                            description={
                              <>
                                <div className="mb-1">{comment.content}</div>
                                <span className="text-xs text-gray-400">
                                  {comment.time}
                                </span>
                              </>
                            }
                          />
                        </List.Item>
                      )}
                    />
                  )}
                </div>
              </div>
            </TabPane>
          </Tabs>
        </div>
      </div>
    </Drawer>
  );
};

export default MusicDrawer;
