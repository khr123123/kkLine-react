import React, { useEffect } from 'react';
import { Carousel, Card, Button, Skeleton } from 'antd';
import { MoreOutlined, ReloadOutlined } from '@ant-design/icons';
import { useDataFetch } from './hooks/useDataFetch';
import { addImageParams, formatTime } from '../../utils/timeUtil';
import { getBannerList } from '@renderer/api/bannerApis';
import { getRecommendedPlaylists } from '@renderer/api/playlistApis';
import { getRecommendedSongs } from '@renderer/api/songApis';

interface Banner {
  bannerId: number;
  bannerUrl: string;
}

interface Playlist {
  playlistId: number;
  title: string;
  coverUrl: string;
}

interface Song {
  songId: number;
  songName: string;
  artistName: string;
  coverUrl: string;
  duration: string;
}

interface HomePageProps {
  onSelectPlaylist: (id: number) => void;
  onPlaySong: (song: Song, allSongs: Song[]) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onSelectPlaylist, onPlaySong }) => {
  const { data: bannerData, loading: bannerLoading, fetchData: fetchBanners } = useDataFetch<Banner[]>();
  const { data: playlistData, loading: playlistLoading, fetchData: fetchPlaylists } = useDataFetch<Playlist[]>();
  const { data: songData, fetchData: fetchSongs } = useDataFetch<Song[]>();

  // ✅ 安全访问数据
  const bannerList = bannerData || [];
  const recommendedPlaylist = playlistData || [];
  const recommendedSongList = songData || [];

  useEffect(() => {
    initData();
  }, []);

  const initData = async () => {
    await fetchBanners(() => getBannerList() as any, '获取轮播图失败');
    await fetchPlaylists(() => getRecommendedPlaylists() as any, '获取推荐歌单失败');
    await fetchSongs(() => getRecommendedSongs() as any, '获取推荐歌曲失败');
  };

  const handleRefreshSongs = async () => {
    await fetchSongs(() => getRecommendedSongs() as any, '刷新歌曲失败');
  };
  return (
    <div className="p-1 ">
      <div className="flex-1">
        {bannerLoading ? <Skeleton active /> : <>
          {bannerList.length > 0 && (
            <div className="mb-4">
              <Carousel autoplay arrows adaptiveHeight>
                {bannerList.map((item) => (
                  <div key={item.bannerId}>
                    <img
                      src={item.bannerUrl}
                      style={{
                        width: '100%',
                        objectFit: 'cover',
                        borderRadius: 8,
                      }}
                    />
                  </div>
                ))}
              </Carousel>
            </div>
          )}
        </>}
        {/* 推荐歌单 */}
        <div className="mb-4">
          <div className="mb-2" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: 18, fontWeight: 600 }}>今日为你推荐</h2>
            <Button type="link" icon={<MoreOutlined />} onClick={() => { }}>
              更多
            </Button>
          </div>
          {playlistLoading ? <Skeleton active /> :
            <div className='mb-4' style={{ display: 'grid', width: '100%', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              {recommendedPlaylist.slice(0, 9).map((item) => (
                <Card
                  key={item.playlistId}
                  hoverable
                  cover={
                    <img
                      alt={item.title}
                      src={addImageParams(item.coverUrl, 'param=200y200')}
                      style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', borderRadius: 8 }}
                    />
                  }
                  onClick={() => onSelectPlaylist(item.playlistId)}
                >
                  <Card.Meta
                    title={
                      <div
                        style={{
                          fontSize: 12,
                          display: '-webkit-box',
                          WebkitLineClamp: 2,   // 限制两行
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          wordBreak: 'break-word', // 防止长单词撑开
                        }}
                        title={item.title} // 鼠标悬停显示完整标题
                      >
                        {item.title}
                      </div>
                    }
                  />
                </Card>
              ))}
            </div>
          }
          {/* 推荐歌曲 */}
          <div className="mb-4">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={{ fontSize: 18, fontWeight: 600 }}>相似推荐</h2>
              <Button type="link" icon={<ReloadOutlined />} onClick={handleRefreshSongs}>
                刷新
              </Button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
              {recommendedSongList.map((item) => (
                <div
                  key={item.songId}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: 8,
                    borderRadius: 8,
                    cursor: 'pointer',
                    transition: 'background 0.2s',
                  }}
                  onClick={() => onPlaySong(item, recommendedSongList)}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#f5f5f5')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <img
                    src={addImageParams(item.coverUrl, 'param=90y90')}
                    alt={item.songName}
                    style={{ width: 64, height: 64, borderRadius: 8, objectFit: 'cover' }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3
                      style={{
                        margin: 0,
                        fontSize: 14,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                      title={item.songName}
                    >
                      {item.songName}
                    </h3>
                    <p
                      style={{
                        margin: 0,
                        fontSize: 12,
                        color: '#888',
                        display: '-webkit-box',
                        WebkitLineClamp: 1,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                      title={item.artistName}
                    >
                      {item.artistName}
                    </p>
                  </div>
                  <div style={{ fontSize: 12, color: '#888' }}>
                    {formatTime(parseFloat(item.duration) * 1000)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}