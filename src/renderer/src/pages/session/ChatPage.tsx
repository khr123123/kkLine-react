import {
  CloseCircleOutlined,
  DownloadOutlined,
  ExclamationCircleFilled,
  IdcardOutlined,
  LinkOutlined,
  RollbackOutlined,
  RotateLeftOutlined,
  RotateRightOutlined,
  ShareAltOutlined,
  SmileOutlined,
  SolutionOutlined,
  SwapOutlined,
  UndoOutlined,
  ZoomInOutlined,
  ZoomOutOutlined
} from '@ant-design/icons'
import type { BubbleProps } from '@ant-design/x'
import { Actions, ActionsProps, Attachments, Bubble, Prompts, Sender } from '@ant-design/x'
import { BubbleContentType } from '@ant-design/x/es/bubble/interface'
import { deleteMsg, revokeMsg, sendMsg, sendTypingState } from '@renderer/api/chatApis'
import { shareContact } from '@renderer/api/contactApis'
import { getGroupInfoWithMembers } from '@renderer/api/groupApis'
import { getUserVoById } from '@renderer/api/userApis'
import AntMembersGrid from '@renderer/components/AntMembersGrid'
import FilePreviewModal from '@renderer/components/FilePreviewModal'
import ShareInfoCard from '@renderer/components/ShareInfoCard'
import ShareModal from '@renderer/components/ShareModel'
import { useUserStore } from '@renderer/store/useUserStore'
import { Snowflake } from '@renderer/utils/SnowflakeIdUtil'
import {
  Avatar,
  Button,
  Divider,
  Drawer,
  Flex,
  message,
  Popconfirm,
  Popover,
  Progress,
  Space,
  Tag,
  theme,
  Typography,
  Upload
} from 'antd'
import Title from 'antd/es/typography/Title'
import type { RcFile, UploadFile } from 'antd/es/upload/interface'
import Paragraph from 'antd/lib/typography/Paragraph'
import dayjs from 'dayjs'
import EmojiPicker from 'emoji-picker-react'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { formatRelativeTime } from '../../utils/timeUtil'

let globalUploadId: any
const { Text } = Typography

interface CustomBubbleProps extends Omit<BubbleProps, 'content'> {
  content?: BubbleContentType
}
const ChatPage: React.FC = () => {
  const { sessionId } = useParams()
  const isGroup = sessionId?.startsWith('G')
  const user = useUserStore((state) => state.user)
  const [value, setValue] = useState('')
  const [messages, setMessages] = useState<CustomBubbleProps[]>([])

  const [friendInfo, setFriendInfo] = useState<any>(null)
  const [groupInfo, setGroupInfo] = useState<any>(null)
  const [members, setMembers] = useState<any[]>([])
  const [memberMap, setMemberMap] = useState<Map<number, { name: string; avatar: string }>>(
    new Map()
  )
  const { token } = theme.useToken()
  const lastMessageTimeRef = useRef<number>(0)
  const [shareVisible, setShareVisible] = useState<boolean>(false)

  const actionItems: ActionsProps['items'] = isGroup
    ? [
      {
        key: 'share',
        icon: <ShareAltOutlined title="分享群组" />,
        onItemClick: () => setShareVisible(true)
      },
      {
        key: 'groupInfo',
        icon: <SolutionOutlined title="群组详情" />,
        onItemClick: () => setGroupInfoDrawerVisible(true)
      }
    ]
    : [
      {
        key: 'share',
        icon: <ShareAltOutlined title="分享好友" />,
        onItemClick: () => setShareVisible(true)
      },

      {
        key: 'groupInfo',
        icon: <IdcardOutlined title="好友信息" />,
        onItemClick: () => setFriendInfoDrawerVisible(true)
      }
    ]
  const [friendInfoDrawerVisible, setFriendInfoDrawerVisible] = useState(false)
  const [groupInfoDrawerVisible, setGroupInfoDrawerVisible] = useState(false)

  const friendInfoDrawer = () => {
    if (!friendInfo) return null
    return (
      <Drawer
        title="用户详情"
        onClose={() => setFriendInfoDrawerVisible(false)}
        open={friendInfoDrawerVisible}
        width={200}
        maskStyle={{ backgroundColor: 'rgba(0, 0, 0, 0.1)' }}
      >
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Space align="center" size="large" style={{ width: '100%' }}>
            <Avatar size={64} src={friendInfo.userAvatar} alt="头像" style={{ borderRadius: 8 }} />
            <Space direction="vertical" size={4} style={{ flex: 1 }}>
              <Text strong style={{ fontSize: 18 }}>
                {friendInfo.userName}
              </Text>
              <Text type="secondary">ID: {friendInfo.id}</Text>
            </Space>
          </Space>
          <Divider size="small" style={{ margin: 0 }} />
          <Space direction="vertical" size={12} style={{ width: '100%' }}>
            <Text>
              <Text strong>账号：</Text>
              {friendInfo.userAccount || '-'}
            </Text>
            <Text>
              <Text strong>性别：</Text>
              {friendInfo.userSex === 0 ? '女' : '男'}
            </Text>
            <Text>
              <Text strong>邮箱：</Text>
              {friendInfo.userEmail || '-'}
            </Text>
            <Text>
              <Text strong>地区：</Text>
              {friendInfo.areaName || '-'}
            </Text>
            <Text>
              <Text strong>区号：</Text>
              {friendInfo.areaCode || '-'}
            </Text>
          </Space>
          <Divider size="small" style={{ margin: 0 }} />
          <div>
            <Text strong>个人简介：</Text>
            <div style={{ marginTop: 6, whiteSpace: 'pre-wrap', color: '#666', minHeight: 40 }}>
              {friendInfo.userProfile || '无简介'}
            </div>
          </div>
        </Space>
      </Drawer>
    )
  }
  const groupInfoDrawer = () => {
    if (!groupInfo || !members) return null
    return (
      <Drawer
        title="群组详情"
        onClose={() => setGroupInfoDrawerVisible(false)}
        open={groupInfoDrawerVisible}
        width={310}
        maskStyle={{ backgroundColor: 'rgba(0, 0, 0, 0.1)' }}
      >
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Space align="center" size="large" style={{ width: '100%' }}>
            <Avatar size={64} src={groupInfo.groupAvatar} alt="头像" style={{ borderRadius: 8 }} />
            <Space direction="vertical" size={4} style={{ flex: 1 }}>
              <Flex vertical justify="center">
                <Space size="small" align="center">
                  <Title level={4} style={{ margin: 0 }}>
                    {groupInfo.groupName}
                  </Title>
                  {groupInfo.joinType === 0 ? (
                    <Tag color="green">直接加入</Tag>
                  ) : (
                    <Tag color="orange">管理员同意</Tag>
                  )}
                </Space>
                <Text type="secondary" style={{ fontSize: 14 }}>
                  ID: {groupInfo.id}
                  <br />
                  创建时间：{dayjs(groupInfo.createTime).format('YYYY年MM月DD日')}
                </Text>
              </Flex>
            </Space>
          </Space>
          <Divider size="small" style={{ margin: 0 }} />
          <div style={{ marginBottom: 16 }}>
            <Text strong>群成员（{members.length}人）</Text>
            <div style={{ height: 18 }}></div>
            <AntMembersGrid
              members={members.map((item) => {
                if (item.id === groupInfo.groupOwner) item.isOwner = true
                return item
              })}
            />
          </div>
          <Divider size="small" style={{ margin: 0 }} />
          <div>
            {groupInfo.groupNotice && (
              <>
                <Text strong>群公告</Text>
                <Paragraph
                  style={{ marginTop: 8 }}
                  ellipsis={{ rows: 2, expandable: true, symbol: '更多' }}
                >
                  {groupInfo.groupNotice}
                </Paragraph>
              </>
            )}
          </div>
        </Space>
      </Drawer>
    )
  }
  const getContactIdFromSession = (sessionId: string, myId: string): string => {
    if (sessionId.startsWith(myId)) return sessionId.slice(myId.length)
    if (sessionId.endsWith(myId)) return sessionId.slice(0, sessionId.length - myId.length)
    return ''
  }
  const fetchFriendInfoAndMessages = async () => {
    if (!sessionId || !user?.id) return
    const contactId = getContactIdFromSession(sessionId, user.id.toString())
    const userRes = await getUserVoById({ id: contactId as unknown as number })
    const resData = userRes.data as API.UserVO
    setFriendInfo(userRes.data)
    const result = await window.electron.ipcRenderer.invoke('get-message-list', sessionId)
    const messagesWithTime: CustomBubbleProps[] = []
    let lastTimestamp = 0
    let lastTimeNodeContent: string = ''
    for (const item of result) {
      const currentTimestamp = new Date(item.sendTime).getTime()
      if (lastTimestamp === 0 || currentTimestamp - lastTimestamp > 10 * 60 * 1000) {
        if (lastTimeNodeContent !== formatRelativeTime(currentTimestamp)) {
          lastTimeNodeContent = formatRelativeTime(currentTimestamp)
          messagesWithTime.push({
            _key: `time-${item.id}`,
            role: 'time',
            content: lastTimeNodeContent
          })
        }
      }
      const sysMsgType = [1, 24]
      const shareMsgType = [50]
      if (sysMsgType.includes(item.messageType)) {
        messagesWithTime.push({
          _key: item.id,
          role: 'sys',
          content: item.messageContent
        })
      } else if (shareMsgType.includes(item.messageType)) {
        messagesWithTime.push({
          _key: item.id,
          role: 'share',
          content: { ...JSON.parse(item.messageContent) },
          placement: item.sendUserId === user?.id ? 'end' : 'start',
          avatar: item.sendUserId === user?.id ? { src: user?.userAvatar } : { src: resData.userAvatar },
        })
      } else {
        // 判断是否是文件消息（根据 fileUrl 判断）
        const isFile = !!item.fileUrl
        const content = isFile
          ? {
            uid: item.id,
            name: item.fileName,
            size: Number(item.fileSize) || 0,
            url: item.fileUrl
          }
          : {
            uid: item.id,
            txt: item.messageContent
          }
        messagesWithTime.push({
          _key: item.id,
          role: isFile
            ? item.sendUserId === user?.id
              ? 'meFile'
              : 'friendFile'
            : item.sendUserId === user?.id
              ? 'me'
              : 'friend',
          content,
          avatar:
            item.sendUserId === user?.id ? { src: user?.userAvatar } : { src: resData.userAvatar }
        })
        lastTimestamp = currentTimestamp
      }
    }
    if (result.length > 0) {
      lastMessageTimeRef.current = result[result.length - 1].sendTime
    }
    setMessages(messagesWithTime)
  }

  const fetchGroupInfoAndMessages = async () => {
    if (!sessionId || !user?.id) return
    let resData: any
    //ID和 名称与头像映射
    let memberMap = new Map<number, { name: string; avatar: string }>()
    const groupRes = (await getGroupInfoWithMembers({ id: sessionId })) as API.BaseResponseGroupVO
    const result = await window.electron.ipcRenderer.invoke('get-message-list', sessionId)
    if (groupRes.code === 0) {
      resData = groupRes.data as API.GroupVO
      setGroupInfo(resData)
      setMembers(resData?.userVOList || [])
      resData?.userVOList?.forEach((m: any) => {
        memberMap.set(m.id, { name: m.userName, avatar: m.userAvatar })
      })
      setMemberMap(memberMap)
    } else {
      setGroupInfo({ groupName: result[0].contactId })
    }
    const messagesWithTime: CustomBubbleProps[] = []
    let lastTimestamp = 0
    let lastTimeNodeContent: string = ''
    for (const item of result) {
      const currentTimestamp = new Date(item.sendTime).getTime()
      if (lastTimestamp === 0 || currentTimestamp - lastTimestamp > 10 * 60 * 1000) {
        // 如果和上一条消息时间间隔超过10分钟，插入时间节点
        if (lastTimeNodeContent !== formatRelativeTime(currentTimestamp)) {
          lastTimeNodeContent = formatRelativeTime(currentTimestamp)
          messagesWithTime.push({
            _key: `time-${item.id}`,
            role: 'time',
            content: lastTimeNodeContent
          })
        }
      }
      const sysMsgType = [3, 10, 11, 12, 13, 14, 15, 24]
      const shareMsgType = [50]
      if (sysMsgType.includes(item.messageType)) {
        // sys 角色的系统消息
        messagesWithTime.push({
          _key: item.id,
          role: 'sys',
          content: item.messageContent
        })
      } else if (shareMsgType.includes(item.messageType)) {
        messagesWithTime.push({
          _key: item.id,
          role: 'share',
          content: { ...JSON.parse(item.messageContent) },
          placement: item.sendUserId === user?.id ? 'end' : 'start',
          avatar: item.sendUserId === user?.id
            ? { src: user?.userAvatar }
            : { src: memberMap.get(item.sendUserId)?.avatar },
          header: <span style={{ fontSize: '13px', color: '#888' }}>{item.sendUserName}</span>
        })
      } else {
        // 判断是否是文件消息（根据 fileUrl 判断）
        const isFile = !!item.fileUrl
        const content = isFile
          ? {
            uid: item.id,
            name: item.fileName,
            size: Number(item.fileSize) || 0,
            url: item.fileUrl
          }
          : {
            uid: item.id,
            txt: item.messageContent
          }
        messagesWithTime.push({
          _key: item.id,
          role: isFile
            ? item.sendUserId === user?.id
              ? 'meFile'
              : 'friendFile'
            : item.sendUserId === user?.id
              ? 'me'
              : 'friend',
          content,
          avatar:
            item.sendUserId === user?.id
              ? { src: user?.userAvatar }
              : { src: memberMap.get(item.sendUserId)?.avatar },
          header: <span style={{ fontSize: '13px', color: '#888' }}>{item.sendUserName}</span>
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
  const beforeUpload = (file: RcFile) => {
    const isLt10MB = file.size / 1024 / 1024 < 10
    if (!isLt10MB) {
      message.error('文件必须小于 10MB！')
      return false
    }
    if (!sessionId || !user?.id) {
      message.error('系统错误，请重新登录..')
      return false
    }
    // 这里你可以拿 fileInfo.uid, fileInfo.name, fileInfo.size 等属性
    globalUploadId = Snowflake.nextId()
    if (!sessionId || !user?.id) return
    const now = Date.now()
    // 构造消息内容
    const content = {
      uid: globalUploadId,
      name: file.name,
      size: Number(file.size) || 0,
      status: 'uploading',
      percent: 0
    }
    const contactId = sessionId.startsWith('G')
      ? sessionId
      : getContactIdFromSession(sessionId, user.id.toString())
    // 本地消息对象
    const newMessages: CustomBubbleProps[] = []
    // 判断是否要插入时间节点（比如间隔超过 1 分钟 ）
    if (now - lastMessageTimeRef.current > 1 * 60 * 1000) {
      newMessages.push({
        _key: `time-${now}`,
        role: 'time',
        content: formatRelativeTime(now),
        style: { margin: '0 auto' }
      })
    }
    newMessages.push({
      _key: globalUploadId,
      role: 'meFile',
      avatar: { src: user?.userAvatar },
      content,
      variant: 'borderless',
      header: isGroup && <span style={{ fontSize: '13px', color: '#888' }}>{user.userName}</span>
    })
    const newMsg = {
      id: globalUploadId,
      sessionId,
      messageType: 21,
      messageContent: `[${file.type}]`,
      sendUserId: user.id,
      sendUserName: user.userName,
      sendTime: now,
      contactId,
      fileUrl: '',
      fileSize: Number(file.size) || 0,
      fileName: file.name,
      fileType: file.type,
      sendStatus: 0
    }
    setMessages((prev) => [...prev, ...newMessages])
    window.electron.ipcRenderer.send('user-send-file-message', newMsg)
    return true
  }

  const getUploadData = (file: UploadFile) => {
    let bizType: 'picture' | 'file' | 'video' = 'file'
    if (file.type?.startsWith('image/')) bizType = 'picture'
    if (file.type?.startsWith('video/')) bizType = 'video'
    const contactId = isGroup
      ? sessionId
      : getContactIdFromSession(sessionId!, user!.id!.toString())
    return {
      messageId: globalUploadId,
      biz: bizType,
      contactId: contactId
    }
  }
  const sendMessage = async () => {
    if (!value.trim()) return
    if (!sessionId || !user?.id) return
    const id = Snowflake.nextId()
    let res: any
    const now = Date.now() // 当前时间戳
    if (sessionId.startsWith('G')) {
      res = await sendMsg({
        messageId: id,
        messageContent: value,
        contactId: sessionId,
        messageType: 20
      })
    } else {
      const contactId = getContactIdFromSession(sessionId, user.id.toString())
      res = await sendMsg({ messageId: id, messageContent: value, contactId, messageType: 20 })
    }
    if (res.code === 0) {
      window.electron.ipcRenderer.send('user-send-message', res.data)
      const newMessages: CustomBubbleProps[] = []
      // 判断是否要插入时间节点（比如间隔超过 1 分钟 ）
      if (now - lastMessageTimeRef.current > 1 * 60 * 1000) {
        newMessages.push({
          _key: `time-${now}`,
          role: 'time',
          content: formatRelativeTime(now),
          style: { margin: '0 auto' }
        })
      }
      // 添加实际消息
      newMessages.push({
        _key: id,
        role: 'me',
        avatar: { src: user?.userAvatar },
        content: {
          uid: id,
          txt: value
        },
        header: isGroup && <span style={{ fontSize: '13px', color: '#888' }}>{user.userName}</span>
      })
      setMessages((prev) => [...prev, ...newMessages])
      setValue('')
      lastMessageTimeRef.current = now
    }
    if (res.code === 40101) {
      const errorMsg = res.message
      message.error(errorMsg)
      setMessages((prev) => [
        ...prev,
        {
          _key: Date.now(),
          role: 'me',
          content: [
            {
              key: Date.now(),
              icon: (
                <ExclamationCircleFilled
                  style={{ color: '#ee0909ff', fontSize: '20px' }}
                  onClick={() => message.error(errorMsg)}
                />
              ),
              description: value
            }
          ],
          avatar: { src: user?.userAvatar },
          variant: 'borderless',
          messageRender: (items) => <Prompts vertical items={items as any} />
        }
      ])
      setValue('')
    }
  }
  useEffect(() => {
    const msgReciveListener = (_event: any, msgInfo: any) => {
      if (msgInfo.sessionId !== sessionId) return
      const currentTimestamp = new Date(msgInfo.sendTime).getTime()
      const timeDiff = currentTimestamp - lastMessageTimeRef.current
      const newMessages: CustomBubbleProps[] = []
      // 超过10分钟插入时间节点
      if (timeDiff > 10 * 60 * 1000) {
        newMessages.push({
          _key: `time-${msgInfo.id}`,
          role: 'time',
          content: formatRelativeTime(currentTimestamp),
          style: { margin: '0 auto' }
        })
      }

      const sysMsgType = [3, 10, 11, 12, 13, 14, 15, 24]
      const shareMsgType = [50]
      if (sysMsgType.includes(msgInfo.messageType)) {
        newMessages.push({
          _key: msgInfo.id,
          role: 'sys',
          content: msgInfo.messageContent
        })
      } else if (shareMsgType.includes(msgInfo.messageType)) {
        newMessages.push({
          _key: msgInfo.id,
          role: 'share',
          content: { ...JSON.parse(msgInfo.messageContent) },
          placement: msgInfo.sendUserId === user?.id ? 'end' : 'start',
          avatar: {
            src: msgInfo.sendUserId === user?.id ? user?.userAvatar : isGroup ? memberMap.get(msgInfo.sendUserId)?.avatar : friendInfo?.userAvatar
          },
          header: isGroup && (
            <span style={{ fontSize: '13px', color: '#888' }}>{msgInfo.sendUserName}</span>
          )
        })
      } else {
        if (msgInfo.messageType === 21) {
          newMessages.push({
            _key: msgInfo.id,
            role: 'friendFile',
            content: {
              uid: msgInfo.id,
              name: msgInfo.fileName,
              size: Number(msgInfo.fileSize),
              status: 'uploading',
              percent: 0
            },
            avatar: {
              src: isGroup ? memberMap.get(msgInfo.sendUserId)?.avatar : friendInfo?.userAvatar
            },
            header: isGroup && (
              <span style={{ fontSize: '13px', color: '#888' }}>{msgInfo.sendUserName}</span>
            )
          })
        } else {
          newMessages.push({
            _key: msgInfo.id,
            role: 'friend',
            content: {
              uid: msgInfo.id,
              txt: msgInfo.messageContent
            },
            avatar: {
              src: isGroup ? memberMap.get(msgInfo.sendUserId)?.avatar : friendInfo?.userAvatar
            },
            header: isGroup && (
              <span style={{ fontSize: '13px', color: '#888' }}>{msgInfo.sendUserName}</span>
            )
          })
        }
      }

      lastMessageTimeRef.current = currentTimestamp
      setMessages((prev) => [...prev, ...newMessages])
    }

    window.electron.ipcRenderer.on('receive-message', msgReciveListener)

    return () => {
      window.electron.ipcRenderer.removeAllListeners('receive-message')
    }
  }, [sessionId, user?.id, friendInfo, memberMap])

  useEffect(() => {
    const handler = (
      _event: any,
      messageId: string,
      data: { percent: number; status: string; fileUrl?: string }
    ) => {
      setMessages((prev) => {
        return prev.map((msg) => {
          if (msg._key === messageId && typeof msg.content === 'object') {
            const updatedContent = {
              ...msg.content,
              percent: data.percent,
              status: data.status,
              url: data.fileUrl
            }
            return { ...msg, content: updatedContent }
          }
          return msg
        })
      })
    }
    window.electron.ipcRenderer.on('file-msg-progress', handler)
    return () => {
      window.electron.ipcRenderer.removeAllListeners('file-msg-progress')
    }
  }, [])

  const [filePreview, setFilePreview] = useState({
    open: false,
    fileUrl: '',
    fileName: ''
  })

  useEffect(() => {
    const handleTyping = (_event: any, currentSessionId: string, isTyping: boolean) => {
      if (sessionId !== currentSessionId || isGroup) return
      setMessages((prev) => {
        const filtered = prev.filter((msg) => msg.id !== 'typing')
        if (isTyping) {
          return [
            ...filtered,
            {
              id: 'typing',
              placement: 'start',
              loading: true,
              avatar: { src: friendInfo?.userAvatar }
            }
          ]
        } else {
          return filtered
        }
      })
    }
    window.electron.ipcRenderer.on('typing', handleTyping)
    return () => {
      window.electron.ipcRenderer.removeAllListeners('typing')
    }
  }, [sessionId, friendInfo])

  const safeMessages = useMemo(() => {
    const normal = messages.filter((msg) => msg.id !== 'typing')
    const typing = messages.filter((msg) => msg.id === 'typing')
    return [...normal, ...typing]
  }, [messages])

  // 撤回消息
  const handleRevokeMessage = async (messageId: string) => {
    if (!sessionId || !sessionId) return
    const res = (await revokeMsg({ messageId, sessionId })) as unknown as API.BaseResponseBoolean
    if (res.code === 0) {
      message.success('消息撤回成功!')
      window.electron.ipcRenderer.send('user-revoke-message', messageId, sessionId)
      setMessages((prevMessages) => {
        const target = prevMessages.find((m) => m._key === messageId)
        if (!target) return prevMessages
        const updated = {
          ...target,
          role: 'sys',
          content: user?.userName + ' 撤回了一条消息',
          avatar: undefined
        }
        const filtered = prevMessages.filter((m) => m._key !== messageId)
        return [...filtered, updated]
      })
    } else {
      message.error(res.message)
    }
  }

  useEffect(() => {
    window.electron.ipcRenderer.on('somebody-revoke-msg', (_, data) => {
      const { messageId, messageContent } = data
      setMessages((prevMessages) => {
        const target = prevMessages.find((m) => m._key === messageId)
        if (!target) return prevMessages
        const updated = {
          ...target,
          role: 'sys',
          content: messageContent,
          avatar: undefined,
          header: undefined
        }
        const filtered = prevMessages.filter((m) => m._key !== messageId)
        return [...filtered, updated] // 放到最后一个
      })
    })
    return () => {
      window.electron.ipcRenderer.removeAllListeners('somebody-revoke-msg')
    }
  }, [])

  // 删除消息
  const handleDeleteMessage = async (messageId: string) => {
    if (!sessionId || !sessionId) return
    const res = (await deleteMsg({ messageId, sessionId })) as unknown as API.BaseResponseBoolean
    if (res.code === 0) {
      message.success('消息删除成功!')
      window.electron.ipcRenderer.send('user-delete-message', messageId)
      setMessages((prevMessages) => prevMessages.filter((m) => m._key !== messageId))
    } else {
      message.error(res.message)
    }
  }
  //图片下载
  const onDownload = (url: string) => {
    const suffix = url.slice(url.lastIndexOf('.'))
    const filename = Date.now() + suffix
    fetch(url)
      .then((response) => response.blob())
      .then((blob) => {
        const blobUrl = URL.createObjectURL(new Blob([blob]))
        const link = document.createElement('a')
        link.href = blobUrl
        link.download = filename
        document.body.appendChild(link)
        link.click()
        URL.revokeObjectURL(blobUrl)
        link.remove()
      })
  }
  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', height: '95vh', width: '100%' }}>
        <Space style={{ padding: '0 16px', marginBottom: 8 }}>
          {isGroup ? (
            <Flex align="center" gap={8}>
              <Avatar src={groupInfo?.groupAvatar} />
              <Text strong style={{ flex: 1, fontSize: 20 }}>
                {groupInfo?.groupName}
                <Text type="secondary" style={{ fontSize: 16 }}>
                  （{members.length}）
                </Text>
              </Text>
            </Flex>
          ) : (
            <Flex align="center" gap={8}>
              <Avatar src={friendInfo?.userAvatar} />
              <Text strong style={{ fontSize: 18 }}>
                {friendInfo?.userName}
              </Text>
            </Flex>
          )}
          <Actions items={actionItems} />
        </Space>

        <Flex vertical gap="small" style={{ flex: 1, overflowY: 'auto' }}>
          <Bubble.List
            autoScroll
            className="scrollableDiv"
            roles={{
              me: {
                placement: 'end',
                style: { maxWidth: '100%' },
                messageRender: (content) => <div>{content.txt}</div>,
                footer: (content: BubbleContentType) => {
                  return (
                    <Flex style={{ marginTop: -10 }}>
                      <Button type="text" size="small" title="复制">
                        <Text
                          copyable={{ text: (content as { txt: string }).txt, tooltips: false }}
                        />
                      </Button>
                      <Popconfirm
                        placement="rightBottom"
                        title={`即将撤回消息 [${(content as { txt: string }).txt}]`}
                        description="确认撤回吗？"
                        onConfirm={() => handleRevokeMessage((content as { uid: string }).uid)}
                        okText="确认"
                        cancelText="取消"
                      >
                        <Button
                          type="text"
                          size="small"
                          icon={<RollbackOutlined style={{ color: 'gray' }} />}
                          title="撤回"
                        />
                      </Popconfirm>
                      <Popconfirm
                        placement="rightBottom"
                        title={`即将删除消息 [${(content as { txt: string }).txt}]`}
                        description="删除后不存在与本地记录"
                        onConfirm={() => handleDeleteMessage((content as { uid: string }).uid)}
                        okText="确认"
                        cancelText="取消"
                      >
                        <Button
                          type="text"
                          size="small"
                          icon={<CloseCircleOutlined style={{ color: 'gray' }} />}
                          title="删除"
                        />
                      </Popconfirm>
                    </Flex>
                  )
                }
              },
              meFile: {
                placement: 'end',
                style: { maxWidth: '100%' },
                variant: 'borderless',
                messageRender: (item) => (
                  <Flex style={{ position: 'relative', display: 'inline-block' }}>
                    <div
                      style={{
                        cursor: item.url ? 'pointer' : 'default'
                      }}
                      onClick={() => {
                        item.url && !/\.(png|jpe?g|gif|bmp|webp|svg)$/i.test(item.name)
                          ? setFilePreview({ open: true, fileUrl: item.url, fileName: item.name })
                          : void 0
                      }}
                    >
                      <Attachments.FileCard
                        key={item.uid}
                        item={item}
                        imageProps={{
                          preview: {
                            toolbarRender: (
                              _,
                              {
                                transform: { scale },
                                actions: {
                                  onFlipY,
                                  onFlipX,
                                  onRotateLeft,
                                  onRotateRight,
                                  onZoomOut,
                                  onZoomIn,
                                  onReset
                                }
                              }
                            ) => (
                              <Space size={18} style={{ fontSize: 24 }} className="toolbar-wrapper">
                                <DownloadOutlined onClick={() => onDownload(item.url)} />
                                <SwapOutlined rotate={90} onClick={onFlipY} />
                                <SwapOutlined onClick={onFlipX} />
                                <RotateLeftOutlined onClick={onRotateLeft} />
                                <RotateRightOutlined onClick={onRotateRight} />
                                <ZoomOutOutlined disabled={scale === 1} onClick={onZoomOut} />
                                <ZoomInOutlined disabled={scale === 50} onClick={onZoomIn} />
                                <UndoOutlined onClick={onReset} />
                              </Space>
                            )
                          }
                        }}
                      />
                      {item.percent > 0 && item.percent < 100 && (
                        <Progress
                          type="circle"
                          percent={item.percent}
                          size={28}
                          style={{
                            position: 'absolute',
                            top: '70%',
                            right: 10,
                            transform: 'translateY(-50%)',
                            borderRadius: '50%',
                            boxShadow: '0 0 4px rgba(0,0,0,0.15)'
                          }}
                        />
                      )}
                    </div>
                  </Flex>
                ),
                footer: (content: BubbleContentType) => {
                  return (
                    <Flex style={{ marginTop: -10 }}>
                      <Button type="text" size="small" title="复制文件地址">
                        <Text
                          copyable={{ text: (content as { url: string }).url, tooltips: false }}
                        />
                      </Button>
                      <Popconfirm
                        placement="rightBottom"
                        title={`即将撤回文件 [${(content as { name: string }).name}]`}
                        description="确认撤回吗？"
                        onConfirm={() => handleRevokeMessage((content as { uid: string }).uid)}
                        okText="确认"
                        cancelText="取消"
                      >
                        <Button
                          type="text"
                          size="small"
                          icon={<RollbackOutlined style={{ color: 'gray' }} />}
                          title="撤回"
                        />
                      </Popconfirm>
                      <Popconfirm
                        placement="rightBottom"
                        title={`即将删除文件 [${(content as { name: string }).name}]`}
                        description="删除后不存在与本地记录"
                        onConfirm={() => handleDeleteMessage((content as { uid: string }).uid)}
                        okText="确认"
                        cancelText="取消"
                      >
                        <Button
                          type="text"
                          size="small"
                          icon={<CloseCircleOutlined style={{ color: 'gray' }} />}
                          title="删除"
                        />
                      </Popconfirm>
                    </Flex>
                  )
                }
              },
              friend: {
                placement: 'start',
                style: { maxWidth: '100%' },
                messageRender: (content) => <div>{content.txt}</div>
              },
              friendFile: {
                placement: 'start',
                style: { maxWidth: '100%' },
                variant: 'borderless',
                messageRender: (item) => (
                  <Flex style={{ position: 'relative', display: 'inline-block' }}>
                    <div
                      style={{
                        cursor: item.url ? 'pointer' : 'default'
                      }}
                      onClick={() => {
                        item.url && !/\.(png|jpe?g|gif|bmp|webp|svg)$/i.test(item.name)
                          ? setFilePreview({ open: true, fileUrl: item.url, fileName: item.name })
                          : void 0
                      }}
                    >
                      <Attachments.FileCard
                        key={item.uid}
                        item={item}
                        imageProps={{
                          preview: {
                            toolbarRender: (
                              _,
                              {
                                transform: { scale },
                                actions: {
                                  onFlipY,
                                  onFlipX,
                                  onRotateLeft,
                                  onRotateRight,
                                  onZoomOut,
                                  onZoomIn,
                                  onReset
                                }
                              }
                            ) => (
                              <Space size={18} style={{ fontSize: 24 }} className="toolbar-wrapper">
                                <DownloadOutlined onClick={() => onDownload(item.url)} />
                                <SwapOutlined rotate={90} onClick={onFlipY} />
                                <SwapOutlined onClick={onFlipX} />
                                <RotateLeftOutlined onClick={onRotateLeft} />
                                <RotateRightOutlined onClick={onRotateRight} />
                                <ZoomOutOutlined disabled={scale === 1} onClick={onZoomOut} />
                                <ZoomInOutlined disabled={scale === 50} onClick={onZoomIn} />
                                <UndoOutlined onClick={onReset} />
                              </Space>
                            )
                          }
                        }}
                      />
                      {item.percent > 0 && item.percent < 100 && (
                        <Progress
                          type="circle"
                          percent={item.percent}
                          size={28}
                          style={{
                            position: 'absolute',
                            top: '70%',
                            right: 10,
                            transform: 'translateY(-50%)',
                            borderRadius: '50%',
                            boxShadow: '0 0 4px rgba(0,0,0,0.15)'
                          }}
                        />
                      )}
                    </div>
                  </Flex>
                )
              },
              time: {
                style: { margin: '0 auto' },
                styles: {
                  content: {
                    fontSize: 12,
                    color: '#a5a4a4ff',
                    height: 10,
                    minHeight: 10,
                    lineHeight: 0,
                    marginBottom: -4
                  }
                }
              },
              sys: {
                style: { margin: '0 auto' },
                variant: 'shadow',
                styles: {
                  content: {
                    fontSize: 11,
                    color: '#666666',
                    height: 10,
                    minHeight: 10,
                    lineHeight: 0,
                    border: `1px solid ${token.colorBorder}`,
                    marginBottom: -6
                  }
                }
              },
              share: {
                style: { maxWidth: '100%' },
                variant: 'borderless',
                messageRender: (content) => {
                  return <ShareInfoCard item={content} />
                }
              }
            }}
            items={safeMessages}
            style={{ padding: 16, paddingTop: 10, paddingInline: 18, borderRadius: 8 }}
          />
        </Flex>

        <div
          style={{ paddingTop: 12, position: 'sticky', paddingRight: 8, paddingLeft: 8, bottom: 6 }}
        >
          <Sender
            prefix={
              <div style={{ position: 'relative', marginRight: 18 }}>
                <Upload
                  name="file"
                  className="avatar-uploader"
                  showUploadList={false}
                  action="http://127.0.0.1:8080/api/chat/sendFileMessageWhitProgress"
                  headers={{ Authorization: user?.token! }}
                  beforeUpload={beforeUpload}
                  data={getUploadData}
                >
                  <Button
                    style={{ position: 'absolute', top: -10, right: -22, zIndex: 1 }}
                    type="text"
                    icon={<LinkOutlined style={{ fontSize: 18, color: '#666' }} />}
                  />
                </Upload>
                <Popover
                  content={
                    <EmojiPicker
                      onEmojiClick={(emoji) => setValue((prev) => prev + emoji.emoji)}
                      searchDisabled
                      skinTonesDisabled
                      height={400}
                      width={300}
                    />
                  }
                  trigger="click"
                >
                  <Button
                    style={{ position: 'absolute', top: -45, right: -22, zIndex: 1 }}
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
            onFocus={async () => {
              if (isGroup) return
              await sendTypingState({
                contactId: getContactIdFromSession(sessionId!, user!.id!.toString()),
                typing: true
              })
            }} // 聚焦事件 正在输入..
            onBlur={async () => {
              if (isGroup) return
              await sendTypingState({
                contactId: getContactIdFromSession(sessionId!, user!.id!.toString()),
                typing: false
              })
              // 失焦事件 输入结束..
            }}
          />
        </div>
      </div>
      <FilePreviewModal
        open={filePreview.open}
        onClose={() => setFilePreview({ open: false, fileUrl: '', fileName: '' })}
        fileUrl={filePreview.fileUrl}
        fileName={filePreview.fileName}
      />
      {friendInfoDrawer()}
      {groupInfoDrawer()}
      {<ShareModal
        visible={shareVisible}
        onClose={() => setShareVisible(false)}
        targetInfo={isGroup ? groupInfo : friendInfo}
        onShare={async (selectedIds) => {
          const res = await shareContact({ contactId: isGroup ? groupInfo.id : friendInfo.id, shareIds: selectedIds }) as unknown as API.BaseResponseBoolean
          if (res.code === 0) {
            message.success('分享成功')
          } else {
            message.error("分享失败," + res.message)
          }
        }}
      />}
    </>
  )
}

export default ChatPage
