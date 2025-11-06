import { useEffect, useRef } from 'react';
import { usePlayerStore } from '../../../../store/usePlayerStore';

export const useAudioPlayer = () => {
    const audioRef = useRef<HTMLAudioElement | null>(null);
    
    const {
        trackList,
        currentSongIndex,
        isPlaying,
        setCurrentTime,
        setDuration,
        setAudioRef,
        nextTrack,
        volume,
    } = usePlayerStore();

    // 初始化音频元素
    useEffect(() => {
        if (!audioRef.current) {
            audioRef.current = new Audio();
            audioRef.current.volume = volume / 100;
            setAudioRef(audioRef.current);
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
    }, [isPlaying, nextTrack, setCurrentTime, setDuration, setAudioRef, volume]);

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
};
