import React, { useEffect, useState } from 'react';
import { Select, Tabs, Spin, Pagination } from 'antd';
import { SearchBar } from './components/SearchBar';
import { PlaylistCard } from './components/PlaylistCard';
import { useDataFetch } from './hooks/useDataFetch';
import { usePagination } from './hooks/usePagination';
import { getFavoritePlaylists } from '@renderer/api/userFavoriteApis';
import { getAllPlaylists } from '@renderer/api/playlistApis';

const { Option } = Select;
const { TabPane } = Tabs;

const playlistTags = [
  '全部', '节奏布鲁斯', '欧美流行', '华语流行', '粤语流行', '国风流行',
  '韩语流行', '日本流行', '嘻哈说唱', '非洲节拍', '原声带', '轻音乐',
  '摇滚', '朋克', '电子', '国风', '乡村', '古典'
];

interface PlaylistPageProps {
  onSelectPlaylist: (id: number) => void;
}

export const PlaylistPage: React.FC<PlaylistPageProps> = ({ onSelectPlaylist }) => {
  const { data, loading, fetchData } = useDataFetch();
  const { currentPage, pageSize, total, setTotal, handlePageChange, resetPagination } = usePagination();

  const [playlistType, setPlaylistType] = useState<'all' | 'favorite'>('all');
  const [selectedTag, setSelectedTag] = useState('全部');
  const [searchKeyword, setSearchKeyword] = useState('');

  // ✅ 安全访问数据
  const playlists = data?.items || [];

  useEffect(() => {
    fetchPlaylists();
  }, [currentPage, pageSize, playlistType, selectedTag]);

  const fetchPlaylists = async () => {
    const params = {
      pageNum: currentPage,
      pageSize,
      title: searchKeyword || null,
      style: selectedTag === '全部' ? null : selectedTag,
    };

    const result = await fetchData(
      () => playlistType === 'favorite'
        ? getFavoritePlaylists(params)
        : getAllPlaylists(params),
      '获取歌单列表失败'
    );

    if (result) {
      setTotal(result.total);
    }
  };

  const handleTabChange = (key: string) => {
    setPlaylistType(key as 'all' | 'favorite');
    resetPagination();
  };

  return (
    <div className="p-6">
      <div className="mb-4 flex gap-4">
        <SearchBar
          value={searchKeyword}
          placeholder="搜索歌单..."
          onChange={setSearchKeyword}
          onSearch={fetchPlaylists}
          style={{ width: 300 }}
        />
        <Select
          value={selectedTag}
          onChange={(val) => {
            setSelectedTag(val);
            resetPagination();
          }}
          style={{ width: 200 }}
        >
          {playlistTags.map((tag) => (
            <Option key={tag} value={tag}>{tag}</Option>
          ))}
        </Select>
      </div>

      <Tabs activeKey={playlistType} onChange={handleTabChange}>
        <TabPane tab="精选歌单" key="all" />
        <TabPane tab="我的收藏" key="favorite" />
      </Tabs>

      <Spin spinning={loading}>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {playlists.map((playlist) => (
            <PlaylistCard
              key={playlist.playlistId}
              playlist={playlist}
              onClick={onSelectPlaylist}
            />
          ))}
        </div>

        {playlists.length > 0 && (
          <div className="mt-6 flex justify-center">
            <Pagination
              current={currentPage}
              pageSize={pageSize}
              total={total}
              showSizeChanger
              showQuickJumper
              showTotal={(total) => `共 ${total} 项`}
              onChange={handlePageChange}
            />
          </div>
        )}

        {!loading && playlists.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            暂无数据
          </div>
        )}
      </Spin>
    </div>
  );
};
