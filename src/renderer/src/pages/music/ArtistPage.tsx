import React, { useEffect, useState } from 'react';
import { Button, Spin, Pagination } from 'antd';
import { SearchBar } from './components/SearchBar';
import { useDataFetch } from './hooks/useDataFetch';
import { usePagination } from './hooks/usePagination';
import { addImageParams } from '../../utils/timeUtil';
import { getAllArtists } from '@renderer/api/artistApis';

interface Artist {
  artistId: number;
  artistName: string;
  avatar: string;
}

interface ArtistPageProps {
  onSelectArtist: (id: number) => void;
}

const genderCategories = [
  { id: '-1', label: '全部', value: null },
  { id: '1', label: '男歌手', value: '男' },
  { id: '2', label: '女歌手', value: '女' },
  { id: '3', label: '组合', value: '组合' },
];

const areaCategories = [
  { id: '-1', label: '全部', value: null },
  { id: '1', label: '华语', value: '华语' },
  { id: '2', label: '欧美', value: '欧美' },
  { id: '3', label: '日本', value: '日本' },
  { id: '4', label: '韩国', value: '韩国' },
  { id: '5', label: '其他', value: '其他' },
];

export const ArtistPage: React.FC<ArtistPageProps> = ({ onSelectArtist }) => {
  const { data, loading, fetchData } = useDataFetch();
  const { currentPage, pageSize, total, setTotal, handlePageChange, resetPagination } = usePagination();

  const [selectedGender, setSelectedGender] = useState('-1');
  const [selectedArea, setSelectedArea] = useState('-1');
  const [searchKeyword, setSearchKeyword] = useState('');

  // ✅ 安全访问数据
  const artistList = data?.items || [];

  useEffect(() => {
    fetchArtists();
  }, [currentPage, pageSize, selectedGender, selectedArea]);

  const fetchArtists = async () => {
    const params = {
      pageNum: currentPage,
      pageSize,
      name: searchKeyword || null,
      gender:
        selectedGender === '-1'
          ? null
          : genderCategories.find((c) => c.id === selectedGender)?.value,
      area:
        selectedArea === '-1'
          ? null
          : areaCategories.find((c) => c.id === selectedArea)?.value,
    };

    const result = await fetchData(
      () => getAllArtists(params),
      '获取歌手列表失败'
    );

    if (result) {
      setTotal(result.total);
    }
  };

  const handleReset = () => {
    setSelectedGender('-1');
    setSelectedArea('-1');
    setSearchKeyword('');
    resetPagination();
  };

  return (
    <div className="flex h-full">
      {/* 左侧筛选栏 */}
      <div className="w-64 bg-gray-50 p-4 border-r">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">歌手分类</h2>
          <Button type="link" size="small" onClick={handleReset}>
            重置
          </Button>
        </div>

        <SearchBar
          value={searchKeyword}
          placeholder="搜索歌手"
          onChange={setSearchKeyword}
          onSearch={fetchArtists}
        />

        {/* 性别筛选 */}
        <div className="mb-4 mt-4">
          <h3 className="font-medium mb-2">性别</h3>
          <div className="space-y-1">
            {genderCategories.map((cat) => (
              <Button
                key={cat.id}
                type={selectedGender === cat.id ? 'primary' : 'text'}
                block
                onClick={() => {
                  setSelectedGender(cat.id);
                  resetPagination();
                }}
              >
                {cat.label}
              </Button>
            ))}
          </div>
        </div>

        {/* 地区筛选 */}
        <div>
          <h3 className="font-medium mb-2">地区</h3>
          <div className="space-y-1">
            {areaCategories.map((cat) => (
              <Button
                key={cat.id}
                type={selectedArea === cat.id ? 'primary' : 'text'}
                block
                onClick={() => {
                  setSelectedArea(cat.id);
                  resetPagination();
                }}
              >
                {cat.label}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* 右侧歌手列表 */}
      <div className="flex-1 p-6 overflow-y-auto">
        <Spin spinning={loading}>
          {artistList.length > 0 ? (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8">
                {artistList.map((artist: Artist) => (
                  <div
                    key={artist.artistId}
                    className="cursor-pointer group"
                    onClick={() => onSelectArtist(artist.artistId)}
                  >
                    <div className="relative rounded-full overflow-hidden mb-2">
                      <img
                        src={addImageParams(artist.avatar, 'param=230y230')}
                        alt={artist.artistName}
                        className="w-full aspect-square object-cover group-hover:scale-110 transition"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition flex items-center justify-center">
                        <h3 className="text-white text-lg font-semibold opacity-0 group-hover:opacity-100 transition">
                          {artist.artistName}
                        </h3>
                      </div>
                    </div>
                    <p className="text-center text-sm">{artist.artistName}</p>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex justify-center">
                <Pagination
                  current={currentPage}
                  pageSize={pageSize}
                  total={total}
                  showSizeChanger
                  showQuickJumper
                  showTotal={(total) => `共 ${total} 位歌手`}
                  onChange={handlePageChange}
                />
              </div>
            </>
          ) : (
            !loading && (
              <div className="text-center py-12 text-gray-400">暂无歌手数据</div>
            )
          )}
        </Spin>
      </div>
    </div>
  );
};
