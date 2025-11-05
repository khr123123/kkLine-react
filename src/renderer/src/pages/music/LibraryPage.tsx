import React, { useEffect, useState } from 'react';
import { Spin } from 'antd';
import { SongTable } from './components/SongTable';
import { SearchBar } from './components/SearchBar';
import { useDataFetch } from './hooks/useDataFetch';
import { usePagination } from './hooks/usePagination';
import { getAllSongs } from '@renderer/api/songApis';

interface LibraryPageProps {
  onPlaySong: (song: any, allSongs: any[]) => void;
}

export const LibraryPage: React.FC<LibraryPageProps> = ({ onPlaySong }) => {
  const { data, loading, fetchData } = useDataFetch();
  const { currentPage, pageSize, total, setTotal, handlePageChange } = usePagination(1, 20);
  const [searchKeyword, setSearchKeyword] = useState('');

  // ✅ 安全访问数据
  const librarySongs = data?.items || [];

  useEffect(() => {
    fetchLibrarySongs();
  }, [currentPage, pageSize]);

  const fetchLibrarySongs = async () => {
    const result = await fetchData(
      () =>
        getAllSongs({
          pageNum: currentPage,
          pageSize: pageSize,
          songName: searchKeyword || '',
          artistName: '',
          album: '',
        }),
      '获取歌曲列表失败'
    );

    if (result) {
      setTotal(result.total);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
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
