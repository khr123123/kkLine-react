// components/PlayerBar/Right.tsx
import React, { useState } from 'react';
import { Slider, Popover, Button, List, Empty, Tooltip } from 'antd';
import {
    SoundOutlined,
    SoundFilled,
    OrderedListOutlined,
    RetweetOutlined,
    SwapOutlined,
    UndoOutlined,
    DeleteOutlined,
    PlayCircleOutlined,
} from '@ant-design/icons';
import { Track } from '../../hooks/useAudioPlayer';
import { formatMillisecondsToTime2Player } from '../../../../../utils/timeUtil';

interface RightProps {
    volume: number;
    playMode: 'order' | 'shuffle' | 'loop' | 'single';
    trackList: Track[];
    currentSongIndex: number;
    onVolumeChange: (value: number) => void;
    onPlayModeChange: () => void;
    onPlayTrack: (index: number) => void;
    onRemoveTrack: (id: string) => void;
    onClearAll: () => void;
}

const playModeConfig = {
    order: {
        icon: <OrderedListOutlined />,
        label: '顺序播放',
        next: 'shuffle' as const,
    },
    shuffle: {
        icon: <SwapOutlined />,
        label: '随机播放',
        next: 'loop' as const,
    },
    loop: {
        icon: <RetweetOutlined />,
        label: '列表循环',
        next: 'single' as const,
    },
    single: {
        icon: <UndoOutlined />,
        label: '单曲循环',
        next: 'order' as const,
    },
};

const Right: React.FC<RightProps> = ({
    volume,
    playMode,
    trackList,
    currentSongIndex,
    onVolumeChange,
    onPlayModeChange,
    onPlayTrack,
    onRemoveTrack,
    onClearAll,
}) => {
    const [hoveredIndex, setHoveredIndex] = useState<number>(-1);
    const isMuted = volume === 0;

    const toggleMute = () => {
        onVolumeChange(isMuted ? 50 : 0);
    };

    const playlistContent = (
        <div className="w-96" style={{ maxHeight: '400px' }}>
            <div className="flex items-center justify-between mb-2 px-2">
                <span className="text-sm text-gray-500">播放列表</span>
                <Button
                    type="text"
                    size="small"
                    icon={<DeleteOutlined />}
                    onClick={onClearAll}
                >
                    清空
                </Button>
            </div>

            {trackList.length === 0 ? (
                <Empty description="暂无播放歌曲" />
            ) : (
                <div className="overflow-y-auto" style={{ maxHeight: '350px' }}>
                    <List
                        dataSource={trackList}
                        renderItem={(item, index) => (
                            <List.Item
                                key={item.id}
                                className={`cursor-pointer px-2 hover:bg-gray-50 ${index === currentSongIndex ? 'bg-blue-50' : ''
                                    }`}
                                onMouseEnter={() => setHoveredIndex(index)}
                                onMouseLeave={() => setHoveredIndex(-1)}
                                onClick={() => onPlayTrack(index)}
                            >
                                <div className="flex items-center gap-2 w-full">
                                    <div className="relative w-10 h-10 flex-shrink-0">
                                        <img
                                            src={item.cover}
                                            alt={item.title}
                                            className="w-full h-full object-cover rounded"
                                        />
                                        {hoveredIndex === index && (
                                            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded">
                                                <PlayCircleOutlined style={{ color: 'white', fontSize: 20 }} />
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex-1 overflow-hidden">
                                        <div className="text-sm truncate">{item.title}</div>
                                        <div className="text-xs text-gray-400 truncate">{item.artist}</div>
                                    </div>

                                    <span className="text-xs text-gray-400 mr-2">
                                        {formatMillisecondsToTime2Player(item.duration)}
                                    </span>

                                    {hoveredIndex === index && (
                                        <Button
                                            type="text"
                                            size="small"
                                            icon={<DeleteOutlined />}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onRemoveTrack(item.id);
                                            }}
                                        />
                                    )}
                                </div>
                            </List.Item>
                        )}
                    />
                </div>
            )}
        </div>
    );

    return (
        <div className="flex items-center gap-2 pr-4">
            <Tooltip title={playModeConfig[playMode].label}>
                <button
                    onClick={onPlayModeChange}
                    className="p-2 rounded-full hover:bg-gray-100 transition"
                >
                    {playModeConfig[playMode].icon}
                </button>
            </Tooltip>

            <button
                onClick={toggleMute}
                className="p-2 rounded-full hover:bg-gray-100 transition"
            >
                {isMuted ? <SoundOutlined /> : <SoundFilled />}
            </button>

            <Slider
                value={volume}
                onChange={onVolumeChange}
                style={{ width: '96px' }}
                tooltip={{ formatter: (value) => `${value}%` }}
            />

            <Popover
                content={playlistContent}
                trigger="click"
                placement="topRight"
            >
                <button className="p-2 rounded-full hover:bg-gray-100 transition">
                    <OrderedListOutlined style={{ fontSize: 20 }} />
                </button>
            </Popover>
        </div>
    );
};

export default Right;
