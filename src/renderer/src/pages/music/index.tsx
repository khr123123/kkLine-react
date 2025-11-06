import React, { useState, useCallback } from 'react';
import { Button, Menu } from 'antd';
import { HomePage } from './HomePage·';
import { PlaylistPage } from './PlaylistPage';
import { PlaylistDetailPage } from './PlaylistDetailPage';
import { ArtistPage } from './ArtistPage';
import { ArtistDetailPage } from './ArtistDetailPage';
import { LibraryPage } from './LibraryPage';
import { FavoritePage } from './FavoritePage';
import './music.css';
import { TikTokOutlined } from '@ant-design/icons';

type ViewType = 'home' | 'playlist' | 'playlistDetail' | 'artist' | 'artistDetail' | 'library' | 'like';

export default function Music() {
    const [currentView, setCurrentView] = useState<ViewType>('home');
    const [selectedId, setSelectedId] = useState<number | null>(null);

    // 音频播放逻辑
    const [trackList, setTrackList] = useState<any[]>([]);
    const [currentSongIndex, setCurrentSongIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);

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
        // 重置选中ID（除了详情页）
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
                {/* 左侧 Logo */}
                <div className="logo flex items-center mr-8 cursor-pointer" >
                    <div className="logo-icon w-8 h-8 rounded-full bg-blue-300 mr-2 flex items-center justify-center">
                        <TikTokOutlined style={{ fontSize: 24 }} />
                    </div>
                    <span className="font-bold text-xl text-blue-500">KK MUSIC</span>
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
        </div>
    );
}
