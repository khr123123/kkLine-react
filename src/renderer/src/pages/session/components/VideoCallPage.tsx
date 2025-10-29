import React, { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Button, Space, Typography, message, Tag } from 'antd'
import {
    PhoneOutlined,
    AudioMutedOutlined,
    AudioOutlined,
    VideoCameraOutlined,
    VideoCameraAddOutlined,
    FullscreenOutlined,
    FullscreenExitOutlined,
    CheckOutlined,
    CloseOutlined
} from '@ant-design/icons'
import { useUserStore } from '@renderer/store/useUserStore'
import { Room, RoomEvent, RemoteTrack, Track, LocalVideoTrack, LocalAudioTrack } from 'livekit-client'
import { createToken } from '@renderer/api/liveKitApis'

const { Text } = Typography

const VideoCallModal: React.FC = () => {
    const location = useLocation()
    const query = new URLSearchParams(location.search)
    const receiverId = query.get('receiverId')
    const roomParam = query.get('room')
    const senderName = query.get('senderName')
    const senderAvatar = query.get('senderAvatar')
    const text = query.get('text')

    const { user, setUser } = useUserStore()
    const [isCaller, setIsCaller] = useState(false)
    const [callStatus, setCallStatus] = useState<'calling' | 'waiting' | 'connected' | 'ended'>('waiting')
    const [isMuted, setIsMuted] = useState(false)
    const [isVideoEnabled, setIsVideoEnabled] = useState(true)
    const [callDuration, setCallDuration] = useState(0)
    const [isFullscreen, setIsFullscreen] = useState(false)
    const [isConnecting, setIsConnecting] = useState(false)

    const localVideoRef = useRef<HTMLVideoElement>(null)
    const remoteVideoRef = useRef<HTMLVideoElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    const roomRef = useRef<Room | null>(null)
    const timerRef = useRef<NodeJS.Timeout | null>(null)
    const isConnectingRef = useRef(false)

    // 获取用户信息
    useEffect(() => {
        window.electron.ipcRenderer.invoke('get-login-user').then((result: any) => {
            setUser(result)
        })
    }, [])

    // 确定身份
    useEffect(() => {
        setIsCaller(!!receiverId)
        setCallStatus('calling')
    }, [receiverId])



    // 初始化 LiveKit
    const initLiveKit = async () => {
        if (isConnectingRef.current || roomRef.current) return
        // 修复房间名称判断逻辑
        if (!user?.id || (!roomParam && !receiverId)) {
            console.warn('❌ user.id 或 roomName 无效，无法连接')
            return
        }
        isConnectingRef.current = true
        setIsConnecting(true)
        try {
            const room = new Room({ adaptiveStream: true, dynacast: true })
            roomRef.current = room

            // 监听房间事件
            room.on(RoomEvent.Connected, () => {
                console.log('✅ 已连接到房间')
                setCallStatus('connected')
                message.success('视频通话已接通')
                setIsConnecting(false)
            })
            room.on(RoomEvent.Disconnected, () => {
                console.log('❌ 已断开连接')
                handleHangup()
            })
            room.on(RoomEvent.TrackSubscribed, (track: RemoteTrack) => {
                console.log('📹 收到远程轨道:', track.kind)
                if (track.kind === Track.Kind.Video && remoteVideoRef.current) {
                    track.attach(remoteVideoRef.current)
                    console.log('✅ 远程视频已附加到元素')
                } else if (track.kind === Track.Kind.Audio) {
                    track.attach()
                    console.log('🔊 远程音频已附加')
                }
            })
            room.on(RoomEvent.LocalTrackPublished, (publication) => {
                console.log('📹 本地轨道已发布:', publication.track?.kind)
                if (publication.track instanceof LocalVideoTrack && localVideoRef.current) {
                    publication.track.attach(localVideoRef.current)
                }
            })
            // 添加更多调试事件
            room.on(RoomEvent.ParticipantConnected, (participant) => {
                console.log('👤 参与者连接:', participant.identity)
            })
            room.on(RoomEvent.ParticipantDisconnected, (participant) => {
                console.log('👤 参与者断开:', participant.identity)
            })
            // 修复房间名称逻辑 - 确保双方进入同一房间
            let roomName: string
            if (receiverId && receiverId !== 'undefined') {
                // 主叫方：使用 receiverId + 自己的 ID 作为房间名
                roomName = receiverId + "-" + user.id
            } else if (roomParam) {
                // 被叫方：使用传入的房间名
                roomName = roomParam
            } else {
                throw new Error('无法确定房间名称')
            }

            // 获取 Token
            const tokenParams: Record<string, any> = {
                identity: user.id.toString(),
                room: roomName, // 使用统一的房间名
                type: 'VIDEO',
            }
            // 只有主叫方才传 receiverId
            if (receiverId && receiverId !== 'undefined') {
                tokenParams.receiverId = receiverId
            }
            const response = await createToken(tokenParams as any) as any
            const token = response.data.token
            console.log('🎫 Token:', token)
            console.log('🚀 房间名称:', roomName)
            console.log('👤 用户身份:', user.id)
            console.log('📞 是否是主叫方:', !!receiverId)
            // 连接房间
            await room.connect('ws://localhost:7880', token)
            console.log('✅ 房间连接成功')
            // 发布本地音视频 - 根据是否是主叫方选择不同摄像头
            if (receiverId && receiverId !== 'undefined') {
                // 主叫方：使用普通摄像头
                console.log('📹 主叫方：启用普通摄像头')
                await room.localParticipant.setCameraEnabled(true)
                await room.localParticipant.setMicrophoneEnabled(true)

            } else {
                // 被叫方：使用 OBS 虚拟摄像头
                console.log('📹 被叫方：启用 OBS 虚拟摄像头')
                try {
                    // 获取所有媒体设备
                    const devices = await navigator.mediaDevices.enumerateDevices()
                    console.log('📹 可用设备:', devices.map(d => ({ kind: d.kind, label: d.label })))
                    // 找到 OBS 虚拟摄像头
                    const videoDevice = devices.find(
                        (d) => d.kind === 'videoinput' && d.label.includes('OBS Virtual Camera')
                    )
                    if (!videoDevice) {
                        console.warn('❌ 未找到 OBS 虚拟摄像头，使用默认摄像头')
                        // 回退到默认摄像头
                        await room.localParticipant.setCameraEnabled(true)
                    } else {
                        console.log('✅ 找到 OBS 虚拟摄像头:', videoDevice.label)
                        // 获取 OBS 视频流 + 系统麦克风音频流
                        const stream = await navigator.mediaDevices.getUserMedia({
                            video: {
                                deviceId: { exact: videoDevice.deviceId },
                                width: { ideal: 1280 },
                                height: { ideal: 720 }
                            },
                            audio: true,
                        })
                        // 发布视频轨道
                        if (stream.getVideoTracks().length > 0) {
                            const videoTrack = stream.getVideoTracks()[0]
                            const localVideoTrack = new LocalVideoTrack(videoTrack)
                            await room.localParticipant.publishTrack(localVideoTrack)
                            console.log('✅ OBS 视频轨道已发布')
                            // 本地预览
                            if (localVideoRef.current) {
                                localVideoTrack.attach(localVideoRef.current)
                            }
                        }
                        // 发布音频轨道
                        if (stream.getAudioTracks().length > 0) {
                            const audioTrack = stream.getAudioTracks()[0]
                            const localAudioTrack = new LocalAudioTrack(audioTrack)
                            await room.localParticipant.publishTrack(localAudioTrack)
                            console.log('✅ 音频轨道已发布')
                        }
                    }
                    // 确保麦克风启用
                    await room.localParticipant.setMicrophoneEnabled(true)
                } catch (mediaError) {
                    console.error('❌ OBS 摄像头访问失败:', mediaError)
                    // 回退到普通摄像头
                    await room.localParticipant.setCameraEnabled(true)
                    await room.localParticipant.setMicrophoneEnabled(true)
                }
            }

            console.log("✅ 发布本地音视频完成")

            // 检查当前参与者
            console.log('👥 房间参与者:', Array.from(room.numParticipants.values()).map(p => p.identity))
            console.log('📹 本地视频轨道:', room.localParticipant.videoTrackPublications.size)
            console.log('🔊 本地音频轨道:', room.localParticipant.audioTrackPublications.size)

        } catch (err: any) {
            console.error('❌ LiveKit 初始化失败:', err)
            if (err.message.includes('NotAllowedError')) {
                message.error('请允许摄像头和麦克风访问')
            } else {
                message.error('连接失败: ' + err.message)
            }
            setIsConnecting(false)
        } finally {
            isConnectingRef.current = false
        }
    }

    // 自动发起连接（主叫）
    useEffect(() => {
        if (receiverId && receiverId !== 'undefined') {
            console.log("自动发起连接（主叫）");
            initLiveKit()
        } else {
            setCallStatus('waiting')
        }
    }, [receiverId, user?.id])

    const handleAccept = () => {
        initLiveKit()
    }

    const handleReject = () => {
        message.info('已拒绝通话')
        setTimeout(() => window.close(), 800)
    }

    const handleHangup = () => {
        if (roomRef.current) roomRef.current.disconnect()
        setCallStatus('ended')
        message.info('通话已结束')
        setTimeout(() => window.close(), 1000)
    }

    // 通话计时
    useEffect(() => {
        if (callStatus === 'connected') {
            timerRef.current = setInterval(() => setCallDuration((v) => v + 1), 1000)
        } else {
            if (timerRef.current) clearInterval(timerRef.current)
        }
        return () => {
            if (timerRef.current) clearInterval(timerRef.current)
        }
    }, [callStatus])

    const formatDuration = (s: number) =>
        `${Math.floor(s / 60)
            .toString()
            .padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`

    const toggleMute = async () => {
        if (roomRef.current) {
            const enable = !isMuted
            await roomRef.current.localParticipant.setMicrophoneEnabled(enable)
            setIsMuted(enable)
            message.info(enable ? '麦克风已开启' : '麦克风已静音')
        }
    }

    const toggleVideo = async () => {
        if (roomRef.current) {
            const enable = !isVideoEnabled
            await roomRef.current.localParticipant.setCameraEnabled(enable)
            setIsVideoEnabled(enable)
            message.info(enable ? '摄像头已开启' : '摄像头已关闭')
        }
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

    return (
        <>
            <div
                className='drag'
                ref={containerRef}
                style={{
                    width: '100vw',
                    height: '100vh',
                    background: '#000',
                    position: 'relative'
                }}
            >
                {/* 远程视频 */}
                {callStatus === 'connected' ? (
                    <>
                        {/* 远程视频 */}
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
                        {/* 本地视频 */}
                        <video
                            ref={localVideoRef}
                            autoPlay
                            playsInline
                            style={{
                                width: '200px',
                                height: '150px',
                                position: 'absolute',
                                bottom: '20px',
                                right: '20px',
                                border: '2px solid #fff',
                                borderRadius: '8px',
                                objectFit: 'cover',
                                background: '#000'
                            }}
                        />
                    </>

                ) : (
                    <div
                        style={{
                            width: '100%',
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#fff'
                        }}
                    >
                        <Text style={{ fontSize: 24, marginBottom: 8 }}>
                            {senderName || '对方'}
                        </Text>
                        <Text style={{ opacity: 0.8 }}>
                            {isCaller && callStatus === 'waiting'
                                ? '等待对方接听'
                                : !isCaller && callStatus === 'waiting'
                                    ? '邀请你视频通话'
                                    : isConnecting
                                        ? '正在连接...'
                                        : '正在呼叫...'}
                        </Text>
                    </div>
                )}

                {/* 状态 */}
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
                    style={{ position: 'absolute', top: 20, left: 20 }}
                >
                    {callStatus === 'connected'
                        ? formatDuration(callDuration)
                        : callStatus === 'waiting'
                            ? '等待接听'
                            : callStatus === 'calling'
                                ? '呼叫中'
                                : '已结束'}
                </Tag>

                {/* 控制按钮 */}
                <div
                    className='no-drag'
                    style={{
                        position: 'absolute',
                        bottom: 0,
                        width: '100%',
                        display: 'flex',
                        justifyContent: 'center',
                        paddingBottom: 30
                    }}
                >
                    {callStatus === 'waiting' ? (
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
                            />
                        </Space>
                    ) : (
                        <Space size={30}>
                            <Button
                                shape="circle"
                                icon={isMuted ? <AudioMutedOutlined /> : <AudioOutlined />}
                                size="large"
                                onClick={toggleMute}
                            />
                            <Button
                                shape="circle"
                                icon={isVideoEnabled ? <VideoCameraOutlined /> : <VideoCameraAddOutlined />}
                                size="large"
                                onClick={toggleVideo}
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
                    )}
                </div>
            </div>
        </>
    )
}

export default VideoCallModal
