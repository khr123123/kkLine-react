import React, { useState } from 'react';
import { Input, Button, Avatar, message } from 'antd';
import { DeleteOutlined, LikeOutlined } from '@ant-design/icons';
import { formatNumber } from '../../../utils/timeUtil';

const { TextArea } = Input;

interface Comment {
  commentId: number;
  username: string;
  userAvatar: string;
  content: string;
  createTime: string;
  likeCount: number;
}

interface CommentSectionProps {
  comments: Comment[];
  currentUsername: string;
  isLoggedIn: boolean;
  onAddComment: (content: string) => Promise<void>;
  onLikeComment: (commentId: number) => Promise<void>;
  onDeleteComment: (commentId: number) => Promise<void>;
}

export const CommentSection: React.FC<CommentSectionProps> = ({
  comments = [], // ✅ 默认空数组
  currentUsername,
  isLoggedIn,
  onAddComment,
  onLikeComment,
  onDeleteComment,
}) => {
  const [content, setContent] = useState('');

  const handleSubmit = async () => {
    if (!isLoggedIn) {
      message.warning('请先登录');
      return;
    }

    if (!content.trim()) {
      message.warning('请输入评论内容');
      return;
    }

    await onAddComment(content.trim());
    setContent('');
  };

  return (
    <div className="space-y-4">
      {/* 评论输入框 */}
      <div className="mb-6">
        <TextArea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="说点什么吧"
          maxLength={180}
          rows={3}
          showCount
        />
        <div className="mt-2 flex justify-end">
          <Button
            type="primary"
            onClick={handleSubmit}
            disabled={!content.trim()}
          >
            发布
          </Button>
        </div>
      </div>

      {/* 评论列表 */}
      <h3 className="font-bold mb-4">
        最新评论（{formatNumber(comments.length)}）
      </h3>

      {comments.length > 0 ? (
        <div className="space-y-4">
          {comments.map((comment) => (
            <div key={comment.commentId} className="flex gap-3 p-4 hover:bg-gray-50 rounded">
              <Avatar src={comment.userAvatar} size={40} />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-blue-500">{comment.username}</span>
                </div>
                <p className="text-sm mb-2">{comment.content}</p>
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span className="text-xs">{comment.createTime}</span>
                  <div className="flex gap-4">
                    {comment.username === currentUsername && (
                      <Button
                        type="text"
                        size="small"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => onDeleteComment(comment.commentId)}
                      >
                        删除
                      </Button>
                    )}
                    <Button
                      type="text"
                      size="small"
                      icon={<LikeOutlined />}
                      onClick={() => onLikeComment(comment.commentId)}
                    >
                      {formatNumber(comment.likeCount)}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <p>暂无评论，快来抢沙发吧~</p>
        </div>
      )}
    </div>
  );
};
