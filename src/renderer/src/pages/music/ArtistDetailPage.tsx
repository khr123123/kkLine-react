import React, { useEffect } from 'react';
import { Spin } from 'antd';
import { SongTable } from './components/SongTable';
import { useDataFetch } from './hooks/useDataFetch';
import { getArtistDetail } from '@renderer/api/artistApis';

interface ArtistDetailPageProps {
    artistId: number;
    onPlaySong: (song: any, allSongs: any[]) => void;
}

export const ArtistDetailPage: React.FC<ArtistDetailPageProps> = ({
    artistId,
    onPlaySong,
}) => {
    const { data, loading, fetchData } = useDataFetch();

    // ✅ 安全访问数据
    const artistDetail = data || null;
    const songs = artistDetail?.songs || [];

    useEffect(() => {
        if (artistId) {
            fetchArtistDetail();
        }
    }, [artistId]);

    const fetchArtistDetail = async () => {
        await fetchData(() => getArtistDetail({ id: artistId }) as any, '获取歌手详情失败');
    };

    if (loading && !artistDetail) {
        return (
            <div className="flex items-center justify-center h-96">
                <Spin size="large" />
            </div>
        );
    }

    if (!artistDetail) {
        return (
            <div className="flex items-center justify-center h-96 text-gray-400">
                歌手不存在
            </div>
        );
    }

    return (
        <div className="p-6">
            {/* 歌手头部信息 */}
            <div className="flex gap-8 mb-8">
                <img
                    src={artistDetail.avatar}
                    alt={artistDetail.artistName}
                    className="w-48 h-48 rounded-full object-cover shadow-lg"
                />
                <div className="flex-1">
                    <h1 className="text-3xl font-bold mb-4">{artistDetail.artistName}</h1>
                    <div className="space-y-2 text-sm text-gray-600">
                        {artistDetail.birth && (
                            <p>生日：{new Date(artistDetail.birth).toLocaleDateString()}</p>
                        )}
                        {artistDetail.area && <p>地区：{artistDetail.area}</p>}
                        {artistDetail.introduction && (
                            <p className="line-clamp-4">简介：{artistDetail.introduction}</p>
                        )}
                    </div>
                </div>
            </div>

            {/* 歌曲列表 */}
            <h2 className="text-2xl font-semibold mb-4">
                所有歌曲 ({songs.length})
            </h2>

            {songs.length > 0 ? (
                <SongTable
                    songs={songs}
                    loading={loading}
                    pagination={{
                        pageSize: 5,
                        total: songs.length,
                    }}
                    onPlay={(song) => onPlaySong(song, songs)}
                />
            ) : (
                <div className="text-center py-12 text-gray-400">暂无歌曲</div>
            )}
        </div>
    );
};
