import React, { useEffect, useRef, useState } from 'react'
import { useParams, useLocation } from 'react-router-dom'
import { Button, Space, Avatar, Typography, message, Tag } from 'antd'
import {
    PhoneOutlined,
    AudioMutedOutlined,
    AudioOutlined,
    SoundOutlined,
    CustomerServiceOutlined,
    CheckOutlined,
    CloseOutlined
} from '@ant-design/icons'
import { useUserStore } from '@renderer/store/useUserStore'
import {
    Room,
    RoomEvent,
    RemoteParticipant,
    RemoteTrackPublication,
    RemoteTrack,
    Track
} from 'livekit-client'
import { createToken } from '@renderer/api/liveKitApis'

const { Text, Title } = Typography

interface CallParams {
    receiveId?: string
    senderName?: string
    senderAvatar?: string
    text?: string
    room?: string
}

const AudioCallModal: React.FC = () => {
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

    // 判断角色：有 receiverId 则是发送者(主叫)，否则是接收者(被叫)
    const isCaller = !!receiverId
    const remoteUserId = isCaller ? receiverId : callParams.receiveId
    const remoteUserName = isCaller ? receiverId : callParams.senderName
    const remoteUserAvatar = isCaller ? undefined : callParams.senderAvatar
    const roomName = isCaller
        ? [user?.id, receiverId].sort().join('_')
        : callParams.room || [user?.id, callParams.receiveId].sort().join('_')

    const [callStatus, setCallStatus] = useState<'calling' | 'waiting' | 'connected' | 'ended'>(
        isCaller ? 'calling' : 'waiting'
    )
    const [isMuted, setIsMuted] = useState(false)
    const [isSpeakerOn, setIsSpeakerOn] = useState(true)
    const [callDuration, setCallDuration] = useState(0)
    const [isConnecting, setIsConnecting] = useState(false)

    const roomRef = useRef<Room | null>(null)
    const remoteAudioRef = useRef<HTMLAudioElement>(null)
    const timerRef = useRef<NodeJS.Timeout | null>(null)

    // 格式化通话时长
    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }

    // 获取用户信息
    useEffect(() => {
        window.electron.ipcRenderer.invoke('get-login-user').then((result: any) => {
            setUser(result)
        })
    }, [])

    // 初始化 LiveKit 连接
    const initLiveKit = async () => {
        try {
            setIsConnecting(true)
            const room = new Room({
                adaptiveStream: true,
                dynacast: true,
                audioCaptureDefaults: {
                    autoGainControl: true,
                    echoCancellation: true,
                    noiseSuppression: true
                }
            })

            roomRef.current = room

            // 监听连接状态
            room.on(RoomEvent.Connected, () => {
                console.log('✅ 已连接到房间')
                setCallStatus('connected')
                setIsConnecting(false)
                message.success('通话已接通')
            })

            room.on(RoomEvent.Disconnected, () => {
                console.log('❌ 已断开连接')
                handleHangup()
            })

            // 监听远程音频轨道
            room.on(
                RoomEvent.TrackSubscribed,
                (
                    track: RemoteTrack,
                    publication: RemoteTrackPublication,
                    participant: RemoteParticipant
                ) => {
                    if (track.kind === Track.Kind.Audio) {
                        const audioElement = track.attach()
                        if (remoteAudioRef.current && audioElement.srcObject) {
                            const audioTrack = (audioElement.srcObject as MediaStream).getAudioTracks()[0]
                            if (audioTrack) {
                                remoteAudioRef.current.srcObject = new MediaStream([audioTrack])
                                remoteAudioRef.current.play()
                            }
                        }
                    }
                }
            )

            // 获取 Token
            const response = await createToken({
                identity: user?.id?.toString()!,
                room: roomName,
                receiverId: remoteUserId!,
                type: 'AUDIO',
                isReceiver: isCaller
            })
            const token = response.data.token 

            // 连接到 LiveKit 服务器
            await room.connect('ws://localhost:7880', token)

            // 发布本地音频
            await room.localParticipant.setMicrophoneEnabled(true)
        } catch (err) {
            console.error('❌ LiveKit 初始化失败:', err)
            message.error('无法连接到通话服务，请检查网络或权限设置')
            setIsConnecting(false)
        }
    }

    // 接受通话
    const handleAccept = () => {
        setCallStatus('calling')
        initLiveKit()
    }

    // 拒绝通话
    const handleReject = () => {
        message.info('已拒绝通话')
        setTimeout(() => {
            window.close()
        }, 500)
    }

    // 发送者自动连接
    useEffect(() => {
        if (isCaller && user?.id) {
            initLiveKit()
        }
    }, [isCaller, user?.id])

    // 通话计时器
    useEffect(() => {
        if (callStatus === 'connected') {
            timerRef.current = setInterval(() => setCallDuration((prev) => prev + 1), 1000)
        } else if (timerRef.current) {
            clearInterval(timerRef.current)
            timerRef.current = null
        }
        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current)
                timerRef.current = null
            }
        }
    }, [callStatus])

    // 静音/取消静音
    const toggleMute = async () => {
        if (roomRef.current) {
            const enabled = !isMuted
            await roomRef.current.localParticipant.setMicrophoneEnabled(enabled)
            setIsMuted(!enabled)
            message.info(enabled ? '麦克风已开启' : '麦克风已静音')
        }
    }

    // 切换扬声器
    const toggleSpeaker = () => {
        if (remoteAudioRef.current) {
            remoteAudioRef.current.volume = isSpeakerOn ? 0 : 1
            setIsSpeakerOn(!isSpeakerOn)
            message.info(isSpeakerOn ? '扬声器已关闭' : '扬声器已开启')
        }
    }

    // 挂断
    const handleHangup = () => {
        setCallStatus('ended')
        setCallDuration(0)
        if (roomRef.current) {
            roomRef.current.disconnect()
        }
        message.info('通话已结束')
        setTimeout(() => {
            window.close()
        }, 500)
    }

    // 获取状态文本
    const getStatusText = () => {
        if (callStatus === 'waiting') return '邀请你语音通话'
        if (callStatus === 'calling') return isConnecting ? '正在连接...' : '呼叫中...'
        if (callStatus === 'connected') return formatDuration(callDuration)
        return '通话已结束'
    }

    return (
        <div
            className="audio-call-modal"
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

            {/* 状态标签 */}
            <Tag
                color={
                    callStatus === 'waiting'
                        ? 'warning'
                        : callStatus === 'calling'
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
                {callStatus === 'waiting' && '等待接听'}
                {callStatus === 'calling' && (isConnecting ? '正在连接...' : '正在呼叫')}
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
                                fontWeight: 'bold'
                            }}
                        >
                            {remoteUserName?.[0]?.toUpperCase() || 'U'}
                        </Avatar>
                    )}
                    {/* 呼叫动画 */}
                    {(callStatus === 'calling' || callStatus === 'waiting') && (
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
            {callStatus === 'waiting' ? (
                // 接收者：显示接受/拒绝按钮
                <Space size={24} style={{ marginTop: 32, zIndex: 1 }}>
                    <Button
                        type="primary"
                        danger
                        shape="circle"
                        size="large"
                        icon={<CloseOutlined />}
                        onClick={handleReject}
                        style={{
                            width: 72,
                            height: 72,
                            fontSize: 28,
                            boxShadow: '0 6px 20px rgba(255,77,79,0.4)'
                        }}
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
                            boxShadow: '0 6px 20px rgba(82,196,26,0.4)'
                        }}
                    />
                </Space>
            ) : (
                // 通话中：显示通话控制按钮
                <Space size={24} style={{ marginTop: 32, zIndex: 1 }}>
                    <Button
                        type={isMuted ? 'primary' : 'default'}
                        shape="circle"
                        size="large"
                        icon={isMuted ? <AudioMutedOutlined /> : <AudioOutlined />}
                        onClick={toggleMute}
                        disabled={callStatus !== 'connected'}
                        style={{
                            width: 64,
                            height: 64,
                            fontSize: 24,
                            boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
                            background: isMuted ? '#ff4d4f' : '#fff'
                        }}
                    />
                    <Button
                        type="primary"
                        danger
                        shape="circle"
                        size="large"
                        icon={<PhoneOutlined rotate={135} />}
                        onClick={handleHangup}
                        style={{
                            width: 72,
                            height: 72,
                            fontSize: 28,
                            boxShadow: '0 6px 20px rgba(255,77,79,0.4)'
                        }}
                    />
                    <Button
                        type={isSpeakerOn ? 'primary' : 'default'}
                        shape="circle"
                        size="large"
                        icon={isSpeakerOn ? <SoundOutlined /> : <CustomerServiceOutlined />}
                        onClick={toggleSpeaker}
                        disabled={callStatus !== 'connected'}
                        style={{
                            width: 64,
                            height: 64,
                            fontSize: 24,
                            boxShadow: '0 4px 16px rgba(0,0,0,0.2)'
                        }}
                    />
                </Space>
            )}

            {/* 远程音频 */}
            <audio ref={remoteAudioRef} autoPlay style={{ display: 'none' }} />

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

export default AudioCallModal
