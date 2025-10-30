import React, { useEffect, useState } from 'react'
import { useParams, useLocation } from 'react-router-dom'
import { Button, Space, Avatar, Typography, message, Tag } from 'antd'
import {
    PhoneOutlined,
    CheckOutlined,
    CloseOutlined
} from '@ant-design/icons'
import { useUserStore } from '@renderer/store/useUserStore'
import { createToken } from '@renderer/api/liveKitApis'
import {
    LiveKitRoom,
    RoomAudioRenderer,
    ControlBar,
    useParticipants,
    useRoomContext,
} from '@livekit/components-react'
import '@livekit/components-styles'

const { Text, Title } = Typography

interface CallParams {
    receiveId?: string
    senderName?: string
    senderAvatar?: string
    text?: string
    room?: string
}

type CallStatus = 'calling' | 'waiting' | 'connecting' | 'connected' | 'ended'

/**
 * 音频通话内容组件 - 在LiveKitRoom内部使用
 */
const AudioCallContent: React.FC<{
    callStatus: CallStatus
    setCallStatus: (status: CallStatus) => void
    remoteUserName?: string
    remoteUserAvatar?: string
    onHangup: () => void
}> = ({ callStatus, setCallStatus, remoteUserName, remoteUserAvatar, onHangup }) => {
    const [callDuration, setCallDuration] = useState(0)
    const participants = useParticipants()
    const room = useRoomContext()

    // 监听房间连接状态
    useEffect(() => {
        if (room && room.state === 'connected') {
            const remoteParticipants = participants.filter(
                p => p.identity !== room.localParticipant?.identity
            )
            if (remoteParticipants.length > 0 || callStatus === 'calling' || callStatus === 'connecting') {
                setCallStatus('connected')
            }
        }
    }, [room, room?.state, participants])

    // 通话计时器
    useEffect(() => {
        let timer: NodeJS.Timeout | null = null
        if (callStatus === 'connected') {
            timer = setInterval(() => setCallDuration((v) => v + 1), 1000)
        }
        return () => {
            if (timer) clearInterval(timer)
        }
    }, [callStatus])

    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }

    const getStatusText = () => {
        if (callStatus === 'calling' || callStatus === 'connecting') return '呼叫中...'
        if (callStatus === 'connected') return formatDuration(callDuration)
        return '通话已结束'
    }

    return (
        <div
            style={{
                width: '100vw',
                height: '100vh',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '48px 24px',
                position: 'relative',
                overflow: 'hidden'
            }}
        >
            {/* 装饰性背景 */}
            <div
                style={{
                    position: 'absolute',
                    top: -100,
                    left: -100,
                    width: 400,
                    height: 400,
                    background: 'rgba(255,255,255,0.1)',
                    borderRadius: '50%',
                    filter: 'blur(80px)'
                }}
            />
            <div
                style={{
                    position: 'absolute',
                    bottom: -150,
                    right: -150,
                    width: 500,
                    height: 500,
                    background: 'rgba(255,255,255,0.08)',
                    borderRadius: '50%',
                    filter: 'blur(100px)'
                }}
            />

            {/* 音频渲染器 - LiveKit自动处理 */}
            <RoomAudioRenderer />

            {/* 状态标签 */}
            <Tag
                color={
                    callStatus === 'calling' || callStatus === 'connecting'
                        ? 'processing'
                        : callStatus === 'connected'
                            ? 'success'
                            : 'default'
                }
                style={{
                    fontSize: 14,
                    padding: '8px 24px',
                    borderRadius: 20,
                    border: 'none',
                    fontWeight: 600,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    zIndex: 1
                }}
            >
                {callStatus === 'calling' || callStatus === 'connecting' ? '正在呼叫' : ''}
                {callStatus === 'connected' && '通话中'}
                {callStatus === 'ended' && '已结束'}
            </Tag>

            {/* 用户信息 */}
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flex: 1,
                    gap: 32,
                    zIndex: 1
                }}
            >
                <div style={{ position: 'relative' }}>
                    {remoteUserAvatar ? (
                        <Avatar
                            src={remoteUserAvatar}
                            size={160}
                            style={{
                                border: '6px solid rgba(255,255,255,0.3)',
                                boxShadow: '0 12px 40px rgba(0,0,0,0.3)'
                            }}
                        />
                    ) : (
                        <Avatar
                            size={160}
                            style={{
                                border: '6px solid rgba(255,255,255,0.3)',
                                boxShadow: '0 12px 40px rgba(0,0,0,0.3)',
                                fontSize: 64,
                                fontWeight: 'bold',
                                background: '#1890ff'
                            }}
                        >
                            {remoteUserName?.[0]?.toUpperCase() || 'U'}
                        </Avatar>
                    )}

                    {/* 呼叫动画 */}
                    {(callStatus === 'calling' || callStatus === 'connecting') && (
                        <>
                            <div
                                style={{
                                    position: 'absolute',
                                    top: '50%',
                                    left: '50%',
                                    transform: 'translate(-50%, -50%)',
                                    width: 180,
                                    height: 180,
                                    border: '3px solid rgba(255,255,255,0.5)',
                                    borderRadius: '50%',
                                    animation: 'pulse 1.5s infinite'
                                }}
                            />
                            <div
                                style={{
                                    position: 'absolute',
                                    top: '50%',
                                    left: '50%',
                                    transform: 'translate(-50%, -50%)',
                                    width: 200,
                                    height: 200,
                                    border: '3px solid rgba(255,255,255,0.3)',
                                    borderRadius: '50%',
                                    animation: 'pulse 1.5s infinite 0.5s'
                                }}
                            />
                        </>
                    )}
                </div>

                <div style={{ textAlign: 'center' }}>
                    <Title level={2} style={{ color: '#fff', margin: 0, fontWeight: 600 }}>
                        {remoteUserName || '对方'}
                    </Title>
                    <Text
                        style={{
                            color: 'rgba(255,255,255,0.9)',
                            fontSize: 20,
                            display: 'block',
                            marginTop: 12
                        }}
                    >
                        {getStatusText()}
                    </Text>
                </div>
            </div>

            {/* 控制按钮 */}
            <Space size={24} style={{ marginTop: 32, zIndex: 1 }}>
                {/* 使用LiveKit的ControlBar - 仅显示麦克风和扬声器 */}
                <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
                    <ControlBar
                        controls={{
                            microphone: true,
                            camera: false,
                            screenShare: false,
                            chat: false,
                            settings: false,
                            leave: false,
                        }}
                        variation="minimal"
                    />

                    {/* 挂断按钮 */}
                    <Button
                        type="primary"
                        danger
                        shape="circle"
                        size="large"
                        icon={<PhoneOutlined rotate={135} />}
                        onClick={onHangup}
                        style={{
                            width: 72,
                            height: 72,
                            fontSize: 28,
                            boxShadow: '0 6px 20px rgba(255,77,79,0.4)'
                        }}
                    />
                </div>
            </Space>

            {/* 添加动画样式 */}
            <style>{`
                @keyframes pulse {
                    0% {
                        transform: translate(-50%, -50%) scale(1);
                        opacity: 1;
                    }
                    100% {
                        transform: translate(-50%, -50%) scale(1.3);
                        opacity: 0;
                    }
                }
            `}</style>
        </div>
    )
}

/**
 * 主音频通话组件
 */
const AudioCallModalWithComponents: React.FC = () => {
    const { receiverId } = useParams<{ receiverId: string }>()
    const location = useLocation()
    const user = useUserStore((state) => state.user)
    const setUser = useUserStore((state) => state.setUser)

    // 解析 URL 参数
    const searchParams = new URLSearchParams(location.search)
    const callParams: CallParams = {
        receiveId: searchParams.get('receiveId') || undefined,
        senderName: searchParams.get('senderName') || undefined,
        senderAvatar: searchParams.get('senderAvatar') || undefined,
        text: searchParams.get('text') || undefined,
        room: searchParams.get('room') || undefined
    }

    // 判断角色
    const isCaller = !!receiverId
    const remoteUserId = isCaller ? receiverId : callParams.receiveId
    const remoteUserName = isCaller ? receiverId : callParams.senderName
    const remoteUserAvatar = isCaller ? undefined : callParams.senderAvatar
    const roomName = isCaller
        ? [user?.id, receiverId].sort().join('_')
        : callParams.room || [user?.id, callParams.receiveId].sort().join('_')

    const [callStatus, setCallStatus] = useState<CallStatus>(isCaller ? 'calling' : 'waiting')
    const [token, setToken] = useState<string>('')

    // 获取用户信息
    useEffect(() => {
        window.electron.ipcRenderer.invoke('get-login-user').then((result: any) => {
            setUser(result)
        })
    }, [])

    // 发送者自动初始化
    useEffect(() => {
        if (isCaller && user?.id) {
            initCall()
        }
    }, [isCaller, user?.id])

    const initCall = async () => {
        if (!user?.id) return

        try {
            setCallStatus('connecting')
            const response = await createToken({
                identity: user.id.toString(),
                room: roomName,
                receiverId: remoteUserId!,
                type: 'AUDIO',
            }) as any
            setToken(response.data.token) 
        } catch (err: any) {
            console.error('获取token失败:', err)
            message.error('无法连接到通话服务: ' + err.message)
        }
    }

    const handleAccept = () => {
        setCallStatus('calling')
        initCall()
    }

    const handleReject = () => {
        message.info('已拒绝通话')
        setTimeout(() => window.close(), 500)
    }

    const handleHangup = () => {
        setCallStatus('ended')
        message.info('通话已结束')
        setTimeout(() => window.close(), 500)
    }

    const handleError = (error: Error) => {
        console.error('LiveKit错误:', error)
        message.error('连接失败: ' + error.message)
    }

    // 等待接听界面
    if (callStatus === 'waiting') {
        return (
            <div
                style={{
                    width: '100vw',
                    height: '100vh',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '48px 24px',
                    position: 'relative',
                    overflow: 'hidden'
                }}
            >
                {/* 装饰背景 */}
                <div
                    style={{
                        position: 'absolute',
                        top: -100,
                        left: -100,
                        width: 400,
                        height: 400,
                        background: 'rgba(255,255,255,0.1)',
                        borderRadius: '50%',
                        filter: 'blur(80px)'
                    }}
                />

                <Tag color="warning" style={{ fontSize: 14, padding: '8px 24px', borderRadius: 20, zIndex: 1 }}>
                    等待接听
                </Tag>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 32, zIndex: 1 }}>
                    <Avatar
                        src={remoteUserAvatar}
                        size={160}
                        style={{ border: '6px solid rgba(255,255,255,0.3)', boxShadow: '0 12px 40px rgba(0,0,0,0.3)' }}
                    >
                        {remoteUserName?.[0]?.toUpperCase() || 'U'}
                    </Avatar>
                    <div style={{ textAlign: 'center' }}>
                        <Title level={2} style={{ color: '#fff', margin: 0 }}>
                            {remoteUserName || '对方'}
                        </Title>
                        <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 20, display: 'block', marginTop: 12 }}>
                            {callParams.text || '邀请你语音通话'}
                        </Text>
                    </div>
                </div>

                <Space size={24} style={{ zIndex: 1 }}>
                    <Button
                        type="primary"
                        danger
                        shape="circle"
                        size="large"
                        icon={<CloseOutlined />}
                        onClick={handleReject}
                        style={{ width: 72, height: 72, fontSize: 28 }}
                    />
                    <Button
                        type="primary"
                        shape="circle"
                        size="large"
                        icon={<CheckOutlined />}
                        onClick={handleAccept}
                        style={{
                            width: 72,
                            height: 72,
                            fontSize: 28,
                            background: '#52c41a',
                            borderColor: '#52c41a',
                        }}
                    />
                </Space>
            </div>
        )
    }

    // 有token后,使用LiveKitRoom组件
    if (token && roomName) {
        return (
            <LiveKitRoom
                serverUrl="ws://localhost:7880"
                token={token}
                connect={true}
                audio={true}
                video={false}
                onError={handleError}
                onDisconnected={handleHangup}
                options={{
                    adaptiveStream: true,
                    dynacast: true,
                    audioCaptureDefaults: {
                        autoGainControl: true,
                        echoCancellation: true,
                        noiseSuppression: true
                    }
                }}
            >
                <AudioCallContent
                    callStatus={callStatus}
                    setCallStatus={setCallStatus}
                    remoteUserName={remoteUserName}
                    remoteUserAvatar={remoteUserAvatar}
                    onHangup={handleHangup}
                />
            </LiveKitRoom>
        )
    }

    return null
}

export default AudioCallModalWithComponents