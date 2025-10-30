import React, { ReactNode, useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Button, message, Space, Tag, Typography, Avatar, Spin } from 'antd'
import {
    CheckOutlined,
    CloseOutlined,
    FullscreenExitOutlined,
    FullscreenOutlined,
    PhoneOutlined,
} from '@ant-design/icons'
import { useUserStore } from '@renderer/store/useUserStore'
import { createToken } from '@renderer/api/liveKitApis'
import {
    LiveKitRoom,
    VideoConference,
    RoomAudioRenderer,
    ControlBar,
    useTracks,
    useParticipants,
    useRoomContext,
    ParticipantTile,
    TrackLoop,
    AudioTrack,
    VideoTrack,
} from '@livekit/components-react'
import '@livekit/components-styles'
import { Track, Room as LiveKitRoomType } from 'livekit-client'

const { Text } = Typography

type CallStatus = 'caller-waiting' | 'callee-waiting' | 'connecting' | 'connected' | 'ended'

/**
 * 内部视频通话组件 - 在LiveKitRoom内部使用
 */
const VideoCallContent: React.FC<{
    callStatus: CallStatus
    setCallStatus: (status: CallStatus) => void
    receiverId?: string | null
    onHangup: () => void
}> = ({ callStatus, setCallStatus, receiverId, onHangup }) => {
    const [callDuration, setCallDuration] = useState(0)
    const [isFullscreen, setIsFullscreen] = useState(false)

    const participants = useParticipants()
    const room = useRoomContext()
    const tracks = useTracks([Track.Source.Camera, Track.Source.Microphone])

    // 监听房间连接状态
    useEffect(() => {
        if (room && room.state === 'connected') {
            setCallStatus('connected')
        }
    }, [room, room?.state])

    // 监听远程参与者
    useEffect(() => {
        if (callStatus === 'caller-waiting' || callStatus === 'connecting') {
            const remoteParticipants = participants.filter(p => p.identity !== room?.localParticipant?.identity)
            if (remoteParticipants.length > 0) {
                setCallStatus('connected')
            }
        }
    }, [participants])

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

    const formatDuration = (s: number) =>
        `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen()
            setIsFullscreen(true)
        } else {
            document.exitFullscreen()
            setIsFullscreen(false)
        }
    }

    return (
        <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
            {/* 状态标签 */}
            <Tag
                color={callStatus === 'connected' ? 'success' : 'warning'}
                style={{ position: 'absolute', top: 20, left: 20, zIndex: 100 }}
            >
                {callStatus === 'connected' ? formatDuration(callDuration) : '等待接听'}
            </Tag>

            {/* 全屏按钮 */}
            <Button
                shape="circle"
                icon={isFullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
                size="large"
                onClick={toggleFullscreen}
                style={{ position: 'absolute', top: 20, right: 20, zIndex: 100 }}
            />

            {/* 视频区域 - 使用LiveKit组件 */}
            <div style={{ width: '100%', height: 'calc(100% - 100px)', position: 'relative' }}>
                <TrackLoop tracks={tracks}>
                    {(track) => {
                        const isLocal = track.participant.identity === room?.localParticipant?.identity
                        const isVideo = track.source === Track.Source.Camera

                        if (!isVideo) return <></>

                        return (
                            <div
                                key={track.participant.identity}
                                style={{
                                    position: isLocal ? 'absolute' : 'relative',
                                    width: isLocal ? '200px' : '100%',
                                    height: isLocal ? '150px' : '100%',
                                    bottom: isLocal ? '120px' : 'auto',
                                    right: isLocal ? '20px' : 'auto',
                                    border: isLocal ? '2px solid #fff' : 'none',
                                    borderRadius: isLocal ? '8px' : '0',
                                    overflow: 'hidden',
                                    zIndex: isLocal ? 50 : 10,
                                }}
                            >
                                <VideoTrack
                                    trackRef={track}
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                />
                            </div>
                        )
                    }}
                </TrackLoop>

                {/* 音频渲染 */}
                <RoomAudioRenderer />
            </div>

            {/* 控制栏 */}
            <div
                className="no-drag"
                style={{
                    position: 'absolute',
                    bottom: 30,
                    width: '100%',
                    display: 'flex',
                    justifyContent: 'center',
                    zIndex: 100,
                }}
            >
                <Space size={30}>
                    {/* 使用LiveKit的ControlBar */}
                    <ControlBar
                        controls={{
                            microphone: true,
                            camera: true,
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
                        icon={<PhoneOutlined rotate={135} />}
                        size="large"
                        onClick={onHangup}
                        style={{ width: 64, height: 64, fontSize: 24 }}
                    />
                </Space>
            </div>
        </div>
    )
}

/**
 * 主视频通话页面组件
 */
const VideoCallPageWithComponents: React.FC = () => {
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
    const [token, setToken] = useState<string>('')
    const [roomName, setRoomName] = useState<string>('')

    useEffect(() => {
        window.electron.ipcRenderer.invoke('get-login-user').then((result: any) => {
            setUser(result)
        })
    }, [])

    useEffect(() => {
        if (!user?.id) return
        if (receiverId) {
            setCallStatus('caller-waiting')
            initCall()
        } else {
            setCallStatus('callee-waiting')
        }
    }, [receiverId, user?.id])

    const initCall = async () => {
        if (!user?.id) return

        const room: string = receiverId ? `${receiverId}-${user.id}` : (roomParam || '')
        if (!room) {
            message.error('房间参数无效')
            return
        }

        try {
            setCallStatus('connecting')
            const tokenParams: Record<string, any> = {
                identity: user.id.toString(),
                room: room,
                type: 'VIDEO',
            }
            if (receiverId) tokenParams.receiverId = receiverId

            const response = (await createToken(tokenParams as any)) as any
            setToken(response.data.token)
            setRoomName(room)
        } catch (err: any) {
            console.error('获取token失败:', err)
            message.error('连接失败: ' + err.message)
        }
    }

    const handleAccept = () => {
        initCall()
    }

    const handleReject = () => {
        message.info('已拒绝通话')
        setTimeout(() => window.close(), 800)
    }

    const handleHangup = () => {
        setCallStatus('ended')
        message.info('通话已结束')
        setTimeout(() => window.close(), 1000)
    }

    const handleError = (error: Error) => {
        console.error('LiveKit错误:', error)
        message.error('连接失败: ' + error.message)
    }

    const renderWaitingUI = (
        avatar?: string,
        name?: string,
        id?: string,
        infoText?: string
    ) => (
        <div
            style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
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
        </div>
    )

    // 等待接听界面
    if (callStatus === 'callee-waiting') {
        return (
            <div className="drag" style={{ width: '100vw', height: '100vh' }}>
                {renderWaitingUI(senderAvatar || undefined, senderName || '', senderId || '', text || '')}
                <div
                    className="no-drag"
                    style={{
                        position: 'absolute',
                        bottom: 30,
                        width: '100%',
                        display: 'flex',
                        justifyContent: 'center',
                    }}
                >
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
                </div>
            </div>
        )
    }

    // 主叫等待界面
    if ((callStatus === 'caller-waiting' || callStatus === 'connecting') && !token) {
        return (
            <div className="drag" style={{ width: '100vw', height: '100vh' }}>
                {renderWaitingUI(
                    receiverAvatar || undefined,
                    receiverName || '',
                    receiverId || '',
                    '等待对方接入..'
                )}
                <div
                    className="no-drag"
                    style={{
                        position: 'absolute',
                        bottom: 30,
                        width: '100%',
                        display: 'flex',
                        justifyContent: 'center',
                    }}
                >
                    <Button
                        type="primary"
                        danger
                        shape="circle"
                        icon={<CloseOutlined />}
                        size="large"
                        onClick={handleReject}
                    />
                </div>
            </div>
        )
    }

    // 有token后,使用LiveKitRoom组件
    if (token && roomName) {
        return (
            <div className="drag">
                <LiveKitRoom
                    serverUrl="ws://localhost:7880"
                    token={token}
                    connect={true}
                    audio={true}
                    video={true}
                    onError={handleError}
                    onDisconnected={handleHangup}
                    options={{
                        adaptiveStream: true,
                        dynacast: true,
                    }}
                    style={{ height: '100vh' }}
                >
                    <VideoCallContent
                        callStatus={callStatus}
                        setCallStatus={setCallStatus}
                        receiverId={receiverId}
                        onHangup={handleHangup}
                    />
                </LiveKitRoom>
            </div>
        )
    }

    return null
}

export default VideoCallPageWithComponents