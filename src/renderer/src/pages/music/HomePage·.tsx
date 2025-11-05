import React, { useEffect } from 'react';
import { Carousel, Card, Button } from 'antd';
import { MoreOutlined, ReloadOutlined } from '@ant-design/icons';
import { useDataFetch } from './hooks/useDataFetch';
import { addImageParams, formatTime } from '../../utils/timeUtil';
import { getBannerList } from '@renderer/api/bannerApis';
import { getRandomPlaylists } from '@renderer/api/playlistApis';
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
  const { data: bannerData, fetchData: fetchBanners } = useDataFetch<Banner[]>();
  const { data: playlistData, fetchData: fetchPlaylists } = useDataFetch<Playlist[]>();
  const { data: songData, fetchData: fetchSongs } = useDataFetch<Song[]>();

  // ✅ 安全访问数据
  const bannerList = bannerData || [];
  const recommendedPlaylist = playlistData || [];
  const recommendedSongList = songData || [];

  useEffect(() => {
    initData();
  }, []);

  const initData = async () => {
    await fetchBanners(() => getBannerList(), '获取轮播图失败');
    await fetchPlaylists(() => getRandomPlaylists(), '获取推荐歌单失败');
    await fetchSongs(() => getRecommendedSongs(), '获取推荐歌曲失败');
  };

  const handleRefreshSongs = async () => {
    await fetchSongs(() => getRecommendedSongs(), '刷新歌曲失败');
  };

  return (
    <div className="p-6 w-full">
      <div className="flex-1">
        {/* 轮播图 */}
        {bannerList.length > 0 && (
          <div className="mb-8">
            <Carousel autoplay>
              {bannerList.map((item) => (
                <div key={item.bannerId}>
                  <img
                    src={item.bannerUrl}
                    alt="banner"
                    className="w-full h-64 object-cover rounded-lg"
                  />
                </div>
              ))}
            </Carousel>
          </div>
        )}

        {/* 推荐歌单 */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">今日为你推荐</h2>
            <Button type="link" icon={<MoreOutlined />} onClick={() => {}}>
              更多
            </Button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            {recommendedPlaylist.slice(0, 7).map((item) => (
              <Card
                key={item.playlistId}
                hoverable
                cover={
                  <img
                    alt={item.title}
                    src={addImageParams(item.coverUrl, 'param=350y350')}
                    className="aspect-square object-cover"
                  />
                }
                onClick={() => onSelectPlaylist(item.playlistId)}
              >
                <Card.Meta
                  title={<div className="line-clamp-2 text-sm">{item.title}</div>}
                />
              </Card>
            ))}
          </div>
        </div>

        {/* 推荐歌曲 */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">相似推荐</h2>
            <Button type="link" icon={<ReloadOutlined />} onClick={handleRefreshSongs}>
              刷新
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recommendedSongList.map((item) => (
              <div
                key={item.songId}
                className="flex items-center gap-4 p-2 rounded-lg hover:bg-gray-100 cursor-pointer transition"
                onClick={() => onPlaySong(item, recommendedSongList)}
              >
                <img
                  src={addImageParams(item.coverUrl, 'param=90y90')}
                  alt={item.songName}
                  className="w-16 h-16 rounded-lg object-cover"
                />
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium truncate">{item.songName}</h3>
                  <p className="text-sm text-gray-500 truncate">{item.artistName}</p>
                </div>
                <div className="text-sm text-gray-500">
                  {formatTime(parseFloat(item.duration) * 1000)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
