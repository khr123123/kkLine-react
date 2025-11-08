// components/PlayerBar/Left.tsx
import React from 'react';
import { TikTokOutlined } from '@ant-design/icons';
import { Track } from '@renderer/store/usePlayerStore';
interface LeftProps {
  currentTrack: Track;
  onShowDrawer: () => void;
}

const Left: React.FC<LeftProps> = ({ currentTrack, onShowDrawer }) => {
  return (
    <div
      className="play-bar flex items-center gap-2 w-64 cursor-pointer select-none transition-colors rounded-lg p-2"
      onClick={onShowDrawer}
    >
      <div style={{
        minWidth: '48px',
        maxWidth: '48px',
        height: '48px',
        flexShrink: 0,
      }}>
        {currentTrack.cover ? <img
          src={currentTrack.cover}
          alt={currentTrack.title}
          className="w-full h-full object-cover rounded-lg"
        /> : <TikTokOutlined style={{ fontSize: 32 }} className="w-full h-full object-cover rounded-lg" />}
      </div>
      <div className="flex-1 overflow-hidden">
        <div
          className="text-sm font-medium truncate play-bar-text"
          title={currentTrack.title}
        >
          {currentTrack.title}
        </div>
        <div className="text-xs text-gray-500 truncate">
          {currentTrack.artist}
        </div>
      </div>
    </div>
  );
};

export default Left;
