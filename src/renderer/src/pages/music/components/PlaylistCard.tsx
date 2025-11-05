import React from 'react';
import { Card, Avatar } from 'antd';
import { addImageParams } from '../../../utils/timeUtil';

interface Playlist {
  playlistId: number;
  title: string;
  coverUrl: string;
  creator?: {
    nickname: string;
    avatarUrl: string;
  };
}

interface PlaylistCardProps {
  playlist: Playlist;
  onClick: (id: number) => void;
}

export const PlaylistCard: React.FC<PlaylistCardProps> = ({ playlist, onClick }) => {
  return (
    <Card
      hoverable
      cover={
        <img
          alt={playlist.title}
          src={addImageParams(playlist.coverUrl, 'param=330y330')}
          className="aspect-square object-cover"
        />
      }
      onClick={() => onClick(playlist.playlistId)}
    >
      <Card.Meta
        title={<div className="line-clamp-1 text-sm">{playlist.title}</div>}
        description={
          playlist.creator && (
            <div className="flex items-center gap-2">
              <Avatar size="small" src={playlist.creator.avatarUrl} />
              <span className="text-xs truncate">{playlist.creator.nickname}</span>
            </div>
          )
        }
      />
    </Card>
  );
};
