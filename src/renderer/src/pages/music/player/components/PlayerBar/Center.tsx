// components/PlayerBar/Center.tsx
import React from 'react';
import { Slider } from 'antd';
import {
  PlayCircleFilled,
  PauseCircleFilled,
  StepBackwardOutlined,
  StepForwardOutlined,
  HeartOutlined,
  HeartFilled,
} from '@ant-design/icons';
import { formatTime2Player } from '../../../../../utils/timeUtil';

interface CenterProps {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  currentLikeStatus: number;
  onTogglePlay: () => void;
  onPrev: () => void;
  onNext: () => void;
  onSeek: (value: number) => void;
  onToggleLike: () => void;
}

const Center: React.FC<CenterProps> = ({
  isPlaying,
  currentTime,
  duration,
  currentLikeStatus,
  onTogglePlay,
  onPrev,
  onNext,
  onSeek,
  onToggleLike,
}) => {
  return (
    <div className="flex-1 flex items-center px-4">
      <div className="flex items-center gap-2 mr-4">
        <button
          onClick={onPrev}
          className="p-2 rounded-full hover:bg-gray-100 transition"
        >
          <StepBackwardOutlined style={{ fontSize: 18 }} />
        </button>
        
        <button
          onClick={onTogglePlay}
          className="p-1 rounded-full hover:bg-gray-100 transition"
        >
          {isPlaying ? (
            <PauseCircleFilled style={{ fontSize: 48, color: '#1890ff' }} />
          ) : (
            <PlayCircleFilled style={{ fontSize: 48, color: '#1890ff' }} />
          )}
        </button>
        
        <button
          onClick={onNext}
          className="p-2 rounded-full hover:bg-gray-100 transition"
        >
          <StepForwardOutlined style={{ fontSize: 18 }} />
        </button>
        
        <button
          onClick={onToggleLike}
          className="p-2 rounded-full hover:bg-gray-100 transition"
        >
          {currentLikeStatus === 1 ? (
            <HeartFilled style={{ fontSize: 18, color: '#ff4d4f' }} />
          ) : (
            <HeartOutlined style={{ fontSize: 18 }} />
          )}
        </button>
      </div>
      
      <div className="flex-1 flex items-center gap-2">
        <span className="text-xs text-gray-500 w-12 text-right">
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
        <span className="text-xs text-gray-500 w-12">
          {formatTime2Player(duration)}
        </span>
      </div>
    </div>
  );
};

export default Center;
