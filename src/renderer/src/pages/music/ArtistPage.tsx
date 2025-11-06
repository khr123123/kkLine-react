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
  { id: '1', label: '男歌手', value: '0' },
  { id: '2', label: '女歌手', value: '1' },
  { id: '3', label: '组合/乐队', value: '2' },
];

const areaCategories = [
  { id: '-1', label: '全部', value: null },
  { id: '1', label: '美国', value: '美国' },
  { id: '2', label: '中国', value: '中国' },
  { id: '3', label: '日本', value: '日本' },
  { id: '4', label: '韩国', value: '韩国' },
  { id: '5', label: '其他', value: '其他' },
];

export const ArtistPage: React.FC<ArtistPageProps> = ({ onSelectArtist }) => {
  const { currentPage, pageSize, total, setTotal, handlePageChange, resetPagination } = usePagination();

  const [selectedGender, setSelectedGender] = useState('-1');
  const [selectedArea, setSelectedArea] = useState('-1');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [loading, setLoading] = useState(false);
  const [artistList, setArtistList] = useState([]);

  useEffect(() => {
    fetchArtists();
  }, [currentPage, pageSize, selectedGender, selectedArea]);

  const fetchArtists = async () => {
    const params = {
      pageNum: currentPage,
      pageSize,
      artistName: searchKeyword || null,
      gender: genderCategories.find((c) => c.id === selectedGender)?.value,
      area: areaCategories.find((c) => c.id === selectedArea)?.value,
    };
    setLoading(true)
    const result = await getAllArtists(params)
    if (result.code === 0) {
      setTotal(result.data.total);
      setArtistList(result.data.records);
      setLoading(false)
    }
  };

  const handleReset = () => {
    setSelectedGender('-1');
    setSelectedArea('-1');
    setSearchKeyword('');
    resetPagination();
  };

  return (
    <div className="flex h-full" style={{ marginTop: -9 }}>
      {/* 左侧筛选栏 */}
      <div className="
    w-48 p-4 border-r
    bg-token-bg-sidebar
    text-token-text
    border-token-border
  ">
        <div className="flex justify-between items-center mb-2" style={{ marginTop: -20 }}>
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
        <div className="mb-2 mt-4">
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
        <div style={{ marginTop: -10 }}>
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
      <div className="flex-1 p-6">
        <Spin spinning={loading}>
          {artistList.length > 0 ? (
            <>
              <div className="grid grid-cols-4 md:grid-cols-4 lg:grid-cols-5 gap-8">
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

              <div className="mt-2 flex justify-center">
                <Pagination
                  current={currentPage}
                  pageSize={pageSize}
                  total={total}
                  showSizeChanger={false}
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
