// components/PlayerBar/Center.tsx
import React from 'react';
import {
  PlayCircleFilled,
  PauseCircleFilled,
  StepBackwardOutlined,
  StepForwardOutlined,
  HeartOutlined,
  HeartFilled,
} from '@ant-design/icons';

interface CenterProps {
  isPlaying: boolean;
  currentLikeStatus: number;
  onTogglePlay: () => void;
  onPrev: () => void;
  onNext: () => void;
  onToggleLike: () => void;
}

const Center: React.FC<CenterProps> = ({
  isPlaying,
  currentLikeStatus,
  onTogglePlay,
  onPrev,
  onNext,
  onToggleLike,
}) => {
  return (
    <div className="flex-1 flex items-center justify-center px-4">
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
    </div>
  );
};

export default Center;
