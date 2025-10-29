import React, { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Button, Space, Typography, message, Tag } from 'antd'
import {
    PhoneOutlined,
    AudioMutedOutlined,
    AudioOutlined,
    VideoCameraOutlined,
    VideoCameraAddOutlined,
    FullscreenOutlined,
    SwapOutlined,
    FullscreenExitOutlined
} from '@ant-design/icons'
import { useUserStore } from '@renderer/store/useUserStore'
import {
    Room,
    RoomEvent,
    RemoteParticipant,
    RemoteTrackPublication,
    RemoteTrack,
    Track,
    LocalVideoTrack
} from 'livekit-client'
import request from '@renderer/http/request'

const { Text } = Typography

const VideoCallModal: React.FC = () => {
    const { receiverId } = useParams<{ receiverId: string }>()
    const user = useUserStore((state) => state.user)
    const setUser = useUserStore((state) => state.setUser);
    const [callStatus, setCallStatus] = useState<'calling' | 'connected' | 'ended'>('calling')
    const [isMuted, setIsMuted] = useState(false)
    const [isVideoEnabled, setIsVideoEnabled] = useState(true)
    const [callDuration, setCallDuration] = useState(0)
    const [isFullscreen, setIsFullscreen] = useState(false)
    const [isConnecting, setIsConnecting] = useState(true)

    const localVideoRef = useRef<HTMLVideoElement>(null)
    const remoteVideoRef = useRef<HTMLVideoElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    const roomRef = useRef<Room | null>(null)
    const timerRef = useRef<NodeJS.Timeout | null>(null)

    // 通话时长格式化
    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }

    // 初始化 LiveKit 连接
    useEffect(() => {
        window.electron.ipcRenderer.invoke('get-login-user').then((result: any) => {
            setUser(result);
        });
        const initLiveKit = async () => {
            try {
                const room = new Room({
                    adaptiveStream: true,
                    dynacast: true,
                    videoCaptureDefaults: {
                        resolution: {
                            width: 1280,
                            height: 720,
                            frameRate: 30
                        }
                    },
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
                    message.success('视频通话已接通')
                })

                room.on(RoomEvent.Disconnected, () => {
                    console.log('❌ 已断开连接')
                    handleHangup()
                })

                // 监听远程视频轨道
                room.on(
                    RoomEvent.TrackSubscribed,
                    (
                        track: RemoteTrack,
                        publication: RemoteTrackPublication,
                        participant: RemoteParticipant
                    ) => {
                        if (track.kind === Track.Kind.Video) {
                            const videoElement = track.attach()
                            if (remoteVideoRef.current) {
                                remoteVideoRef.current.srcObject = videoElement.srcObject
                            }
                        } else if (track.kind === Track.Kind.Audio) {
                            track.attach() // 自动播放音频
                        }
                    }
                )

                // 监听本地视频轨道
                room.on(RoomEvent.LocalTrackPublished, (publication) => {
                    if (publication.track instanceof LocalVideoTrack) {
                        const videoElement = publication.track.attach()
                        if (localVideoRef.current) {
                            localVideoRef.current.srcObject = videoElement.srcObject
                        }
                    }
                })

                // 获取 Token
                const roomName = [user?.id, receiverId].sort().join('_')
                const response = await request.get(
                    `/livekit/token?identity=${user?.id}&room=${roomName}`
                )
                const token = response.data.token

                console.log("token", token);
                // 连接到 LiveKit 服务器
                await room.connect('ws://localhost:7880', token)

                // 发布本地音视频
                await room.localParticipant.setCameraEnabled(true)
                await room.localParticipant.setMicrophoneEnabled(true)
            } catch (err) {
                console.error('❌ LiveKit 初始化失败:', err)
                message.error('无法连接到视频通话服务，请检查摄像头权限')
                console.error('LiveKit 初始化失败:', err);
                if (err.name === 'NotAllowedError') {
                    message.error('用户拒绝摄像头或麦克风权限');
                } else if (err.name === 'NotFoundError') {
                    message.error('未检测到摄像头或麦克风设备');
                } else {
                    message.error('无法连接到视频通话服务，请检查网络或服务状态');
                }
                setIsConnecting(false)
            }
        }

        initLiveKit()

        return () => {
            if (roomRef.current) {
                roomRef.current.disconnect()
            }
        }
    }, [user?.id, receiverId])

    // 通话计时器
    useEffect(() => {
        if (callStatus === 'connected') {
            timerRef.current = setInterval(() => {
                setCallDuration((prev) => prev + 1)
            }, 1000)
        } else {
            if (timerRef.current) clearInterval(timerRef.current)
        }
        return () => {
            if (timerRef.current) clearInterval(timerRef.current)
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

    // 开关视频
    const toggleVideo = async () => {
        if (roomRef.current) {
            const enabled = !isVideoEnabled
            await roomRef.current.localParticipant.setCameraEnabled(enabled)
            setIsVideoEnabled(enabled)
            message.info(enabled ? '摄像头已开启' : '摄像头已关闭')
        }
    }

    // 全屏切换
    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            containerRef.current?.requestFullscreen()
            setIsFullscreen(true)
        } else {
            document.exitFullscreen()
            setIsFullscreen(false)
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
        }, 1000)
    }

    // 切换摄像头
    const switchCamera = async () => {
        if (roomRef.current) {
            try {
                const devices = await navigator.mediaDevices.enumerateDevices()
                const videoDevices = devices.filter((d) => d.kind === 'videoinput')
                if (videoDevices.length > 1) {
                    message.info('切换摄像头功能开发中...')
                    // TODO: 实现摄像头切换逻辑
                } else {
                    message.warning('未检测到多个摄像头')
                }
            } catch (err) {
                message.error('切换摄像头失败')
            }
        }
    }

    return (
        <div
            ref={containerRef}
            style={{
                width: '100vw',
                height: '100vh',
                background: '#000',
                position: 'relative',
                overflow: 'hidden'
            }}
        >
            {/* 远程视频 */}
            {callStatus === 'connected' ? (
                <video
                    ref={remoteVideoRef}
                    autoPlay
                    playsInline
                    style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        background: '#1a1a1a'
                    }}
                />
            ) : (
                <div
                    style={{
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)'
                    }}
                >
                    <div
                        style={{
                            width: 120,
                            height: 120,
                            borderRadius: '50%',
                            background: 'rgba(255,255,255,0.2)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 48,
                            color: '#fff',
                            marginBottom: 24,
                            fontWeight: 'bold'
                        }}
                    >
                        {receiverId?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <Text style={{ color: '#fff', fontSize: 24, marginBottom: 12 }}>
                        {receiverId || '对方'}
                    </Text>
                    <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 18 }}>
                        {isConnecting ? '正在连接...' : '正在呼叫...'}
                    </Text>
                </div>
            )}

            {/* 状态标签 */}
            <Tag
                color={
                    callStatus === 'calling'
                        ? 'processing'
                        : callStatus === 'connected'
                            ? 'success'
                            : 'default'
                }
                style={{
                    position: 'absolute',
                    top: 20,
                    left: 20,
                    fontSize: 14,
                    padding: '6px 16px',
                    borderRadius: 12,
                    border: 'none',
                    fontWeight: 600,
                    background: 'rgba(0,0,0,0.6)',
                    backdropFilter: 'blur(10px)'
                }}
            >
                {callStatus === 'connected' ? formatDuration(callDuration) : '呼叫中'}
            </Tag>

            {/* 本地视频（小窗） */}
            <div
                style={{
                    position: 'absolute',
                    top: 20,
                    right: 20,
                    width: 200,
                    height: 150,
                    borderRadius: 12,
                    overflow: 'hidden',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                    border: '3px solid rgba(255,255,255,0.2)',
                    background: '#000'
                }}
            >
                {isVideoEnabled ? (
                    <video
                        ref={localVideoRef}
                        autoPlay
                        muted
                        playsInline
                        style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            transform: 'scaleX(-1)'
                        }}
                    />
                ) : (
                    <div
                        style={{
                            width: '100%',
                            height: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: '#1a1a1a',
                            color: '#fff',
                            fontSize: 48
                        }}
                    >
                        {user?.username?.[0]?.toUpperCase() || 'M'}
                    </div>
                )}
            </div>

            {/* 控制栏 */}
            <div
                style={{
                    position: 'absolute',
                    bottom: 0,
                    width: '100%',
                    padding: '24px 0',
                    background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)',
                    display: 'flex',
                    justifyContent: 'center'
                }}
            >
                <Space size={20}>
                    <Button
                        type={isMuted ? 'primary' : 'default'}
                        danger={isMuted}
                        shape="circle"
                        size="large"
                        icon={isMuted ? <AudioMutedOutlined /> : <AudioOutlined />}
                        onClick={toggleMute}
                        style={{
                            width: 56,
                            height: 56,
                            fontSize: 22,
                            background: isMuted ? '#ff4d4f' : 'rgba(255,255,255,0.9)',
                            backdropFilter: 'blur(10px)',
                            border: 'none',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
                        }}
                    />
                    <Button
                        type={!isVideoEnabled ? 'primary' : 'default'}
                        danger={!isVideoEnabled}
                        shape="circle"
                        size="large"
                        icon={
                            isVideoEnabled ? <VideoCameraOutlined /> : <VideoCameraAddOutlined />
                        }
                        onClick={toggleVideo}
                        style={{
                            width: 56,
                            height: 56,
                            fontSize: 22,
                            background: !isVideoEnabled
                                ? '#ff4d4f'
                                : 'rgba(255,255,255,0.9)',
                            backdropFilter: 'blur(10px)',
                            border: 'none',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
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
                            width: 64,
                            height: 64,
                            fontSize: 26,
                            boxShadow: '0 6px 20px rgba(255,77,79,0.5)'
                        }}
                    />
                    <Button
                        type="default"
                        shape="circle"
                        size="large"
                        icon={<SwapOutlined />}
                        onClick={switchCamera}
                        style={{
                            width: 56,
                            height: 56,
                            fontSize: 22,
                            background: 'rgba(255,255,255,0.9)',
                            backdropFilter: 'blur(10px)',
                            border: 'none',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
                        }}
                    />
                    <Button
                        type="default"
                        shape="circle"
                        size="large"
                        icon={
                            isFullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />
                        }
                        onClick={toggleFullscreen}
                        style={{
                            width: 56,
                            height: 56,
                            fontSize: 22,
                            background: 'rgba(255,255,255,0.9)',
                            backdropFilter: 'blur(10px)',
                            border: 'none',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
                        }}
                    />
                </Space>
            </div>
        </div>
    )
}

export default VideoCallModal
