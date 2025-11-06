import React, { useState, useCallback } from 'react';
import { Button, Menu, message } from 'antd';
import { HomePage } from './HomePage·';
import { PlaylistPage } from './PlaylistPage';
import { PlaylistDetailPage } from './PlaylistDetailPage';
import { ArtistPage } from './ArtistPage';
import { ArtistDetailPage } from './ArtistDetailPage';
import { LibraryPage } from './LibraryPage';
import { FavoritePage } from './FavoritePage';
import './music.css';
import { TikTokOutlined } from '@ant-design/icons';
import { Track, useAudioPlayer } from './player/hooks/useAudioPlayer';
import PlayerBar from './player/components/PlayerBar';
import { cancelCollectSong, collectSong } from '@renderer/api/userFavoriteApis';

type ViewType = 'home' | 'playlist' | 'playlistDetail' | 'artist' | 'artistDetail' | 'library' | 'like';

export default function Music() {
    const [currentView, setCurrentView] = useState<ViewType>('home');
    const [selectedId, setSelectedId] = useState<number | null>(null);

    // 音频播放逻辑
    const [trackList, setTrackList] = useState<Track[]>([]);
    const [currentSongIndex, setCurrentSongIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);

    // 使用音频播放器 Hook
    const {
        audioRef,
        currentTrack,
        currentTime,
        duration,
        volume,
        playMode,
        togglePlayPause,
        nextTrack,
        prevTrack,
        seek,
        changeVolume,
        setPlayMode,
    } = useAudioPlayer(
        trackList,
        currentSongIndex,
        setCurrentSongIndex,
        setIsPlaying,
        isPlaying
    );

    const handlePlaySong = useCallback((song: any, allSongs: any[]) => {
        const tracks = (allSongs || []).map((s) => ({
            id: s.songId.toString(),
            title: s.songName,
            artist: s.artistName,
            album: s.album,
            cover: s.coverUrl,
            url: s.audioUrl,
            duration: parseFloat(s.duration) * 1000,
            likeStatus: s.likeStatus,
        }));

        const selectedIndex = allSongs.findIndex((s) => s.songId === song.songId);
        setTrackList(tracks);
        setCurrentSongIndex(selectedIndex >= 0 ? selectedIndex : 0);
        setIsPlaying(true);
        console.log('Playing:', song.songName);
    }, []);

    const handlePlayAll = useCallback((songs: any[]) => {
        if (!songs || songs.length === 0) {
            console.warn('No songs to play');
            return;
        }

        const tracks = songs.map((s) => ({
            id: s.songId.toString(),
            title: s.songName,
            artist: s.artistName,
            album: s.album,
            cover: s.coverUrl,
            url: s.audioUrl,
            duration: parseFloat(s.duration) * 1000,
            likeStatus: s.likeStatus,
        }));

        setTrackList(tracks);
        setCurrentSongIndex(0);
        setIsPlaying(true);
        console.log('Playing all songs, count:', songs.length);
    }, []);

    const handlePlayTrack = useCallback((index: number) => {
        setCurrentSongIndex(index);
        setIsPlaying(true);
    }, []);

    const handleRemoveTrack = useCallback((id: string) => {
        const newTrackList = trackList.filter((track) => track.id !== id);
        setTrackList(newTrackList);

        if (trackList[currentSongIndex]?.id === id) {
            if (newTrackList.length > 0) {
                setCurrentSongIndex(Math.min(currentSongIndex, newTrackList.length - 1));
            } else {
                setIsPlaying(false);
            }
        }
    }, [trackList, currentSongIndex]);

    const handleClearAll = useCallback(() => {
        setTrackList([]);
        setCurrentSongIndex(0);
        setIsPlaying(false);
        message.success('已清空播放列表');
    }, []);

    const handleToggleLike = useCallback(async () => {
        if (!currentTrack.id) return;
        // 当前是否已收藏（1=喜欢, 0=未喜欢）
        const isLiked = currentTrack.likeStatus === 1;
        try {
            if (isLiked) {
                // 取消收藏
                await cancelCollectSong({ songId: Number(currentTrack.id) });
            } else {
                // 收藏
                await collectSong({ songId: Number(currentTrack.id) });
            }
            // 计算新的状态
            const newStatus = isLiked ? 0 : 1;
            // 更新当前歌曲的喜欢状态
            setTrackList((prev) =>
                prev.map((track) =>
                    track.id === currentTrack.id
                        ? { ...track, likeStatus: newStatus }
                        : track
                )
            );
            message.success(newStatus === 1 ? '已添加到我喜欢' : '已取消喜欢');
        } catch (error) {
            message.error('操作失败，请稍后重试');
        }
    }, [currentTrack]);

    const handlePlayModeChange = useCallback(() => {
        const modes: Array<'order' | 'shuffle' | 'loop' | 'single'> = ['order', 'shuffle', 'loop', 'single'];
        const currentIndex = modes.indexOf(playMode);
        const nextMode = modes[(currentIndex + 1) % modes.length];
        setPlayMode(nextMode);

        const modeNames = {
            order: '顺序播放',
            shuffle: '随机播放',
            loop: '列表循环',
            single: '单曲循环',
        };
        message.info(modeNames[nextMode]);
    }, [playMode, setPlayMode]);

    const handleSelectPlaylist = useCallback((id: number) => {
        setSelectedId(id);
        setCurrentView('playlistDetail');
    }, []);

    const handleSelectArtist = useCallback((id: number) => {
        setSelectedId(id);
        setCurrentView('artistDetail');
    }, []);

    const handleNavigate = useCallback((view: ViewType) => {
        setCurrentView(view);
        if (!view.includes('Detail')) {
            setSelectedId(null);
        }
    }, []);

    const renderView = () => {
        switch (currentView) {
            case 'home':
                return (
                    <HomePage
                        onSelectPlaylist={handleSelectPlaylist}
                        onPlaySong={handlePlaySong}
                    />
                );
            case 'playlist':
                return <PlaylistPage onSelectPlaylist={handleSelectPlaylist} />;
            case 'playlistDetail':
                return selectedId ? (
                    <PlaylistDetailPage
                        playlistId={selectedId}
                        onPlaySong={handlePlaySong}
                        onPlayAll={handlePlayAll}
                    />
                ) : null;
            case 'artist':
                return <ArtistPage onSelectArtist={handleSelectArtist} />;
            case 'artistDetail':
                return selectedId ? (
                    <ArtistDetailPage
                        artistId={selectedId}
                        onPlaySong={handlePlaySong}
                    />
                ) : null;
            case 'library':
                return <LibraryPage onPlaySong={handlePlaySong} />;
            case 'like':
                return (
                    <FavoritePage
                        onPlaySong={handlePlaySong}
                        onPlayAll={handlePlayAll}
                    />
                );
            default:
                return null;
        }
    };

    const items = [
        { key: 'home', label: '首页' },
        { key: 'playlist', label: '歌单' },
        { key: 'artist', label: '歌手' },
        { key: 'library', label: '音乐库' },
        { key: 'like', label: '我喜欢' },
    ];

    return (
        <div className="music-container h-screen flex flex-col">
            {/* 导航栏 */}
            <div className="music-menu navigation-bar flex items-center bg-white shadow px-6 h-16">
                <div className="logo flex items-center mr-8 cursor-pointer">
                    <div className="logo-icon w-8 h-8 rounded-full bg-blue-300 mr-2 flex items-center justify-center">
                        <TikTokOutlined style={{ fontSize: 24 }} />
                    </div>
                    <span className="font-bold text-xl text-black-500">KK MUSIC</span>
                </div>
                <Menu
                    mode="horizontal"
                    items={items}
                    onClick={(v) => setCurrentView(v.key as ViewType)}
                    style={{ borderBottom: 'none' }}
                />
            </div>

            {/* 主内容区域 */}
            <div className="main-content flex-1 overflow-y-auto scrollableDiv">
                {renderView()}
            </div>

            {/* 底部播放条 */}
            <PlayerBar
                trackList={trackList}
                currentSongIndex={currentSongIndex}
                isPlaying={isPlaying}
                currentTime={currentTime}
                duration={duration}
                volume={volume}
                playMode={playMode}
                currentTrack={currentTrack}
                onTogglePlay={togglePlayPause}
                onPrev={prevTrack}
                onNext={nextTrack}
                onSeek={seek}
                onVolumeChange={changeVolume}
                onPlayModeChange={handlePlayModeChange}
                onPlayTrack={handlePlayTrack}
                onRemoveTrack={handleRemoveTrack}
                onClearAll={handleClearAll}
                onToggleLike={handleToggleLike}
                setCurrentSongIndex={setCurrentSongIndex}
                setIsPlaying={setIsPlaying}
            />
        </div>
    );
}
