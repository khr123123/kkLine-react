import React from 'react';
import { Table, Button } from 'antd';
import { PlayCircleOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { formatTime } from '../../../utils/timeUtil';

interface Song {
  songId: number;
  songName: string;
  artistName: string;
  album: string;
  duration: string;
  coverUrl: string;
  audioUrl: string;
  likeStatus: number;
}

interface SongTableProps {
  songs: Song[];
  loading?: boolean;
  pagination?: boolean | object;
  onPlay: (song: Song) => void;
}

export const SongTable: React.FC<SongTableProps> = ({
  songs = [], // ✅ 默认空数组，防止 undefined
  loading = false,
  pagination = false,
  onPlay,
}) => {
  const columns: ColumnsType<Song> = [
    {
      title: '封面',
      dataIndex: 'coverUrl',
      key: 'coverUrl',
      width: 80,
      render: (url: string) => (
        <img
          src={`${url}?param=90y90`}
          alt="cover"
          className="w-16 h-16 rounded-lg object-cover"
        />
      ),
    },
    {
      title: '歌曲',
      dataIndex: 'songName',
      key: 'songName',
      ellipsis: true,
    },
    {
      title: '歌手',
      dataIndex: 'artistName',
      key: 'artistName',
      ellipsis: true,
    },
    {
      title: '专辑',
      dataIndex: 'album',
      key: 'album',
      ellipsis: true,
    },
    {
      title: '时长',
      dataIndex: 'duration',
      key: 'duration',
      width: 100,
      render: (duration: string) => formatTime(parseFloat(duration) * 1000),
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: (_, record) => (
        <Button
          type="text"
          icon={<PlayCircleOutlined />}
          onClick={() => onPlay(record)}
        >
          播放
        </Button>
      ),
    },
  ];

  return (
    <Table
      columns={columns}
      dataSource={songs}
      rowKey="songId"
      loading={loading}
    />
  );
};
