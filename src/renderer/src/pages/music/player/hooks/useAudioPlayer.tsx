// hooks/useAudioPlayer.ts
import { useState, useRef, useEffect, useCallback } from 'react';

export interface Track {
    id: string;
    title: string;
    artist: string;
    album?: string;
    cover: string;
    url: string;
    duration: number;
    likeStatus?: number;
}

type PlayMode = 'order' | 'shuffle' | 'loop' | 'single';

export const useAudioPlayer = (
    trackList: Track[],
    currentSongIndex: number,
    setCurrentSongIndex: (index: number) => void,
    setIsPlaying: (playing: boolean) => void,
    isPlaying: boolean
) => {
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(50);
    const [playMode, setPlayMode] = useState<PlayMode>('order');
    const [playHistory, setPlayHistory] = useState<number[]>([]);

    // 初始化音频元素
    useEffect(() => {
        if (!audioRef.current) {
            audioRef.current = new Audio();
            audioRef.current.volume = volume / 100;
        }

        const audio = audioRef.current;

        const handleTimeUpdate = () => {
            setCurrentTime(audio.currentTime);
        };

        const handleLoadedMetadata = () => {
            setDuration(audio.duration);
        };

        const handleEnded = () => {
            nextTrack();
        };

        const handleCanPlay = () => {
            if (isPlaying) {
                audio.play().catch(console.error);
            }
        };

        audio.addEventListener('timeupdate', handleTimeUpdate);
        audio.addEventListener('loadedmetadata', handleLoadedMetadata);
        audio.addEventListener('ended', handleEnded);
        audio.addEventListener('canplay', handleCanPlay);

        return () => {
            audio.removeEventListener('timeupdate', handleTimeUpdate);
            audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
            audio.removeEventListener('ended', handleEnded);
            audio.removeEventListener('canplay', handleCanPlay);
        };
    }, [isPlaying]);

    // 加载当前曲目
    useEffect(() => {
        if (trackList.length > 0 && audioRef.current) {
            const currentTrack = trackList[currentSongIndex];
            if (currentTrack && audioRef.current.src !== currentTrack.url) {
                audioRef.current.src = currentTrack.url;
                audioRef.current.load();
            }
        }
    }, [trackList, currentSongIndex]);

    // 播放/暂停控制
    useEffect(() => {
        if (audioRef.current) {
            if (isPlaying) {
                audioRef.current.play().catch(console.error);
            } else {
                audioRef.current.pause();
            }
        }
    }, [isPlaying]);

    // 音量控制
    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = volume / 100;
        }
    }, [volume]);

    const togglePlayPause = useCallback(() => {
        setIsPlaying(!isPlaying);
    }, [isPlaying, setIsPlaying]);

    const seek = useCallback((time: number) => {
        if (audioRef.current) {
            audioRef.current.currentTime = time;
            setCurrentTime(time);
        }
    }, []);

    const getNextIndex = useCallback(() => {
        if (trackList.length === 0) return 0;

        switch (playMode) {
            case 'single':
                return currentSongIndex;
            case 'shuffle':
                return Math.floor(Math.random() * trackList.length);
            case 'loop':
            case 'order':
            default:
                return (currentSongIndex + 1) % trackList.length;
        }
    }, [playMode, currentSongIndex, trackList.length]);

    const getPrevIndex = useCallback(() => {
        if (trackList.length === 0) return 0;

        switch (playMode) {
            case 'single':
                return currentSongIndex;
            case 'shuffle':
                return Math.floor(Math.random() * trackList.length);
            case 'loop':
            case 'order':
            default:
                return (currentSongIndex - 1 + trackList.length) % trackList.length;
        }
    }, [playMode, currentSongIndex, trackList.length]);

    const nextTrack = useCallback(() => {
        const nextIndex = getNextIndex();
        setCurrentSongIndex(nextIndex);
        setIsPlaying(true);
    }, [getNextIndex, setCurrentSongIndex, setIsPlaying]);

    const prevTrack = useCallback(() => {
        const prevIndex = getPrevIndex();
        setCurrentSongIndex(prevIndex);
        setIsPlaying(true);
    }, [getPrevIndex, setCurrentSongIndex, setIsPlaying]);

    const changeVolume = useCallback((newVolume: number) => {
        setVolume(newVolume);
    }, []);

    const currentTrack = trackList[currentSongIndex] || {
        id: '',
        title: '暂无播放',
        artist: '未知艺术家',
        cover: '',
        url: '',
        duration: 0,
    };

    return {
        audioRef,
        currentTrack,
        currentTime,
        duration,
        volume,
        playMode,
        isPlaying,
        togglePlayPause,
        nextTrack,
        prevTrack,
        seek,
        changeVolume,
        setPlayMode,
    };
};
