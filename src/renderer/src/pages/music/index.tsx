import { useState, useCallback, useEffect } from 'react';
import { Menu } from 'antd';
import { HomePage } from './HomePage·';
import { PlaylistPage } from './PlaylistPage';
import { PlaylistDetailPage } from './PlaylistDetailPage';
import { ArtistPage } from './ArtistPage';
import { ArtistDetailPage } from './ArtistDetailPage';
import { LibraryPage } from './LibraryPage';
import { FavoritePage } from './FavoritePage';
import './music.css';
import { TikTokOutlined } from '@ant-design/icons';
import PlayerBar from './player/components/PlayerBar';
import { useAudioPlayer } from './player/hooks/useAudioPlayer';
import { usePlayerStore } from '@renderer/store/usePlayerStore';
type ViewType = 'home' | 'playlist' | 'playlistDetail' | 'artist' | 'artistDetail' | 'library' | 'like';

export default function Music() {
    const [currentView, setCurrentView] = useState<ViewType>('home');
    const [selectedId, setSelectedId] = useState<number | null>(null);

    // 初始化音频播放器
    useAudioPlayer();

    // 从 Zustand store 获取状态和方法
    const {
        trackList,
        currentSongIndex,
        isPlaying,
        currentTime,
        duration,
        volume,
        playMode,
        handlePlaySong,
        handlePlayAll,
        handlePlayTrack,
        handleRemoveTrack,
        handleClearAll,
        handleToggleLike,
        handlePlayModeChange,
        togglePlayPause,
        nextTrack,
        prevTrack,
        seek,
        changeVolume,
        getCurrentTrack,
        setCurrentSongIndex,
        setIsPlaying
    } = usePlayerStore();

    const currentTrack = getCurrentTrack();

    const handleSelectPlaylist = useCallback((id: number) => {
        setSelectedId(id);
        setCurrentView('playlistDetail');
    }, []);

    const handleSelectArtist = useCallback((id: number) => {
        setSelectedId(id);
        setCurrentView('artistDetail');
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
                        onPlayAll={handlePlayAll} />
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

            <div className="main-content flex-1 overflow-y-auto scrollableDiv">
                {renderView()}
            </div>

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
                setIsPlaying={setIsPlaying} />
        </div>
    );
}
