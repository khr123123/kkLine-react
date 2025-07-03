import { UserOutlined } from '@ant-design/icons'
import { Bubble } from '@ant-design/x'
import { Button, Flex, Input, Space } from 'antd'
import React, { useRef, useState } from 'react'
import type { GetRef } from 'antd'
import { CopyOutlined, DeleteOutlined, RedoOutlined, ShareAltOutlined } from '@ant-design/icons';
import { Actions, ActionsProps } from '@ant-design/x';
import { Modal, message, Typography } from 'antd';

type ChatRole = 'me' | 'friend'

interface ChatMessage {
  key: number
  role: ChatRole
  content: string
}

const actionItems: ActionsProps['items'] = [
  {
    key: 'retry',
    label: 'Retry',
    icon: <RedoOutlined />,
  },
  {
    key: 'copy',
    label: 'Copy',
    icon: <CopyOutlined />,
  },
  {
    key: 'more',
    children: [
      {
        key: 'share',
        label: 'Share',
        icon: <ShareAltOutlined />,
        children: [
          { key: 'qq', label: 'QQ' },
          { key: 'wechat', label: 'WeChat' },
        ],
      },
      { key: 'import', label: 'Import' },
      {
        key: 'delete',
        label: 'Delete',
        icon: <DeleteOutlined />,
        onItemClick: () => {
          Modal.confirm({
            title: 'Are you sure want to delete?',
            content: 'Some descriptions',
            onOk() {
              message.success('Delete successfully');
            },
            onCancel() {
              message.info('Cancel');
            },
          });
        },
        danger: true,
      },
    ],
  },
  {
    key: 'clear',
    label: 'Clear',
    icon: <DeleteOutlined />,
  },
];


const ChatPage: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { key: 1, role: 'friend', content: '你好呀！' },
    { key: 2, role: 'me', content: '你好，有什么事吗？' }
  ])
  const [input, setInput] = useState('')
  const listRef = useRef<GetRef<typeof Bubble.List>>(null)

  const sendMessage = () => {
    if (!input.trim()) return;
    const newMsg: ChatMessage = {
      key: Date.now(),
      role: 'me',
      content: input,
    };
    setMessages((prev) => [...prev, newMsg]);
    setInput('');
    setTimeout(() => {
      listRef.current?.scrollTo({ key: newMsg.key });
    }, 100);
  };

  const roles = {
    me: {
      placement: 'end' as const,
      avatar: { icon: <UserOutlined />, style: { background: '#87d068' } },
      style: { maxWidth: 500 }
    },
    friend: {
      placement: 'start' as const,
      avatar: { icon: <UserOutlined />, style: { background: '#d9d9d9' } },
      style: { maxWidth: 500 }
    }
  }
  const onClick: ActionsProps['onClick'] = ({ keyPath }) => {
    // Logic for handling click events
    message.success(`you clicked ${keyPath.join(',')}`);
  };
  return (
    <>
      <Space style={{ padding: '0 16px', marginBottom: 8 }}>
        <Typography.Text strong style={{ fontSize: 18 }}>{"asdasdasd"}</Typography.Text>
        <Actions items={actionItems} onClick={onClick} />
      </Space>
      <Flex vertical gap="small" style={{ height: '100%', maxHeight: 500 }}>
        <Bubble.List
          ref={listRef}
          roles={roles}
          items={messages}
          style={{
            padding: 16,
            paddingTop: 10,
            paddingInline: 18,
            flex: 1,
            overflow: 'auto',
            borderRadius: 8
          }}
        />
        <Flex gap="small" style={{ marginTop: 8 }}>
          <Input.TextArea
            autoSize={{ minRows: 1, maxRows: 4 }}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="请输入消息..."
            onPressEnter={(e) => {
              if (!e.shiftKey) {
                e.preventDefault()
                sendMessage()
              }
            }}
          />
          <Button type="primary" onClick={sendMessage}>
            发送
          </Button>
        </Flex>
      </Flex>
    </>
  )
}

export default ChatPage
