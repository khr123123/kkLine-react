import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { message } from 'antd';
import { cancelCollectSong, collectSong } from '@renderer/api/userFavoriteApis';

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

interface PlayerState {
    // 状态
    trackList: Track[];
    currentSongIndex: number;
    isPlaying: boolean;
    currentTime: number;
    duration: number;
    volume: number;
    playMode: PlayMode;
    audioRef: HTMLAudioElement | null;

    // Actions
    setTrackList: (tracks: Track[]) => void;
    setCurrentSongIndex: (index: number) => void;
    setIsPlaying: (playing: boolean) => void;
    setCurrentTime: (time: number) => void;
    setDuration: (duration: number) => void;
    setVolume: (volume: number) => void;
    setPlayMode: (mode: PlayMode) => void;
    setAudioRef: (ref: HTMLAudioElement) => void;

    // 播放控制
    handlePlaySong: (song: any, allSongs: any[]) => void;
    handlePlayAll: (songs: any[]) => void;
    handlePlayTrack: (index: number) => void;
    handleRemoveTrack: (id: string) => void;
    handleClearAll: () => void;
    handleToggleLike: () => Promise<void>;
    handlePlayModeChange: () => void;
    togglePlayPause: () => void;
    nextTrack: () => void;
    prevTrack: () => void;
    seek: (time: number) => void;
    changeVolume: (volume: number) => void;

    // 获取当前曲目
    getCurrentTrack: () => Track;
}

export const usePlayerStore = create<PlayerState>()(
    persist(
        (set, get) => ({
            // 初始状态
            trackList: [],
            currentSongIndex: 0,
            isPlaying: false,
            currentTime: 0,
            duration: 0,
            volume: 50,
            playMode: 'order',
            audioRef: null,

            // 基础 setters
            setTrackList: (tracks) => set({ trackList: tracks }),
            setCurrentSongIndex: (index) => set({ currentSongIndex: index }),
            setIsPlaying: (playing) => set({ isPlaying: playing }),
            setCurrentTime: (time) => set({ currentTime: time }),
            setDuration: (duration) => set({ duration: duration }),
            setVolume: (volume) => set({ volume }),
            setPlayMode: (mode) => set({ playMode: mode }),
            setAudioRef: (ref) => set({ audioRef: ref }),

            // 获取当前曲目
            getCurrentTrack: () => {
                const { trackList, currentSongIndex } = get();
                return trackList[currentSongIndex] || {
                    id: '',
                    title: '暂无播放',
                    artist: '未知艺术家',
                    cover: '',
                    url: '',
                    duration: 0,
                };
            },

            // 播放单曲
            handlePlaySong: (song, allSongs) => {
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
                set({
                    trackList: tracks,
                    currentSongIndex: selectedIndex >= 0 ? selectedIndex : 0,
                    isPlaying: true,
                });
            },

            // 播放全部
            handlePlayAll: (songs) => {
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

                set({
                    trackList: tracks,
                    currentSongIndex: 0,
                    isPlaying: true,
                });
            },

            // 播放指定曲目
            handlePlayTrack: (index) => {
                set({
                    currentSongIndex: index,
                    isPlaying: true,
                });
            },

            // 移除曲目
            handleRemoveTrack: (id) => {
                const { trackList, currentSongIndex } = get();
                const newTrackList = trackList.filter((track) => track.id !== id);

                if (trackList[currentSongIndex]?.id === id) {
                    if (newTrackList.length > 0) {
                        set({
                            trackList: newTrackList,
                            currentSongIndex: Math.min(currentSongIndex, newTrackList.length - 1),
                        });
                    } else {
                        set({
                            trackList: newTrackList,
                            currentSongIndex: 0,
                            isPlaying: false,
                        });
                    }
                } else {
                    set({ trackList: newTrackList });
                }
            },

            // 清空播放列表
            handleClearAll: () => {
                set({
                    trackList: [],
                    currentSongIndex: 0,
                    isPlaying: false,
                });
                message.success('已清空播放列表');
            },

            // 切换喜欢状态
            handleToggleLike: async () => {
                const currentTrack = get().getCurrentTrack();
                if (!currentTrack.id) return;

                const isLiked = currentTrack.likeStatus === 1;
                try {
                    if (isLiked) {
                        await cancelCollectSong({ songId: Number(currentTrack.id) });
                    } else {
                        await collectSong({ songId: Number(currentTrack.id) });
                    }

                    const newStatus = isLiked ? 0 : 1;
                    set((state) => ({
                        trackList: state.trackList.map((track) =>
                            track.id === currentTrack.id
                                ? { ...track, likeStatus: newStatus }
                                : track
                        ),
                    }));
                    message.success(newStatus === 1 ? '已添加到我喜欢' : '已取消喜欢');
                } catch (error) {
                    message.error('操作失败，请稍后重试');
                }
            },

            // 切换播放模式
            handlePlayModeChange: () => {
                const modes: PlayMode[] = ['order', 'shuffle', 'loop', 'single'];
                const { playMode } = get();
                const currentIndex = modes.indexOf(playMode);
                const nextMode = modes[(currentIndex + 1) % modes.length];

                set({ playMode: nextMode });

                const modeNames = {
                    order: '顺序播放',
                    shuffle: '随机播放',
                    loop: '列表循环',
                    single: '单曲循环',
                };
                message.info(modeNames[nextMode]);
            },

            // 播放/暂停
            togglePlayPause: () => {
                set((state) => ({ isPlaying: !state.isPlaying }));
            },

            // 下一曲
            nextTrack: () => {
                const { trackList, currentSongIndex, playMode } = get();
                if (trackList.length === 0) return;

                let nextIndex = 0;
                switch (playMode) {
                    case 'single':
                        nextIndex = currentSongIndex;
                        break;
                    case 'shuffle':
                        nextIndex = Math.floor(Math.random() * trackList.length);
                        break;
                    case 'loop':
                    case 'order':
                    default:
                        nextIndex = (currentSongIndex + 1) % trackList.length;
                }

                set({
                    currentSongIndex: nextIndex,
                    isPlaying: true,
                });
            },

            // 上一曲
            prevTrack: () => {
                const { trackList, currentSongIndex, playMode } = get();
                if (trackList.length === 0) return;

                let prevIndex = 0;
                switch (playMode) {
                    case 'single':
                        prevIndex = currentSongIndex;
                        break;
                    case 'shuffle':
                        prevIndex = Math.floor(Math.random() * trackList.length);
                        break;
                    case 'loop':
                    case 'order':
                    default:
                        prevIndex = (currentSongIndex - 1 + trackList.length) % trackList.length;
                }

                set({
                    currentSongIndex: prevIndex,
                    isPlaying: true,
                });
            },

            // 跳转进度
            seek: (time) => {
                const { audioRef } = get();
                if (audioRef) {
                    audioRef.currentTime = time;
                    set({ currentTime: time });
                }
            },

            // 调整音量
            changeVolume: (volume) => {
                const { audioRef } = get();
                set({ volume });
                if (audioRef) {
                    audioRef.volume = volume / 100;
                }
            },
        }),
        {
            name: 'player-storage', // localStorage key
            partialize: (state) => ({
                // 只持久化这些字段
                trackList: state.trackList,
                currentSongIndex: state.currentSongIndex,
                volume: state.volume,
                playMode: state.playMode,
            }),
        }
    )
);