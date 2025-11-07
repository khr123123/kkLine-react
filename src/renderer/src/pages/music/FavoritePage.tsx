import React, { useEffect, useState } from 'react';
import { Button, Input, Spin } from 'antd';
import { PlayCircleOutlined, SearchOutlined } from '@ant-design/icons';
import { SongTable } from './components/SongTable';
import { usePagination } from './hooks/usePagination';
import { getUserFavoriteSongs } from '@renderer/api/userFavoriteApis';
import defaultMusicCover from '../../assets/music.png';
import { usePlayerStore } from '@renderer/store/usePlayerStore';
interface FavoritePageProps {
  onPlaySong: (song: any, allSongs: any[]) => void;
  onPlayAll: (songs: any[]) => void;
}

export const FavoritePage: React.FC<FavoritePageProps> = ({ onPlaySong, onPlayAll }) => {
  const { currentPage, pageSize, total, setTotal, handlePageChange } = usePagination(1, 10);
  const [searchKeyword, setSearchKeyword] = React.useState('');

  // ✅ 安全访问数据
  const [favoriteSongs, setFavoriteSongs] = useState([]);
  const [favoriteTotal, setFavoriteTotal] = useState(0);
  const [loading, setLoading] = useState(false);


  useEffect(() => {
    fetchFavoriteSongs();
  }, [currentPage, pageSize, searchKeyword]);

  const fetchFavoriteSongs = async () => {
    setLoading(true)
    const result = await getUserFavoriteSongs({
      pageNum: currentPage,
      pageSize: pageSize,
      songName: searchKeyword,
      artistName: '',
      album: '',
    })
    setLoading(false)
    if (result) {
      setFavoriteTotal(Number(result.data.total));
      setFavoriteSongs(result.data.records);
    }
  };

  return (
    <div className="p-6">
      <div className="flex gap-6 mb-4" style={{ marginTop: -20 }}>
        <img
          src={favoriteSongs[0]?.coverUrl || defaultMusicCover}
          alt="我喜欢的音乐"
          className="w-60 h-60 rounded-lg shadow-lg object-cover"
        />
        <div className="flex-1 flex flex-col justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">我喜欢的音乐</h1>
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
              <span>{favoriteTotal} 首歌曲</span>
            </div>
          </div>
          <div className="flex gap-4">
            <Button
              type="primary"
              icon={<PlayCircleOutlined />}
              onClick={() => onPlayAll(favoriteSongs)}
              disabled={favoriteSongs.length === 0}
            >
              播放全部
            </Button>
            <Input
              placeholder="搜索"
              prefix={<SearchOutlined />}
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              onPressEnter={fetchFavoriteSongs}
              style={{ width: 250 }}
            />
          </div>
        </div>
      </div>

      <SongTable
        songs={favoriteSongs}
        loading={loading}
        onPlay={(song) => onPlaySong(song, favoriteSongs)}
        pagination={{
          current: currentPage,
          pageSize: pageSize,
          total: total,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total) => `共 ${total} 首歌曲`,
          onChange: handlePageChange,
        }}
      />
    </div>

  );
};
