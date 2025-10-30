import {
    AudioMutedOutlined,
    AudioOutlined,
    CheckOutlined,
    CloseOutlined,
    FullscreenExitOutlined,
    FullscreenOutlined,
    PhoneOutlined,
    VideoCameraAddOutlined,
    VideoCameraOutlined,
} from '@ant-design/icons'
import { sendMsg } from '@renderer/api/chatApis'
import { createToken } from '@renderer/api/liveKitApis'
import { useUserStore } from '@renderer/store/useUserStore'
import { Snowflake } from '@renderer/utils/SnowflakeIdUtil'
import { Button, message, Space, Tag, Typography, Avatar, Spin } from 'antd'
import {
    LocalAudioTrack,
    LocalVideoTrack,
    RemoteParticipant,
    RemoteTrack,
    RemoteTrackPublication,
    Room,
    RoomEvent,
    Track,
} from 'livekit-client'
import React, { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'

const { Text } = Typography

type CallStatus = 'caller-waiting' | 'callee-waiting' | 'connected' | 'ended'

const VideoCallPage: React.FC = () => {
    const location = useLocation()
    const query = new URLSearchParams(location.search)
    const getParam = (key: string) => {
        const val = query.get(key)
        return val && val !== 'null' && val !== 'undefined' && val.trim() !== '' ? val : null
    }
    const receiverId = getParam('receiverId')
    const roomParam = getParam('room')
    const senderId = getParam('senderId')
    const senderName = getParam('senderName')
    const senderAvatar = getParam('senderAvatar')
    const text = getParam('text')
    const receiverName = getParam('receiverName')
    const receiverAvatar = getParam('receiverAvatar')

    const { user, setUser } = useUserStore()
    const [callStatus, setCallStatus] = useState<CallStatus>('callee-waiting')
    const [remoteJoined, setRemoteJoined] = useState(false)
    const [isMuted, setIsMuted] = useState(false)
    const [isVideoEnabled, setIsVideoEnabled] = useState(true)
    const [callDuration, setCallDuration] = useState(0)
    const [isFullscreen, setIsFullscreen] = useState(false)

    const localVideoContainerRef = useRef<HTMLDivElement>(null)
    const remoteVideoContainerRef = useRef<HTMLDivElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    const roomRef = useRef<Room | null>(null)
    const timerRef = useRef<NodeJS.Timeout | null>(null)
    const isConnectingRef = useRef(false)

    useEffect(() => {
        window.electron.ipcRenderer.invoke('get-login-user').then((result: any) => {
            setUser(result)
        })
    }, [])

    useEffect(() => {
        if (!user?.id) return
        if (receiverId) {
            setCallStatus('caller-waiting')
            initLiveKit()
        } else {
            setCallStatus('callee-waiting')
        }

        return () => {
            // 清理资源
            if (roomRef.current) {
                roomRef.current.disconnect()
                roomRef.current = null
            }
        }
    }, [receiverId, user?.id])

    useEffect(() => {
        if (callStatus === 'caller-waiting' && remoteJoined) {
            setCallStatus('connected')
        }
    }, [remoteJoined, callStatus])

    const formatDuration = (s: number) =>
        `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`

    const initLiveKit = async () => {
        if (isConnectingRef.current || roomRef.current) return
        if (!user?.id) return

        const roomName: string | null = receiverId ? `${receiverId}-${user.id}` : roomParam
        if (!roomName) {
            message.error('房间参数无效,无法连接')
            return
        }

        isConnectingRef.current = true

        const room = new Room({
            adaptiveStream: true,
            dynacast: true,
            videoCaptureDefaults: {
                resolution: { width: 1280, height: 720 }
            }
        })
        roomRef.current = room

        try {
            // 设置事件监听 - 在connect之前设置
            room.on(RoomEvent.Connected, () => {
                console.log('✅ 已连接到房间')
                if (!receiverId) {
                    setCallStatus('connected')
                }
                message.success('视频通话已接通')
            })

            room.on(RoomEvent.Disconnected, async () => {
                console.log('❌ 连接已断开')
                handleHangup()
                if (receiverId) {
                    await sendMsg({ messageId: Snowflake.nextId(), contactId: receiverId!, messageContent: "视频通话:" + formatDuration(callDuration), messageType: 28 })
                        .then(() => {
                            message.success('已结束通话')
                        }).catch((err) => {
                            message.error('结束通话失败: ' + err.message)
                        })
                }
            })

            room.on(RoomEvent.ParticipantConnected, (participant: RemoteParticipant) => {
                console.log('👤 参与者加入:', participant.identity)
                if (receiverId && participant.identity === receiverId) {
                    setRemoteJoined(true)
                }
            })

            room.on(RoomEvent.ParticipantDisconnected, (participant: RemoteParticipant) => {
                console.log('👤 参与者离开:', participant.identity)
                if (receiverId && participant.identity === receiverId.toString()) {
                    setRemoteJoined(false)
                    handleHangup()
                }
            })

            // 监听远程轨道订阅 - 这是关键
            room.on(
                RoomEvent.TrackSubscribed,
                (
                    track: RemoteTrack,
                    publication: RemoteTrackPublication,
                    participant: RemoteParticipant
                ) => {
                    console.log('📹 收到远程轨道:', track.kind, 'from', participant.identity)

                    if (track.kind === Track.Kind.Video) {
                        // 关键:让LiveKit自动创建video元素
                        const videoElement = track.attach()
                        videoElement.style.width = '100%'
                        videoElement.style.height = '100%'
                        videoElement.style.objectFit = 'cover'

                        // 清空容器并添加新元素
                        if (remoteVideoContainerRef.current) {
                            remoteVideoContainerRef.current.innerHTML = ''
                            remoteVideoContainerRef.current.appendChild(videoElement)
                        }
                    } else if (track.kind === Track.Kind.Audio) {
                        // 音频直接attach播放
                        track.attach()
                    }
                }
            )

            // 监听轨道取消订阅
            room.on(
                RoomEvent.TrackUnsubscribed,
                (track: RemoteTrack) => {
                    console.log('📹 远程轨道移除:', track.kind)
                    track.detach()
                }
            )

            // 监听本地轨道发布
            room.on(RoomEvent.LocalTrackPublished, (publication) => {
                console.log('📹 本地轨道已发布:', publication.kind)

                if (publication.track instanceof LocalVideoTrack && localVideoContainerRef.current) {
                    // 清空容器
                    localVideoContainerRef.current.innerHTML = ''
                    // 让LiveKit自动创建video元素
                    const videoElement = publication.track.attach()
                    videoElement.style.width = '100%'
                    videoElement.style.height = '100%'
                    videoElement.style.objectFit = 'cover'
                    localVideoContainerRef.current.appendChild(videoElement)
                }
            })

            // 获取token
            const tokenParams: Record<string, any> = {
                identity: user.id.toString(),
                room: roomName,
                type: 'VIDEO',
            }
            if (receiverId) tokenParams.receiverId = receiverId

            const response = (await createToken(tokenParams as any)) as any
            const token = response.data.token

            // 连接到房间
            await room.connect('ws://localhost:7880', token)
            console.log('🔗 已连接到房间:', room.name)

            // 发布本地媒体 - 使用LiveKit推荐的方法
            await room.localParticipant.setCameraEnabled(true)
            await room.localParticipant.setMicrophoneEnabled(true)
            console.log('📹 本地媒体已发布')

        } catch (err: any) {
            console.error('❌ LiveKit 初始化失败:', err)
            message.error('连接失败: ' + err.message)
        } finally {
            isConnectingRef.current = false
        }
    }
    const handleAccept = () => {
        setCallStatus('caller-waiting')
        initLiveKit()
    }

    const handleReject = () => {
        message.info('已拒绝通话')
        setTimeout(() => window.close(), 800)
    }

    const handleHangup = () => {
        if (roomRef.current) {
            roomRef.current.disconnect()
            roomRef.current = null
        }
        setCallStatus('ended')
        message.info('通话已结束')
        setTimeout(() => window.close(), 1000)
    }

    const toggleMute = async () => {
        if (!roomRef.current) return
        const newMutedState = !isMuted
        await roomRef.current.localParticipant.setMicrophoneEnabled(!newMutedState)
        setIsMuted(newMutedState)
        message.info(newMutedState ? '麦克风已静音' : '麦克风已开启')
    }

    const toggleVideo = async () => {
        if (!roomRef.current) return
        const newVideoState = !isVideoEnabled
        await roomRef.current.localParticipant.setCameraEnabled(newVideoState)
        setIsVideoEnabled(newVideoState)
        message.info(newVideoState ? '摄像头已开启' : '摄像头已关闭')
    }

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            containerRef.current?.requestFullscreen()
            setIsFullscreen(true)
        } else {
            document.exitFullscreen()
            setIsFullscreen(false)
        }
    }

    useEffect(() => {
        if (callStatus === 'connected') {
            timerRef.current = setInterval(() => setCallDuration((v) => v + 1), 1000)
        } else {
            if (timerRef.current) {
                clearInterval(timerRef.current)
            }
        }
        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current)
            }
        }
    }, [callStatus])

    const renderWaitingUI = (
        avatar?: string,
        name?: string,
        id?: string,
        infoText?: string,
        showLocalVideo?: boolean
    ) => (
        <div
            style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                position: 'relative',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            }}
        >
            <Avatar size={100} src={avatar || ''} style={{ marginBottom: 20 }} />
            <Text style={{ fontSize: 24, marginBottom: 8, color: '#fff' }}>
                {name || '对方'} {id && <Text style={{ opacity: 0.7, color: '#fff' }}>ID: {id}</Text>}
            </Text>
            {infoText && (
                <Text style={{ opacity: 0.7, fontStyle: 'italic', marginBottom: 12, color: '#fff' }}>
                    {infoText}
                </Text>
            )}
            <Spin size="large" />
            {showLocalVideo && (
                <div
                    ref={localVideoContainerRef}
                    style={{
                        width: '200px',
                        height: '150px',
                        position: 'absolute',
                        bottom: '20px',
                        right: '20px',
                        border: '2px solid #fff',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        background: '#000',
                    }}
                />
            )}
        </div>
    )

    return (
        <div
            className="drag"
            ref={containerRef}
            style={{
                width: '100vw',
                height: '100vh',
                position: 'relative',
                background: '#000',
            }}
        >
            {callStatus === 'caller-waiting' &&
                renderWaitingUI(
                    receiverAvatar || undefined,
                    receiverName || '',
                    receiverId || '',
                    '等待对方接入..',
                    true
                )}
            {callStatus === 'callee-waiting' &&
                renderWaitingUI(
                    senderAvatar || undefined,
                    senderName || '',
                    senderId || '',
                    text || '',
                    false
                )}
            {callStatus === 'connected' && (
                <>
                    {/* 远程视频容器 */}
                    <div
                        ref={remoteVideoContainerRef}
                        style={{
                            width: '100%',
                            height: '100%',
                            background: '#000',
                        }}
                    />
                    {/* 本地视频容器 */}
                    <div
                        ref={localVideoContainerRef}
                        style={{
                            width: '200px',
                            height: '150px',
                            position: 'absolute',
                            bottom: '20px',
                            right: '20px',
                            border: '2px solid #fff',
                            borderRadius: '8px',
                            overflow: 'hidden',
                            background: '#000',
                        }}
                    />
                </>
            )}

            <Tag
                color={
                    callStatus === 'caller-waiting' || callStatus === 'callee-waiting'
                        ? 'warning'
                        : callStatus === 'connected'
                            ? 'success'
                            : 'default'
                }
                style={{ position: 'absolute', top: 20, left: 20, zIndex: 10 }}
            >
                {callStatus === 'connected'
                    ? formatDuration(callDuration)
                    : callStatus === 'caller-waiting'
                        ? '等待接听'
                        : callStatus === 'callee-waiting'
                            ? '待加入'
                            : '已结束'}
            </Tag>

            <div
                className="no-drag"
                style={{
                    position: 'absolute',
                    bottom: 0,
                    width: '100%',
                    display: 'flex',
                    justifyContent: 'center',
                    paddingBottom: 30,
                    zIndex: 10,
                }}
            >
                {callStatus === 'callee-waiting' ? (
                    <Space size={40}>
                        <Button
                            type="primary"
                            danger
                            shape="circle"
                            icon={<CloseOutlined />}
                            size="large"
                            onClick={handleReject}
                        />
                        <Button
                            type="primary"
                            shape="circle"
                            icon={<CheckOutlined />}
                            size="large"
                            onClick={handleAccept}
                            style={{ background: '#52c41a', borderColor: '#52c41a' }}
                        />
                    </Space>
                ) : callStatus === 'connected' ? (
                    <Space size={30}>
                        <Button
                            shape="circle"
                            icon={isMuted ? <AudioMutedOutlined /> : <AudioOutlined />}
                            size="large"
                            onClick={toggleMute}
                            type={isMuted ? 'primary' : 'default'}
                            danger={isMuted}
                        />
                        <Button
                            shape="circle"
                            icon={isVideoEnabled ? <VideoCameraOutlined /> : <VideoCameraAddOutlined />}
                            size="large"
                            onClick={toggleVideo}
                            type={!isVideoEnabled ? 'primary' : 'default'}
                            danger={!isVideoEnabled}
                        />
                        <Button
                            type="primary"
                            danger
                            shape="circle"
                            icon={<PhoneOutlined rotate={135} />}
                            size="large"
                            onClick={handleHangup}
                        />
                        <Button
                            shape="circle"
                            icon={isFullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
                            size="large"
                            onClick={toggleFullscreen}
                        />
                    </Space>
                ) : callStatus === 'caller-waiting' ? (
                    <Space size={40}>
                        <Button
                            type="primary"
                            danger
                            shape="circle"
                            icon={<CloseOutlined />}
                            size="large"
                            onClick={handleReject}
                        />
                    </Space>
                ) : null}
            </div>
        </div>
    )
}

export default VideoCallPage