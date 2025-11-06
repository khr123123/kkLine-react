// components/PlayerBar/Left.tsx
import React from 'react';
import { Track } from '../../hooks/useAudioPlayer';

interface LeftProps {
  currentTrack: Track;
  onShowDrawer: () => void;
}

const Left: React.FC<LeftProps> = ({ currentTrack, onShowDrawer }) => {
  return (
    <div
      className="flex items-center gap-2 w-64 cursor-pointer select-none hover:bg-gray-100 transition-colors rounded-lg p-2"
      onClick={onShowDrawer}
    >
      <div style={{
        minWidth: '48px',
        maxWidth: '48px',
        height: '48px',
        flexShrink: 0,
      }}>
        <img
          src={currentTrack.cover || 'https://via.placeholder.com/48'}
          alt={currentTrack.title}
          className="w-full h-full object-cover rounded-lg"
        />
      </div>
      <div className="flex-1 overflow-hidden">
        <div
          className="text-sm font-medium text-gray-900 truncate"
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
