import { LinkOutlined, SmileOutlined, } from '@ant-design/icons'
import { Bubble, Sender } from '@ant-design/x'
import { Button, Flex, Popover, Space, Avatar, Typography, message, Modal, theme } from 'antd'
import React, { useEffect, useRef, useState } from 'react'
import { CopyOutlined, DeleteOutlined, RedoOutlined, ShareAltOutlined } from '@ant-design/icons'
import { Actions, ActionsProps } from '@ant-design/x'
import { useParams } from 'react-router-dom'
import type { BubbleProps } from '@ant-design/x'
import { BubbleContentType } from '@ant-design/x/es/bubble/interface'
import EmojiPicker from 'emoji-picker-react'
import { useUserStore } from '@renderer/store/useUserStore'
import { getUserVoById } from '@renderer/api/userApis'
import { getGroupInfoWithMembers } from '@renderer/api/groupApis'
import { formatRelativeTime } from "../../utils/timeUtil"
import { sendMsg } from '@renderer/api/chatApis'
import { Snowflake } from '@renderer/utils/SnowflakeIdUtil'
const { Text } = Typography;
const actionItems: ActionsProps['items'] = [
  { key: 'retry', label: 'Retry', icon: <RedoOutlined /> },
  { key: 'copy', label: 'Copy', icon: <CopyOutlined /> },
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
            onOk() { message.success('Delete successfully') },
            onCancel() { message.info('Cancel') },
          })
        },
        danger: true,
      },
    ],
  },
  { key: 'clear', label: 'Clear', icon: <DeleteOutlined /> },
]

interface CustomBubbleProps extends Omit<BubbleProps, 'content'> {
  content?: BubbleContentType;
}

const ChatPage: React.FC = () => {
  const { sessionId } = useParams()
  const user = useUserStore((state) => state.user)
  const [value, setValue] = useState('')
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<CustomBubbleProps[]>([])

  const [friendInfo, setFriendInfo] = useState<any>(null)
  const [groupInfo, setGroupInfo] = useState<any>(null)
  const [members, setMembers] = useState<any[]>([])
  const [memberMap, setMemberMap] = useState<Map<number, string>>(new Map())
  const { token } = theme.useToken()
  const lastMessageTimeRef = useRef<number>(0);
  const getContactIdFromSession = (sessionId: string, myId: string): string => {
    if (sessionId.startsWith(myId)) return sessionId.slice(myId.length)
    if (sessionId.endsWith(myId)) return sessionId.slice(0, sessionId.length - myId.length)
    return ''
  }

  const fetchFriendInfoAndMessages = async () => {
    if (!sessionId || !user?.id) return
    const contactId = Number(getContactIdFromSession(sessionId, user.id.toString()))
    const userRes = await getUserVoById({ id: contactId })
    const resData = userRes.data as API.UserVO
    setFriendInfo(userRes.data)
    const result = await window.electron.ipcRenderer.invoke('get-message-list', sessionId)
    const messagesWithTime: CustomBubbleProps[] = []
    let lastTimestamp = 0

    for (const item of result) {
      const currentTimestamp = new Date(item.sendTime).getTime()
      if (lastTimestamp === 0 || currentTimestamp - lastTimestamp > 10 * 6 * 1000) {
        // 如果和上一条消息时间间隔超过10分钟，插入时间节点
        messagesWithTime.push({
          _key: `time-${item.id}`,
          role: 'time',
          content: formatRelativeTime(currentTimestamp),
        })
      }
      const sysMsgType = [24];
      if (sysMsgType.includes(item.messageType)) {
        // sys 角色的系统消息
        messagesWithTime.push({
          _key: item.id,
          role: 'sys',
          content: item.messageContent,
        })
      } else {
        messagesWithTime.push({
          _key: item.id,
          role: item.sendUserId === user?.id ? 'me' : 'friend',
          content: item.messageContent,
          avatar: item.sendUserId === user?.id
            ? { src: user?.userAvatar }
            : { src: resData.userAvatar },
        })
        lastTimestamp = currentTimestamp
      }
    }
    lastMessageTimeRef.current = result[result.length - 1].sendTime
    setMessages(messagesWithTime)
  }

  const fetchGroupInfoAndMessages = async () => {
    if (!sessionId || !user?.id) return
    const groupRes = await getGroupInfoWithMembers({ id: sessionId })
    const resData = groupRes.data as API.GroupVO
    setGroupInfo(resData)
    setMembers(resData.userVOList || [])
    const map = new Map<number, string>()
    resData.userVOList?.forEach((m: any) => map.set(m.id, m.userAvatar))
    setMemberMap(map)

    const result = await window.electron.ipcRenderer.invoke('get-message-list', sessionId)

    const messagesWithTime: CustomBubbleProps[] = []
    let lastTimestamp = 0

    for (const item of result) {
      const currentTimestamp = new Date(item.sendTime).getTime()
      if (lastTimestamp === 0 || currentTimestamp - lastTimestamp > 10 * 60 * 1000) {
        // 如果和上一条消息时间间隔超过10分钟，插入时间节点
        messagesWithTime.push({
          _key: `time-${item.id}`,
          role: 'time',
          content: formatRelativeTime(currentTimestamp),
        })
      }
      const sysMsgType = [3, 10, 11, 12, 13, 14, 15, 24];
      if (sysMsgType.includes(item.messageType)) {
        // sys 角色的系统消息
        messagesWithTime.push({
          _key: item.id,
          role: 'sys',
          content: item.messageContent,
        })
      } else {
        messagesWithTime.push({
          _key: item.id,
          role: item.sendUserId === user?.id ? 'me' : 'friend',
          content: item.messageContent,
          avatar: item.sendUserId === user?.id
            ? { src: user?.userAvatar }
            : { src: map.get(item.sendUserId) }
        })
        lastTimestamp = currentTimestamp
      }
    }
    lastMessageTimeRef.current = result[result.length - 1].sendTime
    setMessages(messagesWithTime)
  }


  useEffect(() => {
    if (!sessionId) return
    if (sessionId.startsWith('G')) {
      fetchGroupInfoAndMessages()
    } else {
      fetchFriendInfoAndMessages()
    }
  }, [sessionId])


  const sendMessage = async () => {
    if (!value.trim()) return;
    if (!sessionId || !user?.id) return;

    const id = Snowflake.nextId();
    let res: any;
    const now = Date.now(); // 当前时间戳

    if (sessionId.startsWith('G')) {
      res = await sendMsg({ messageId: id, messageContent: value, contactId: sessionId, messageType: 20 });
    } else {
      const contactId = getContactIdFromSession(sessionId, user.id.toString());
      res = await sendMsg({ messageId: id, messageContent: value, contactId, messageType: 20 });
    }

    if (res.code === 0) {
      window.electron.ipcRenderer.send('user-send-message', res.data);
      const newMessages: CustomBubbleProps[] = [];
      // 判断是否要插入时间节点（比如间隔超过 5 分钟 = 300000 ms）
      if (now - lastMessageTimeRef.current > 5 * 60 * 1000) {
        newMessages.push({
          _key: `time-${now}`,
          role: 'time',
          content: formatRelativeTime(now),
          style: { margin: '0 auto' }
        });
      }
      // 添加实际消息
      newMessages.push({
        _key: Date.now(),
        role: 'me',
        avatar: { src: user?.userAvatar },
        content: value,
      });

      setMessages(prev => [...prev, ...newMessages]);
      setValue('');
      lastMessageTimeRef.current = now;
    }
  };


  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '95vh', width: '100%' }}>
      <Space style={{ padding: '0 16px', marginBottom: 8 }}>
        {sessionId?.startsWith('G') ? (
          <Text strong style={{ flex: 1, fontSize: 20 }} >
            {groupInfo?.groupName}
            <Text type="secondary" style={{ fontSize: 16 }}>（{members.length}）</Text>
          </Text>
        ) : (
          <Flex align="center" gap={8}>
            <Avatar src={friendInfo?.userAvatar} />
            <Text strong style={{ fontSize: 18 }}>{friendInfo?.userName}</Text>
          </Flex>
        )}
        <Actions items={actionItems} onClick={({ keyPath }) => message.success(`You clicked ${keyPath.join(',')}`)} />
      </Space>

      <Flex vertical gap="small" style={{ flex: 1, overflowY: 'auto' }}>
        <Bubble.List
          autoScroll
          className="scrollableDiv"
          roles={{
            me: { placement: 'end', style: { maxWidth: '100%' } },
            friend: { placement: 'start', style: { maxWidth: '100%' } },
            time: {
              style: { margin: '0 auto', },
              styles: {
                content: {
                  fontSize: 12,
                  color: "#a5a4a4ff",
                  height: 10,
                  minHeight: 10,
                  lineHeight: 0,
                  marginBottom: -4,
                },
              },
            },
            sys: {
              style: { margin: '0 auto', },
              variant: 'shadow',
              styles: {
                content: {
                  fontSize: 11,
                  color: "#666666",
                  height: 10,
                  minHeight: 10,
                  lineHeight: 0,
                  border: `1px solid ${token.colorBorder}`,
                  marginBottom: -6,
                },
              },
            }
          }}
          items={messages}
          style={{ padding: 16, paddingTop: 10, paddingInline: 18, borderRadius: 8 }}
        />
      </Flex>

      <div style={{ paddingTop: 12, position: 'sticky', paddingRight: 8, paddingLeft: 8, bottom: 6 }}>
        <Sender
          prefix={
            <div style={{ position: 'relative', marginRight: 18 }}>
              <Button
                style={{ position: 'absolute', top: -30, right: -22, zIndex: 1 }}
                type="text"
                icon={<LinkOutlined style={{ fontSize: 18, color: '#666' }} />}
                onClick={() => setOpen(!open)}
              />
              <Popover
                content={<EmojiPicker onEmojiClick={emoji => setValue(prev => prev + emoji.emoji)} searchDisabled skinTonesDisabled height={400} width={300} />}
                trigger="click"
              >
                <Button
                  style={{ position: 'absolute', top: -68, right: -22, zIndex: 1 }}
                  type="text"
                  icon={<SmileOutlined style={{ fontSize: 18, color: '#d48806' }} />}
                />
              </Popover>
            </div>
          }
          value={value}
          onChange={(v) => setValue(v)}
          onSubmit={sendMessage}
          autoSize={{ minRows: 3, maxRows: 3 }}
        />
      </div>
    </div>
  )
}

export default ChatPage
