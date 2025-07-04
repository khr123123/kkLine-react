import { LinkOutlined, SmileOutlined, UserOutlined } from '@ant-design/icons'
import { Attachments, Bubble, Sender } from '@ant-design/x'
import { Button, Flex, Popover, Space } from 'antd'
import React, { useState } from 'react'
import { CopyOutlined, DeleteOutlined, RedoOutlined, ShareAltOutlined } from '@ant-design/icons';
import { Actions, ActionsProps } from '@ant-design/x';
import { Modal, message, Typography } from 'antd';
import { useParams } from 'react-router-dom'
import type { BubbleProps, } from "@ant-design/x"
import { BubbleContentType } from '@ant-design/x/es/bubble/interface'
import EmojiPicker from 'emoji-picker-react';
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


// 自定义 BubbleProps 类型，允许 content 为 ReactNode
interface CustomBubbleProps extends Omit<BubbleProps, 'content'> {
  content?: BubbleContentType;
}
const ChatPage: React.FC = () => {
  const [messages, setMessages] = useState<CustomBubbleProps[]>([
    { _key: 1, role: 'friend', content: '你好呀！' },
    { _key: 2, role: 'me', content: '你好，有什么事吗？' },
    { _key: 3, role: 'friend', content: '我在做一个新项目，想请教你一些问题。' },
    { _key: 4, role: 'me', content: '好啊，是什么方面的？' },
    { _key: 5, role: 'friend', content: '关于 React 状态管理这块，我有点不太清楚。' },
    { _key: 6, role: 'me', content: '你是用 Redux 还是 MobX，还是其他的库？' },
    { _key: 7, role: 'friend', content: '我用的是 Redux Toolkit，但感觉写起来还是有点繁琐。' },
    { _key: 8, role: 'me', content: '其实可以结合 RTK Query，省掉很多异步处理的麻烦。' },
    { _key: 9, role: 'friend', content: '原来如此，我还没用过 RTK Query，你能推荐点资料吗？' },
    { _key: 10, role: 'me', content: '可以去看官方文档，还有一些 YouTube 视频也讲得不错。' },
    { _key: 11, role: 'friend', content: '好的，我这就去看看，谢谢你！' },
    { _key: 12, role: 'me', content: '不客气，有问题随时问我。' },
    { _key: 13, role: 'friend', content: '下次请你吃饭哈！' },
    { _key: 14, role: 'me', content: '哈哈，好啊，记得请客哦～' },
    { _key: 15, role: 'friend', loading: true },
    {
      _key: 16, role: 'me', content: [
        {
          _key: '1',
          name: 'excel-file.xlsx',
          size: 111111,
          description: 'Checking the data',
        },
      ], messageRender: (items) => (
        <Flex vertical gap="middle">
          {(items as unknown as any[]).map((item) => (
            <Attachments.FileCard key={item.uid} item={item} />
          ))}
        </Flex>
      ),
      variant: "borderless"
    },
    {
      _key: 17, role: 'friend', content: [
        {
          uid: '10',
          name: 'image-file.png',
          thumbUrl: 'https://zos.alipayobjects.com/rmsportal/jkjgkEfvpUPVyRjUImniVslZfWPnJuuZ.png',
          url: 'https://zos.alipayobjects.com/rmsportal/jkjgkEfvpUPVyRjUImniVslZfWPnJuuZ.png',
          size: 123456,
        },
      ], messageRender: (items) => (
        <Flex vertical gap="middle">
          {(items as unknown as any[]).map((item) => (
            <Attachments.FileCard key={item.uid} item={item} />
          ))}
        </Flex>
      ),
      variant: "borderless"
    },
    {
      _key: 18, role: 'me', content: [
        {
          uid: '1',
          name: 'excel-file.xlsx',
          size: 111111,
        },
        {
          uid: '2',
          name: 'word-file.docx',
          size: 222222,
        },
        {
          uid: '3',
          name: 'image-file.png',
          size: 333333,
        },
        {
          uid: '4',
          name: 'pdf-file.pdf',
          size: 444444,
        },
        {
          uid: '5',
          name: 'ppt-file.pptx',
          size: 555555,
        },
        {
          uid: '6',
          name: 'video-file.mp4',
          size: 666666,
        },
        {
          uid: '7',
          name: 'audio-file.mp3',
          size: 777777,
        },
        {
          uid: '8',
          name: 'zip-file.zip',
          size: 888888,
        },
        {
          uid: '9',
          name: 'markdown-file.md',
          size: 999999,
          description: 'Custom description here',
        },

      ], messageRender: (items) => (
        <Flex vertical gap="middle" >
          {(items as unknown as any[]).map((item) => (
            <Attachments.FileCard key={item.uid} item={item} />
          ))}
        </Flex>
      ),
      variant: "borderless"
    }

  ])
  const { sessionId } = useParams()
  const sendMessage = () => {
    if (!value.trim()) return;
    const newMsg: CustomBubbleProps = {
      _key: Date.now(),
      role: 'me',
      content: value,
    };
    setMessages((prev) => [...prev, newMsg]);
  };


  const roles = {
    me: {
      placement: 'end' as const,
      avatar: { icon: <UserOutlined />, style: { background: 'red' } },
      style: { maxWidth: '100%' }

    },
    friend: {
      placement: 'start' as const,
      avatar: { icon: <UserOutlined />, style: { background: '#d9d9d9' } },
      style: { maxWidth: '100%' }

    }
  }
  const onClick: ActionsProps['onClick'] = ({ keyPath }) => {
    message.success(`you clicked ${keyPath.join(',')}`);
  };
  const [value, setValue] = useState<string>('');
  const [open, setOpen] = React.useState(false);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '95vh', width: '100%', }}>
      <Space style={{ padding: '0 16px', marginBottom: 8 }}>
        <Typography.Text strong style={{ fontSize: 18 }}>{sessionId}</Typography.Text>
        <Actions items={actionItems} onClick={onClick} />
      </Space>
      <Flex vertical gap="small" style={{ flex: 1, overflowY: 'auto' }}>
        <Bubble.List
          autoScroll
          className="scrollableDiv"
          roles={roles}
          items={messages}
          style={{
            padding: 16,
            paddingTop: 10,
            paddingInline: 18,
            borderRadius: 8,
          }}
        />
      </Flex>
      <div style={{
        paddingTop: 12, position: 'sticky', paddingRight: 8, paddingLeft: 8,
        bottom: 6,
      }}>
        <Sender
          prefix={
            <div style={{
              position: 'relative',
              marginRight: 18,
            }}>

              <Button
                style={{
                  position: 'absolute',
                  top: -30,
                  right: -22,
                  zIndex: 1
                }}
                type="text"
                icon={<LinkOutlined style={{ fontSize: 18, color: '#666' }} />}
                onClick={() => setOpen(!open)}
              />
              <Popover content={<EmojiPicker onEmojiClick={(emoji) => {
                setValue((prev) => prev + emoji.emoji);//注意这里可能闭包，要prev这种写法总拿最新值
              }} searchDisabled={true} skinTonesDisabled={true} height={400} width={300} />} trigger="click">
                <Button
                  style={{
                    position: 'absolute',
                    top: -68,
                    right: -22,
                    zIndex: 1,
                  }}
                  type="text"
                  icon={<SmileOutlined style={{ fontSize: 18, color: '#d48806' }} />}
                />
              </Popover>
            </div>

          }
          value={value}
          onChange={(v) => {
            setValue(v);
          }}
          onSubmit={() => {
            sendMessage();
            message.info('Send message!');
            setValue('');
          }}
          autoSize={{ minRows: 3, maxRows: 3 }}
        />
      </div>
    </div>
  )
}

export default ChatPage
