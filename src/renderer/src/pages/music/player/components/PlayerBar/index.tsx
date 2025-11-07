// components/PlayerBar/index.tsx
import React, { useState } from 'react';
import Left from './Left';
import Center from './Center';
import Right from './Right';
import MusicDrawer from '../MusicDrawer';
import { message, Slider } from 'antd';
import { formatTime2Player } from '@renderer/utils/timeUtil';
import { Track } from '@renderer/store/usePlayerStore';

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
            <footer className="bg-white shadow-lg border-t border-gray-400 px-4 pt-0 pb-2 flex flex-col gap-0 rounded-lg">
                <div className="flex items-center gap-1 w-full mt-0 pt-0">
                    <span className="text-[11px] text-gray-500 w-12 text-right">
                        {formatTime2Player(currentTime)}
                    </span>
                    <Slider
                        value={currentTime}
                        max={duration || 100}
                        step={0.1}
                        onChange={onSeek}
                        tooltip={{ formatter: (value) => formatTime2Player(value || 0) }}
                        className="flex-1"
                    />
                    <span className="text-[11px] text-gray-500 w-12">
                        {formatTime2Player(duration)}
                    </span>
                </div>

                {/* ✅ 主控制区 */}
                <div className="flex items-center justify-between h-14">
                    <Left
                        currentTrack={currentTrack}
                        onShowDrawer={() => setShowDrawer(true)}
                    />

                    <Center
                        isPlaying={isPlaying}
                        currentLikeStatus={currentTrack.likeStatus || 0}
                        onTogglePlay={onTogglePlay}
                        onPrev={onPrev}
                        onNext={onNext}
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
                </div>
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
