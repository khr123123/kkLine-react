import React, { useEffect, useState } from 'react';
import { SongTable } from './components/SongTable';
import { SearchBar } from './components/SearchBar';
import { usePagination } from './hooks/usePagination';
import { getAllSongs } from '@renderer/api/songApis';

interface LibraryPageProps {
  onPlaySong: (song: any, allSongs: any[]) => void;
}

export const LibraryPage: React.FC<LibraryPageProps> = ({ onPlaySong }) => {
  const { currentPage, pageSize, total, setTotal, handlePageChange } =
    usePagination(1, 10);

  const [searchKeyword, setSearchKeyword] = useState('');
  const [librarySongs, setLibrarySongs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchLibrarySongs();
  }, [currentPage, pageSize]);

  const fetchLibrarySongs = async () => {
    setLoading(true);

    const params = {
      pageNum: currentPage,
      pageSize,
      songName: searchKeyword || '',
      artistName: '',
      album: '',
    };

    const result = await getAllSongs(params);

    if (result) {
      const { total, records } = result.data;

      // ✅ 如果有搜索关键字但没结果 → 回到第一页重新查
      if (searchKeyword && total === 0) {
        setLibrarySongs([]);
        setTotal(0);

        if (currentPage !== 1) {
          handlePageChange(1);
        }

        setLoading(false);
        return;
      }

      // ✅ 正常情况
      setTotal(total);
      setLibrarySongs(records);
    }

    setLoading(false);
  };

  return (
    <div className="p-6" style={{ marginTop: -42 }}>
      <div className="flex justify-between items-center mb-0">
        <h2 className="text-2xl font-semibold">音乐库</h2>
        <SearchBar
          value={searchKeyword}
          placeholder="搜索歌曲"
          onChange={setSearchKeyword}
          onSearch={() => {
            if (currentPage !== 1) {
              handlePageChange(1);
            } else {
              fetchLibrarySongs();
            }
          }}
          style={{ width: 250 }}
        />
      </div>
      <SongTable
        songs={librarySongs}
        loading={loading}
        onPlay={(song) => onPlaySong(song, librarySongs)}
        pagination={{
          current: currentPage,
          pageSize,
          total,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total) => `共 ${total} 首歌曲`,
          onChange: handlePageChange,
        }}
      />
    </div>
  );
};
