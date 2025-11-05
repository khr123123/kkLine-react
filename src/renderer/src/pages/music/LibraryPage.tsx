import React, { useEffect, useState } from 'react';
import { Spin } from 'antd';
import { SongTable } from './components/SongTable';
import { SearchBar } from './components/SearchBar';
import { usePagination } from './hooks/usePagination';
import { getAllSongs } from '@renderer/api/songApis';

interface LibraryPageProps {
  onPlaySong: (song: any, allSongs: any[]) => void;
}

export const LibraryPage: React.FC<LibraryPageProps> = ({ onPlaySong }) => {
  const { currentPage, pageSize, total, setTotal, handlePageChange } = usePagination(1, 20);
  const [searchKeyword, setSearchKeyword] = useState('');

  const [librarySongs, setLibrarySongs] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchLibrarySongs();
  }, [currentPage, pageSize]);

  const fetchLibrarySongs = async () => {
    const result = await
      getAllSongs({
        pageNum: currentPage,
        pageSize: pageSize,
        songName: searchKeyword || '',
        artistName: '',
        album: '',
      })

    if (result) {
      setTotal(result.data.total);
      setLibrarySongs(result.data.records);
      setLoading(false)
    }
  };

  return (
    <div className="p-6" style={{ marginTop: -40 }}>
      <div className="flex justify-between items-center mb-0">
        <h2 className="text-2xl font-semibold">音乐库</h2>
        <SearchBar
          value={searchKeyword}
          placeholder="搜索歌曲"
          onChange={setSearchKeyword}
          onSearch={fetchLibrarySongs}
          style={{ width: 300 }}
        />
      </div>

      <Spin spinning={loading}>
        <SongTable
          songs={librarySongs}
          loading={false}
          onPlay={(song) => onPlaySong(song, librarySongs)}
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

        {!loading && librarySongs.length === 0 && (
          <div className="text-center py-12 text-gray-400">暂无歌曲</div>
        )}
      </Spin>
    </div>
  );
};
