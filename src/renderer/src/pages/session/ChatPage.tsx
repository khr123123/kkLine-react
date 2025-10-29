import {
  AudioOutlined,
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
  VideoCameraAddOutlined,
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
  Card,
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
import VideoCallModal from './components/VideoCallPage'
import AudioCallModel from './components/AudioCallPage'

// 全局上传ID，用于追踪文件上传进度
let globalUploadId: any
const { Text } = Typography

/**
 * 自定义气泡消息属性接口
 * 扩展了Ant Design X的BubbleProps
 */
interface CustomBubbleProps extends Omit<BubbleProps, 'content'> {
  content?: BubbleContentType
}

/**
 * 聊天页面主组件
 * 支持单聊、群聊和广告消息展示
 */
const ChatPage: React.FC = () => {
  // ========== 路由参数和基础状态 ==========
  const { sessionId } = useParams() // 获取会话ID（从路由参数）
  const isGroup = sessionId?.startsWith('G') // 判断是否是群聊（G开头表示群组）
  const user = useUserStore((state) => state.user) // 获取当前登录用户信息
  const [value, setValue] = useState('') // 输入框内容
  const [messages, setMessages] = useState<CustomBubbleProps[]>([]) // 消息列表

  // ========== 联系人信息状态 ==========
  const [friendInfo, setFriendInfo] = useState<any>(null) // 好友信息
  const [groupInfo, setGroupInfo] = useState<any>(null) // 群组信息
  const [adInfo, setAdInfo] = useState<any>(null) // 广告信息
  const [members, setMembers] = useState<any[]>([]) // 群成员列表
  const [memberMap, setMemberMap] = useState<Map<number, { name: string; avatar: string }>>(
    new Map()
  ) // 群成员ID映射表（用于快速查找成员头像和昵称）

  // ========== 主题和引用 ==========
  const { token } = theme.useToken() // 获取Ant Design主题token
  const lastMessageTimeRef = useRef<number>(0) // 记录最后一条消息的时间（用于时间节点插入）
  const [shareVisible, setShareVisible] = useState<boolean>(false) // 分享弹窗显示状态
  
  // ========== 操作栏配置 ==========
  /**
   * 根据是否是群聊配置不同的操作按钮
   * 群聊：分享、群组详情
   * 单聊：分享、好友信息、视频通话、语音通话
   */
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
      },
      {
        key: 'videoCall',
        icon: <VideoCameraAddOutlined title="发起视频通话" />,
        onItemClick: () => window.electron.ipcRenderer.invoke('open-videoCall-window', {
          receiverId: isGroup
            ? sessionId!
            : getContactIdFromSession(sessionId!, user!.id!.toString()),
          data: {}
        })

      },
      {
        key: 'audioCall',
        icon: <AudioOutlined title="发起语音通话" />,
        onItemClick: () => window.electron.ipcRenderer.invoke('open-audidCall-window', {
          receiverId: isGroup
            ? sessionId!
            : getContactIdFromSession(sessionId!, user!.id!.toString()),
          data: {}
        })
      }
    ]

  // ========== 抽屉和弹窗状态 ==========
  const [friendInfoDrawerVisible, setFriendInfoDrawerVisible] = useState(false) // 好友信息抽屉
  const [groupInfoDrawerVisible, setGroupInfoDrawerVisible] = useState(false) // 群组信息抽屉

  /**
   * 好友信息抽屉组件
   * 展示好友的详细信息（头像、昵称、ID、性别、邮箱等）
   */
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
          {/* 头像和基本信息 */}
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

          {/* 详细信息 */}
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

          {/* 个人简介 */}
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

  /**
   * 群组信息抽屉组件
   * 展示群组的详细信息（群头像、群名称、成员列表、群公告等）
   */
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
          {/* 群头像和基本信息 */}
          <Space align="center" size="large" style={{ width: '100%' }}>
            <Avatar size={64} src={groupInfo.groupAvatar} alt="头像" style={{ borderRadius: 8 }} />
            <Space direction="vertical" size={4} style={{ flex: 1 }}>
              <Flex vertical justify="center">
                <Space size="small" align="center">
                  <Title level={4} style={{ margin: 0 }}>
                    {groupInfo.groupName}
                  </Title>
                  {/* 群加入方式标签 */}
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

          {/* 群成员列表 */}
          <div style={{ marginBottom: 16 }}>
            <Text strong>群成员（{members.length}人）</Text>
            <div style={{ height: 18 }}></div>
            <AntMembersGrid
              members={members.map((item) => {
                if (item.id === groupInfo.groupOwner) item.isOwner = true // 标记群主
                return item
              })}
            />
          </div>
          <Divider size="small" style={{ margin: 0 }} />

          {/* 群公告 */}
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

  /**
   * 从会话ID中提取联系人ID
   * 会话ID格式：用户ID1 + 用户ID2（按字典序拼接）
   * @param sessionId 会话ID
   * @param myId 当前用户ID
   * @returns 联系人ID
   */
  const getContactIdFromSession = (sessionId: string, myId: string): string => {
    if (sessionId.startsWith(myId)) return sessionId.slice(myId.length)
    if (sessionId.endsWith(myId)) return sessionId.slice(0, sessionId.length - myId.length)
    return ''
  }

  /**
   * 获取好友信息并加载历史消息
   * 用于单聊场景
   */
  const fetchFriendInfoAndMessages = async () => {
    if (!sessionId || !user?.id) return

    // 提取联系人ID并获取好友信息
    const contactId = getContactIdFromSession(sessionId, user.id.toString())
    const userRes = await getUserVoById({ id: contactId as unknown as number })
    const resData = userRes.data as API.UserVO
    setFriendInfo(userRes.data)

    // 从本地数据库获取消息列表
    const result = await window.electron.ipcRenderer.invoke('get-message-list', sessionId)
    const messagesWithTime: CustomBubbleProps[] = []
    let lastTimestamp = 0
    let lastTimeNodeContent: string = ''

    // 遍历消息，构建消息气泡列表
    for (const item of result) {
      const currentTimestamp = new Date(item.sendTime).getTime()

      // 如果距离上一条消息超过10分钟，插入时间节点
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

      const sysMsgType = [1, 24] // 系统消息类型
      const shareMsgType = [50] // 分享消息类型

      if (sysMsgType.includes(item.messageType)) {
        // 系统消息（如好友申请通过等）
        messagesWithTime.push({
          _key: item.id,
          role: 'sys',
          content: item.messageContent
        })
      } else if (shareMsgType.includes(item.messageType)) {
        // 分享消息（分享名片等）
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
              ? 'meFile' // 我发送的文件
              : 'friendFile' // 好友发送的文件
            : item.sendUserId === user?.id
              ? 'me' // 我发送的文本消息
              : 'friend', // 好友发送的文本消息
          content,
          avatar:
            item.sendUserId === user?.id ? { src: user?.userAvatar } : { src: resData.userAvatar }
        })
        lastTimestamp = currentTimestamp
      }
    }

    // 记录最后一条消息时间
    if (result.length > 0) {
      lastMessageTimeRef.current = result[result.length - 1].sendTime
    }
    setMessages(messagesWithTime)
  }

  /**
   * 获取群组信息并加载历史消息
   * 用于群聊场景
   */
  const fetchGroupInfoAndMessages = async () => {
    if (!sessionId || !user?.id) return
    let resData: any

    // ID和名称、头像映射表（用于快速查找群成员信息）
    let memberMap = new Map<number, { name: string; avatar: string }>()

    // 获取群组信息和成员列表
    const groupRes = (await getGroupInfoWithMembers({ id: sessionId })) as API.BaseResponseGroupVO
    const result = await window.electron.ipcRenderer.invoke('get-message-list', sessionId)

    if (groupRes.code === 0) {
      resData = groupRes.data as API.GroupVO
      setGroupInfo(resData)
      setMembers(resData?.userVOList || [])

      // 构建成员映射表
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

    // 遍历消息，构建消息气泡列表
    for (const item of result) {
      const currentTimestamp = new Date(item.sendTime).getTime()

      // 如果距离上一条消息超过10分钟，插入时间节点
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

      const sysMsgType = [3, 10, 11, 12, 13, 14, 15, 24] // 群系统消息类型
      const shareMsgType = [50] // 分享消息类型

      if (sysMsgType.includes(item.messageType)) {
        // 系统消息（如XXX加入群聊、XXX退出群聊等）
        messagesWithTime.push({
          _key: item.id,
          role: 'sys',
          content: item.messageContent
        })
      } else if (shareMsgType.includes(item.messageType)) {
        // 分享消息
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
        // 判断是否是文件消息
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

  /**
   * 获取广告消息
   * 用于广告会话场景
   */
  const fetchADMessages = async () => {
    if (!sessionId || !user?.id) return
    const result = await window.electron.ipcRenderer.invoke('get-message-list', sessionId)
    const messagesWithTime: CustomBubbleProps[] = []
    let lastTimestamp = 0
    let lastTimeNodeContent: string = ''

    for (const item of result) {
      const currentTimestamp = new Date(item.sendTime).getTime()

      // 如果距离上一条消息超过10分钟，插入时间节点
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

      messagesWithTime.push({
        _key: item.id,
        role: 'ad',
        content: item.messageContent,
      })
      lastTimestamp = currentTimestamp
    }

    // 解析广告分类信息
    const dto = JSON.parse(result[0].messageContent)
    setAdInfo({ name: dto.adCategory.name, iconUrl: dto.adCategory.iconUrl })
    lastMessageTimeRef.current = result[result.length - 1].sendTime
    setMessages(messagesWithTime)
  }

  /**
   * 初始化加载：根据会话类型加载对应的消息和信息
   */
  useEffect(() => {
    if (!sessionId) return
    if (sessionId.startsWith('G')) {
      fetchGroupInfoAndMessages() // 群聊
    } else if (sessionId.startsWith('AD')) {
      fetchADMessages() // 广告
    } else {
      fetchFriendInfoAndMessages() // 单聊
    }
  }, [sessionId])

  /**
   * 文件上传前的验证和处理
   * @param file 上传的文件
   * @returns 是否继续上传
   */
  const beforeUpload = (file: RcFile) => {
    // 验证文件大小（不超过10MB）
    const isLt10MB = file.size / 1024 / 1024 < 10
    if (!isLt10MB) {
      message.error('文件必须小于 10MB！')
      return false
    }
    if (!sessionId || !user?.id) {
      message.error('系统错误，请重新登录..')
      return false
    }

    // 生成全局唯一上传ID
    globalUploadId = Snowflake.nextId()
    if (!sessionId || !user?.id) return
    const now = Date.now()

    // 构造消息内容（带上传进度）
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

    const newMessages: CustomBubbleProps[] = []

    // 判断是否要插入时间节点（比如间隔超过1分钟）
    if (now - lastMessageTimeRef.current > 1 * 60 * 1000) {
      newMessages.push({
        _key: `time-${now}`,
        role: 'time',
        content: formatRelativeTime(now),
        style: { margin: '0 auto' }
      })
    }

    // 添加文件上传消息气泡
    newMessages.push({
      _key: globalUploadId,
      role: 'meFile',
      avatar: { src: user?.userAvatar },
      content,
      variant: 'borderless',
      header: isGroup && <span style={{ fontSize: '13px', color: '#888' }}>{user.userName}</span>
    })

    // 构造消息对象（待发送到服务器）
    const newMsg = {
      id: globalUploadId,
      sessionId,
      messageType: 21, // 文件消息类型
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

    // 立即显示上传中的消息
    setMessages((prev) => [...prev, ...newMessages])

    // 通知主进程发送文件消息
    window.electron.ipcRenderer.send('user-send-file-message', newMsg)
    return true
  }

  /**
   * 获取文件上传的额外数据
   * @param file 上传的文件
   * @returns 上传参数
   */
  const getUploadData = (file: UploadFile) => {
    // 根据文件类型判断业务类型
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

  /**
   * 发送文本消息
   */
  const sendMessage = async () => {
    if (!value.trim()) return // 空消息不发送
    if (!sessionId || !user?.id) return

    const id = Snowflake.nextId() // 生成消息ID
    let res: any
    const now = Date.now() // 当前时间戳

    // 根据会话类型发送消息
    if (sessionId.startsWith('G')) {
      // 群聊消息
      res = await sendMsg({
        messageId: id,
        messageContent: value,
        contactId: sessionId,
        messageType: 20 // 群文本消息
      })
    } else {
      // 单聊消息
      const contactId = getContactIdFromSession(sessionId, user.id.toString())
      res = await sendMsg({ messageId: id, messageContent: value, contactId, messageType: 20 })
    }

    if (res.code === 0) {
      // 消息发送成功
      window.electron.ipcRenderer.send('user-send-message', res.data)
      const newMessages: CustomBubbleProps[] = []

      // 判断是否要插入时间节点（比如间隔超过1分钟）
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
      setValue('') // 清空输入框
      lastMessageTimeRef.current = now
    }

    // 错误处理
    if (res.code === 50001) {
      const errorMsg = res.message
      message.error(errorMsg + ",您以不在该群被，或被拉黑!")
    }
    if (res.code === 40101) {
      const errorMsg = res.message
      message.error(errorMsg)
      // 显示发送失败的消息（带感叹号图标）
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

  /**
   * 监听接收到的新消息
   * 当收到新消息时，实时更新消息列表
   */
  useEffect(() => {
    const msgReciveListener = (_event: any, msgInfo: any) => {
      // 只处理当前会话的消息
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
      const adMsgType = [41]

      // 修复Bug：有人加入群聊时，刷新群成员列表
      if (msgInfo.messageType === 12) {
        fetchGroupInfoAndMessages()
      }

      // 根据消息类型构建不同的消息气泡
      if (sysMsgType.includes(msgInfo.messageType)) {
        // 系统消息
        newMessages.push({
          _key: msgInfo.id,
          role: 'sys',
          content: msgInfo.messageContent
        })
      } else if (adMsgType.includes(msgInfo.messageType)) {
        // 广告消息
        newMessages.push({
          _key: msgInfo.id,
          role: 'ad',
          content: msgInfo.messageContent,
        })
      } else if (shareMsgType.includes(msgInfo.messageType)) {
        // 分享消息
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
        // 普通消息或文件消息
        if (msgInfo.messageType === 21) {
          // 文件消息
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
          // 文本消息
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

  /**
   * 监听文件上传进度
   * 实时更新文件消息的上传进度
   */
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

  // 文件预览弹窗状态
  const [filePreview, setFilePreview] = useState({
    open: false,
    fileUrl: '',
    fileName: ''
  })

  /**
   * 监听"正在输入"状态
   * 只在单聊时显示对方正在输入的提示
   */
  useEffect(() => {
    const handleTyping = (_event: any, currentSessionId: string, isTyping: boolean) => {
      if (sessionId !== currentSessionId || isGroup) return // 群聊不显示正在输入

      setMessages((prev) => {
        const filtered = prev.filter((msg) => msg.id !== 'typing')
        if (isTyping) {
          // 添加正在输入的加载气泡
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
          // 移除正在输入的加载气泡
          return filtered
        }
      })
    }
    window.electron.ipcRenderer.on('typing', handleTyping)
    return () => {
      window.electron.ipcRenderer.removeAllListeners('typing')
    }
  }, [sessionId, friendInfo])

  /**
   * 安全的消息列表
   * 确保"正在输入"气泡始终显示在最后
   */
  const safeMessages = useMemo(() => {
    const normal = messages.filter((msg) => msg.id !== 'typing')
    const typing = messages.filter((msg) => msg.id === 'typing')
    return [...normal, ...typing]
  }, [messages])

  /**
   * 撤回消息
   * @param messageId 消息ID
   */
  const handleRevokeMessage = async (messageId: string) => {
    if (!sessionId || !sessionId) return
    const res = (await revokeMsg({ messageId, sessionId })) as unknown as API.BaseResponseBoolean
    if (res.code === 0) {
      message.success('消息撤回成功!')
      window.electron.ipcRenderer.send('user-revoke-message', messageId, sessionId)
      // 将消息替换为系统提示消息
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

  /**
   * 监听别人撤回消息的事件
   */
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

  /**
   * 删除消息
   * @param messageId 消息ID
   */
  const handleDeleteMessage = async (messageId: string) => {
    if (!sessionId || !sessionId) return
    const res = (await deleteMsg({ messageId, sessionId })) as unknown as API.BaseResponseBoolean
    if (res.code === 0) {
      message.success('消息删除成功!')
      window.electron.ipcRenderer.send('user-delete-message', messageId)
      // 从消息列表中移除
      setMessages((prevMessages) => prevMessages.filter((m) => m._key !== messageId))
    } else {
      message.error(res.message)
    }
  }

  /**
   * 下载图片
   * @param url 图片URL
   */
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

  // ========== 通话相关状态 ==========
  const [videoCallVisible, setVideoCallVisible] = useState(false); // 视频通话弹窗
  const [audioCallVisible, setAudioCallVisible] = useState(false); // 语音通话弹窗

  /**
   * 发起视频通话（预留功能）
   */
  const handleVideoCall = () => {
    setVideoCallVisible(true)
  };

  // ========== 主渲染 ==========
  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', height: '95vh', width: '100%' }}>
        {/* 聊天头部：显示联系人/群组信息和操作按钮 */}
        {sessionId?.startsWith("AD") ?
          // 广告会话头部
          <Space style={{ padding: '0 16px', marginBottom: 8 }}>
            <Avatar src={adInfo?.iconUrl} shape='square' />
            <Text strong style={{ flex: 1, fontSize: 20 }}>
              {adInfo?.name}
            </Text>
          </Space> :
          // 普通会话头部
          <Space style={{ padding: '0 16px', marginBottom: 8 }}>
            {isGroup ? (
              // 群聊头部
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
              // 单聊头部
              <Flex align="center" gap={8}>
                <Avatar src={friendInfo?.userAvatar} />
                <Text strong style={{ fontSize: 18 }}>
                  {friendInfo?.userName}
                </Text>
              </Flex>
            )}
            <Actions items={actionItems} />
          </Space>
        }

        {/* 消息列表区域 */}
        <Flex vertical gap="small" style={{ flex: 1, overflowY: 'auto' }}>
          <Bubble.List
            autoScroll
            className="scrollableDiv"
            roles={{
              // 我发送的文本消息样式
              me: {
                placement: 'end',
                style: { maxWidth: '100%' },
                messageRender: (content) => <div>{content.txt}</div>,
                footer: (content: BubbleContentType) => {
                  return (
                    <Flex style={{ marginTop: -10 }}>
                      {/* 复制按钮 */}
                      <Text
                        copyable={{ text: (content as { txt: string }).txt, tooltips: false }}
                      />
                      {/* 撤回按钮 */}
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
                      {/* 删除按钮 */}
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
              // 我发送的文件消息样式
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
                        // 非图片文件打开预览弹窗
                        item.url && !/\.(png|jpe?g|gif|bmp|webp|svg)$/i.test(item.name)
                          ? setFilePreview({ open: true, fileUrl: item.url, fileName: item.name })
                          : void 0
                      }}
                    >
                      {/* 文件卡片组件 */}
                      <Attachments.FileCard
                        key={item.uid}
                        item={item}
                        imageProps={{
                          preview: {
                            // 图片预览工具栏
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
                      {/* 上传进度环 */}
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
              // 好友发送的文本消息样式
              friend: {
                placement: 'start',
                style: { maxWidth: '100%' },
                messageRender: (content) => <div>{content.txt}</div>
              },
              // 好友发送的文件消息样式
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
              // 时间节点样式
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
              // 系统消息样式
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
              // 分享消息样式
              share: {
                style: { maxWidth: '100%' },
                variant: 'borderless',
                messageRender: (content) => {
                  return <ShareInfoCard item={content} />
                }
              },
              // 广告消息样式
              ad: {
                style: { margin: '0 auto' },
                variant: 'borderless',
                styles: {
                  content: {
                    fontSize: 11,
                    color: '#666666',
                    border: `1px solid ${token.colorBorder}`,
                  }
                },
                messageRender: (contentStr) => {
                  let content: any = {};
                  try {
                    content = JSON.parse(contentStr);
                  } catch (e) {
                    console.error("广告内容解析失败", contentStr);
                    return <div style={{ color: 'red' }}>广告内容解析失败</div>;
                  }
                  return (
                    <Card
                      hoverable
                      style={{
                        width: 440,
                        margin: '0 auto',
                        borderRadius: 8,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
                      }}
                      cover={
                        <img
                          alt="广告封面"
                          src={content.adPicture}
                          style={{ height: 180, objectFit: 'cover' }}
                        />
                      }
                    >
                      <Card.Meta
                        title={content.adTitle || '无标题广告'}
                        description={
                          <div
                            style={{
                              fontSize: 12,
                              color: '#666',
                              marginTop: 8,
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                          >
                            {content.adContent || '暂无广告内容'}
                          </div>
                        }
                      />
                    </Card>
                  );
                }
              }
            }}
            items={safeMessages}
            style={{ padding: 16, paddingTop: 10, paddingInline: 18, borderRadius: 8 }}
          />
        </Flex>

        {/* 消息输入区域 */}
        <div
          style={{ paddingTop: 12, position: 'sticky', paddingRight: 8, paddingLeft: 8, bottom: 6 }}
        >
          {/* 广告会话不显示输入框 */}
          {sessionId?.startsWith("AD") ? <></> :
            <Sender
              prefix={
                <div style={{ position: 'relative', marginRight: 18 }}>
                  {/* 文件上传按钮 */}
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
                  {/* 表情选择器 */}
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
                // 单聊时发送"正在输入"状态
                if (isGroup) return
                await sendTypingState({
                  contactId: getContactIdFromSession(sessionId!, user!.id!.toString()),
                  typing: true
                })
              }}
              onBlur={async () => {
                // 单聊时发送"停止输入"状态
                if (isGroup) return
                await sendTypingState({
                  contactId: getContactIdFromSession(sessionId!, user!.id!.toString()),
                  typing: false
                })
              }}
            />
          }
        </div>
      </div>

      {/* 文件预览弹窗 */}
      <FilePreviewModal
        open={filePreview.open}
        onClose={() => setFilePreview({ open: false, fileUrl: '', fileName: '' })}
        fileUrl={filePreview.fileUrl}
        fileName={filePreview.fileName}
      />

      {/* 好友信息抽屉 */}
      {friendInfoDrawer()}

      {/* 群组信息抽屉 */}
      {groupInfoDrawer()}

      {/* 分享弹窗 */}
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