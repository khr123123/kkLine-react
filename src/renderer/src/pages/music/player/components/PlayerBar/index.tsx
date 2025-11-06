// components/PlayerBar/index.tsx
import React, { useState } from 'react';
import Left from './Left';
import Center from './Center';
import Right from './Right';
import MusicDrawer from '../MusicDrawer';
import { Track } from '../../hooks/useAudioPlayer';
import { message } from 'antd';

interface PlayerBarProps {
    trackList: Track[];
    currentSongIndex: number;
    isPlaying: boolean;
    currentTime: number;
    duration: number;
    volume: number;
    playMode: 'order' | 'shuffle' | 'loop' | 'single';
    currentTrack: Track;
    onTogglePlay: () => void;
    onPrev: () => void;
    onNext: () => void;
    onSeek: (value: number) => void;
    onVolumeChange: (value: number) => void;
    onPlayModeChange: () => void;
    onPlayTrack: (index: number) => void;
    onRemoveTrack: (id: string) => void;
    onClearAll: () => void;
    onToggleLike: () => void;
    setCurrentSongIndex: (index: number) => void;
    setIsPlaying: (playing: boolean) => void;
}

const PlayerBar: React.FC<PlayerBarProps> = ({
    trackList,
    currentSongIndex,
    isPlaying,
    currentTime,
    duration,
    volume,
    playMode,
    currentTrack,
    onTogglePlay,
    onPrev,
    onNext,
    onSeek,
    onVolumeChange,
    onPlayModeChange,
    onPlayTrack,
    onRemoveTrack,
    onClearAll,
    onToggleLike,
    setCurrentSongIndex,
    setIsPlaying,
}) => {
    const [showDrawer, setShowDrawer] = useState(false);

    return (
        <>
            <footer className="border-t flex items-center justify-between shadow-lg bg-white h-20 px-4">
                <Left currentTrack={currentTrack} onShowDrawer={() => setShowDrawer(true)} />

                <Center
                    isPlaying={isPlaying}
                    currentTime={currentTime}
                    duration={duration}
                    currentLikeStatus={currentTrack.likeStatus || 0}
                    onTogglePlay={onTogglePlay}
                    onPrev={onPrev}
                    onNext={onNext}
                    onSeek={onSeek}
                    onToggleLike={onToggleLike}
                />

                <Right
                    volume={volume}
                    playMode={playMode}
                    trackList={trackList}
                    currentSongIndex={currentSongIndex}
                    onVolumeChange={onVolumeChange}
                    onPlayModeChange={onPlayModeChange}
                    onPlayTrack={onPlayTrack}
                    onRemoveTrack={onRemoveTrack}
                    onClearAll={onClearAll}
                />
            </footer>

            <MusicDrawer
                visible={showDrawer}
                onClose={() => setShowDrawer(false)}
                currentTrack={currentTrack}
                isPlaying={isPlaying}
                trackList={trackList}
                currentSongIndex={currentSongIndex}
                setCurrentSongIndex={setCurrentSongIndex}
                setIsPlaying={setIsPlaying}
            />
        </>
    );
};

export default PlayerBar;
