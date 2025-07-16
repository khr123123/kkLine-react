import { LinkOutlined, SmileOutlined, } from '@ant-design/icons'
import { Attachments, Bubble, Sender } from '@ant-design/x'
import { Button, Flex, Popover, Space, Avatar, Typography, message, Modal, theme, Upload, UploadProps, GetProp, Progress } from 'antd'
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
import { sendMsg, sendTypingState } from '@renderer/api/chatApis'
import { Snowflake } from '@renderer/utils/SnowflakeIdUtil'
import type { RcFile, UploadFile } from 'antd/es/upload/interface';
import FilePreviewModal from '@renderer/components/FilePreviewModal'

let globalUploadId: any;
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
    let lastTimeNodeContent: string = ""
    for (const item of result) {
      const currentTimestamp = new Date(item.sendTime).getTime()
      if (lastTimestamp === 0 || currentTimestamp - lastTimestamp > 10 * 60 * 1000) {
        if (lastTimeNodeContent !== formatRelativeTime(currentTimestamp)) {
          lastTimeNodeContent = formatRelativeTime(currentTimestamp)
          messagesWithTime.push({
            _key: `time-${item.id}`,
            role: 'time',
            content: lastTimeNodeContent,
          })
        }
      }
      const sysMsgType = [24];
      if (sysMsgType.includes(item.messageType)) {
        messagesWithTime.push({
          _key: item.id,
          role: 'sys',
          content: item.messageContent,
        });
      } else {
        // 判断是否是文件消息（根据 fileUrl 判断）
        const isFile = !!item.fileUrl;
        const content = isFile
          ? {
            uid: item.id,
            name: item.fileName,
            size: Number(item.fileSize) || 0,
            url: item.fileUrl,
          }
          : item.messageContent;
        messagesWithTime.push({
          _key: item.id,
          role: isFile
            ? (item.sendUserId === user?.id ? 'meFile' : 'friendFile')
            : (item.sendUserId === user?.id ? 'me' : 'friend'),
          content,
          avatar: item.sendUserId === user?.id
            ? { src: user?.userAvatar }
            : { src: resData.userAvatar },
        });
        lastTimestamp = currentTimestamp;
      }
    }

    if (result.length > 0) {
      lastMessageTimeRef.current = result[result.length - 1].sendTime;
    }

    setMessages(messagesWithTime);
  };

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
    let lastTimeNodeContent: string = ""
    for (const item of result) {
      const currentTimestamp = new Date(item.sendTime).getTime()
      if (lastTimestamp === 0 || currentTimestamp - lastTimestamp > 10 * 60 * 1000) {
        // 如果和上一条消息时间间隔超过10分钟，插入时间节点
        if (lastTimeNodeContent !== formatRelativeTime(currentTimestamp)) {
          lastTimeNodeContent = formatRelativeTime(currentTimestamp)
          messagesWithTime.push({
            _key: `time-${item.id}`,
            role: 'time',
            content: lastTimeNodeContent,
          })
        }
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
        // 判断是否是文件消息（根据 fileUrl 判断）
        const isFile = !!item.fileUrl;
        const content = isFile
          ? {
            uid: item.id,
            name: item.fileName,
            size: Number(item.fileSize) || 0,
            url: item.fileUrl,
          }
          : item.messageContent;
        messagesWithTime.push({
          _key: item.id,
          role: isFile
            ? (item.sendUserId === user?.id ? 'meFile' : 'friendFile')
            : (item.sendUserId === user?.id ? 'me' : 'friend'),
          content,
          avatar: item.sendUserId === user?.id
            ? { src: user?.userAvatar }
            : { src: map.get(item.sendUserId) }
        });
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
    const isLt10MB = file.size / 1024 / 1024 < 10;
    if (!isLt10MB) {
      message.error('图片必须小于 10MB！');
      return false;
    }
    if (!sessionId || !user?.id) {
      message.error('系统错误，请重新登录..');
      return false;
    }
    // 这里你可以拿 fileInfo.uid, fileInfo.name, fileInfo.size 等属性
    globalUploadId = Snowflake.nextId()
    console.log(globalUploadId);
    console.log(globalUploadId);
    console.log(globalUploadId);
    if (!sessionId || !user?.id) return;
    const now = Date.now();
    // 构造消息内容
    const content = {
      uid: globalUploadId,
      name: file.name,
      size: Number(file.size) || 0,
      status: 'uploading',
      percent: 0,
    };
    const contactId = sessionId.startsWith('G')
      ? sessionId
      : getContactIdFromSession(sessionId, user.id.toString());
    // 本地消息对象
    const newMessages: CustomBubbleProps[] = [];
    // 判断是否要插入时间节点（比如间隔超过 1 分钟 ）
    if (now - lastMessageTimeRef.current > 1 * 60 * 1000) {
      newMessages.push({
        _key: `time-${now}`,
        role: 'time',
        content: formatRelativeTime(now),
        style: { margin: '0 auto' }
      });
    }
    newMessages.push({
      _key: globalUploadId,
      role: 'meFile',
      avatar: { src: user?.userAvatar },
      content,
      variant: 'borderless',
    },)
    const newMsg = {
      id: globalUploadId,
      sessionId,
      messageType: 21,
      messageContent: `[${file.type}]`,
      sendUserId: user.id,
      sendUserName: user.userName,
      sendTime: now,
      contactId,
      fileUrl: "",
      fileSize: Number(file.size) || 0,
      fileName: file.name,
      fileType: file.type,
      sendStatus: 0,
    };
    setMessages(prev => [...prev, ...newMessages]);
    window.electron.ipcRenderer.send('user-send-file-message', newMsg);
    return true;
  };


  const getUploadData = (file: UploadFile) => {
    // const originFile = file.originFileObj as RcFile | undefined;
    // let bizType: 'picture' | 'file' | 'video' = 'file';
    // if (originFile.type.startsWith('image/')) bizType = 'picture';
    // else if (originFile.type.startsWith('video/')) bizType = 'video';
    const contactId = sessionId?.startsWith('G')
      ? sessionId
      : getContactIdFromSession(sessionId!, user!.id!.toString());
    console.log('sessionId:', sessionId);
    console.log('user.id:', user?.id);
    console.log('contactId:', contactId);
    return {
      messageId: globalUploadId,
      biz: 'file',
      contactId: contactId,
    };
  };

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
      // 判断是否要插入时间节点（比如间隔超过 1 分钟 ）
      if (now - lastMessageTimeRef.current > 1 * 60 * 1000) {
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
  useEffect(() => {
    const msgReciveListener = (_event: any, msgInfo: any) => {
      if (msgInfo.sessionId !== sessionId) return;
      const currentTimestamp = new Date(msgInfo.sendTime).getTime();
      const timeDiff = currentTimestamp - lastMessageTimeRef.current;
      const newMessages: CustomBubbleProps[] = [];
      // 超过10分钟插入时间节点
      if (timeDiff > 10 * 60 * 1000) {
        newMessages.push({
          _key: `time-${msgInfo.id}`,
          role: 'time',
          content: formatRelativeTime(currentTimestamp),
          style: { margin: '0 auto' }
        });
      }

      const sysMsgType = [3, 10, 11, 12, 13, 14, 15, 24];
      if (sysMsgType.includes(msgInfo.messageType)) {
        newMessages.push({
          _key: msgInfo.id,
          role: 'sys',
          content: msgInfo.messageContent,
        });
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
              percent: 0,
            },
            avatar: { src: sessionId?.startsWith('G') ? memberMap.get(msgInfo.sendUserId) : friendInfo?.userAvatar },
          });
        } else {
          newMessages.push({
            _key: msgInfo.id,
            role: 'friend',
            content: msgInfo.messageContent,
            avatar: { src: sessionId?.startsWith('G') ? memberMap.get(msgInfo.sendUserId) : friendInfo?.userAvatar }
          });
        }
      }

      lastMessageTimeRef.current = currentTimestamp;
      setMessages(prev => [...prev, ...newMessages]);
    };

    window.electron.ipcRenderer.on('receive-message', msgReciveListener);

    return () => {
      window.electron.ipcRenderer.removeAllListeners('receive-message');
    };
  }, [sessionId, user?.id, friendInfo, memberMap]);

  useEffect(() => {
    const handler = (_event: any, messageId: string, data: { percent: number; status: string; fileUrl?: string }) => {
      setMessages(prev => {
        return prev.map(msg => {
          if (msg._key === messageId && typeof msg.content === 'object') {
            const updatedContent = {
              ...msg.content,
              percent: data.percent,
              status: data.status,
              url: data.fileUrl,
            };
            return { ...msg, content: updatedContent };
          }
          return msg;
        });
      });
    };
    window.electron.ipcRenderer.on('file-msg-progress', handler);
    return () => {
      window.electron.ipcRenderer.removeAllListeners('file-msg-progress');
    };
  }, []);

  const [filePreview, setFilePreview] = useState({
    open: false,
    fileUrl: '',
    fileName: '',
  });


  useEffect(() => {
    const handleTyping = (_event: any, currentSessionId: string, isTyping: boolean) => {
      if (sessionId !== currentSessionId || sessionId?.startsWith('G')) return;
      setMessages(prev => {
        const filtered = prev.filter(msg => msg.id !== 'typing');
        if (isTyping) {
          return [...filtered, {
            id: 'typing',
            placement: 'start',
            loading: true,
            avatar: { src: friendInfo?.userAvatar }
          }];
        } else {
          return filtered;
        }
      });
    };
    window.electron.ipcRenderer.on('typing', handleTyping);
    return () => {
      window.electron.ipcRenderer.removeAllListeners('typing');
    };
  }, [sessionId, friendInfo]);

  useEffect(() => {
    setMessages(prev => {
      const normalMessages = prev.filter(msg => msg.id !== 'typing');
      const typingMessages = prev.filter(msg => msg.id === 'typing');
      if (typingMessages.length === 0) return prev;
      return [...normalMessages, ...typingMessages];
    });
  }, [messages]);

  return (
    <>
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
              me: { placement: 'end', style: { maxWidth: '100%' }, },
              meFile: {
                placement: 'end', style: { maxWidth: '100%' }, variant: 'borderless', messageRender: (item) => (
                  <Flex style={{ position: 'relative', display: 'inline-block' }}>
                    <div style={{
                      cursor: !item.percent ? 'pointer' : 'default',
                    }} onClick={() => {
                      !item.percent ?
                        setFilePreview({ open: true, fileUrl: item.url, fileName: item.name }) :
                        void 0
                    }}>
                      <Attachments.FileCard key={item.uid} item={item} />
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
                            boxShadow: '0 0 4px rgba(0,0,0,0.15)',
                          }}
                        />
                      )}
                    </div>
                  </Flex>
                ),
              },
              friend: { placement: 'start', style: { maxWidth: '100%' } },
              friendFile: {
                placement: 'start', style: { maxWidth: '100%' }, variant: 'borderless', messageRender: (item) => (
                  <Flex style={{ position: 'relative', display: 'inline-block' }}>
                    <div style={{
                      cursor: !item.percent ? 'pointer' : 'default',
                    }} onClick={() => {
                      !item.percent ?
                        setFilePreview({ open: true, fileUrl: item.url, fileName: item.name }) :
                        void 0
                    }}>
                      <Attachments.FileCard key={item.uid} item={item} />
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
                            boxShadow: '0 0 4px rgba(0,0,0,0.15)',
                          }}
                        />
                      )}
                    </div>
                  </Flex>
                ),
              },
              time: {
                style: { margin: '0 auto', }, styles: {
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
                style: { margin: '0 auto', }, variant: 'shadow', styles: {
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
                  content={<EmojiPicker onEmojiClick={emoji => setValue(prev => prev + emoji.emoji)} searchDisabled skinTonesDisabled height={400} width={300} />}
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
            onFocus={async () => await sendTypingState({ contactId: getContactIdFromSession(sessionId!, user!.id!.toString()), typing: true })} // 聚焦事件 正在输入..
            onBlur={async () => await sendTypingState({ contactId: getContactIdFromSession(sessionId!, user!.id!.toString()), typing: false }) // 失焦事件 输入结束..
            }
          />
        </div>
      </div>
      <FilePreviewModal
        open={filePreview.open}
        onClose={() => setFilePreview({ open: false, fileUrl: '', fileName: '' })}
        fileUrl={filePreview.fileUrl}
        fileName={filePreview.fileName}
      />

    </>
  )
}

export default ChatPage
