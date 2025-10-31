import {
    AudioMutedOutlined,
    AudioOutlined,
    CheckOutlined,
    CloseOutlined,
    PhoneOutlined,
} from '@ant-design/icons'
import { sendMsg } from '@renderer/api/chatApis'
import { createToken } from '@renderer/api/liveKitApis'
import { useUserStore } from '@renderer/store/useUserStore'
import { Snowflake } from '@renderer/utils/SnowflakeIdUtil'
import { Avatar, Button, message, Space, Spin, Tag, Typography } from 'antd'
import { RemoteParticipant, Room, RoomEvent } from 'livekit-client'
import React, { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'

const { Text } = Typography

type CallStatus = 'caller-waiting' | 'callee-waiting' | 'connected' | 'ended'

const AudioCallPage: React.FC = () => {
    const location = useLocation()
    const query = new URLSearchParams(location.search)
    const getParam = (key: string) => {
        const val = query.get(key)
        return val && val !== 'null' && val !== 'undefined' && val.trim() !== '' ? val : undefined
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
    const [callDuration, setCallDuration] = useState(0)

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

    const formatDuration = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`

    const initLiveKit = async () => {
        if (isConnectingRef.current || roomRef.current) return
        if (!user?.id) return

        const roomName: string | undefined = receiverId ? `${receiverId}-${user.id}` : roomParam
        if (!roomName) {
            message.error('房间参数无效,无法连接')
            return
        }

        isConnectingRef.current = true

        const room = new Room({
            adaptiveStream: false, // 语音通话不需要视频
        })
        roomRef.current = room

        try {
            room.on(RoomEvent.Connected, () => {
                console.log('✅ 已连接到房间')
                if (!receiverId) setCallStatus('connected')
                message.success('语音通话已接通')
            })

            room.on(RoomEvent.Disconnected, async () => {
                console.log('❌ 连接已断开')
                handleHangup()
                if (receiverId) {
                    await sendMsg({ messageId: Snowflake.nextId(), contactId: receiverId!, messageContent: "语音通话:" + formatDuration(callDuration), messageType: 27 })
                        .then(() => message.success('已结束通话'))
                        .catch((err) => message.error('结束通话失败: ' + err.message))
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
                setRemoteJoined(false)
                handleHangup()
            })

            const tokenParams: Record<string, any> = {
                identity: user.id.toString(),
                room: roomName,
                type: 'AUDIO',
            }
            if (receiverId) tokenParams.receiverId = receiverId

            const response = (await createToken(tokenParams as any)) as any
            const token = response.data.token

            await room.connect('ws://localhost:7880', token)
            console.log('🔗 已连接到房间')

            // 仅开启麦克风
            await room.localParticipant.setMicrophoneEnabled(true)

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

    useEffect(() => {
        if (callStatus === 'connected') {
            timerRef.current = setInterval(() => setCallDuration((v) => v + 1), 1000)
        } else if (timerRef.current) {
            clearInterval(timerRef.current)
        }
        return () => {
            if (timerRef.current) clearInterval(timerRef.current)
        }
    }, [callStatus])

    const renderWaitingUI = (avatar?: string, name?: string, id?: string, infoText?: string) => (
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
            <div
                style={{
                    position: 'relative',
                    width: 150,
                    height: 200,
                }}
            >
                {infoText == undefined &&
                    <>
                        <span className="ripple" />
                        <span className="ripple" />
                        <span className="ripple" />
                    </>}
                <Avatar size={100} src={avatar || ''} style={{
                    marginBottom: 20,
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    border: '3px solid #0624a7ff',
                    boxSizing: 'border-box',
                }} />
            </div>
            <Text style={{ fontSize: 24, marginBottom: 8, color: '#fff' }}>
                {name || '对方'} {id && <Text style={{ opacity: 0.7, color: '#fff' }}>ID: {id}</Text>}
            </Text>
            {infoText && (
                <Text style={{ opacity: 0.7, fontStyle: 'italic', marginBottom: 12, color: '#fff' }}>
                    {infoText}
                </Text>
            )}
            {infoText != undefined && <Spin size="large" />}
        </div>
    )

    return (
        <div
            className="drag"
            style={{
                width: '100vw',
                height: '100vh',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
            }}
        >
            {(callStatus === 'caller-waiting' || callStatus === 'callee-waiting') &&
                renderWaitingUI(
                    callStatus === 'callee-waiting' ? senderAvatar : receiverAvatar,
                    callStatus === 'callee-waiting' ? senderName : receiverName,
                    callStatus === 'callee-waiting' ? senderId : receiverId,
                    callStatus === 'caller-waiting' ? '等待对方接入..' : text || ''
                )}
            {(callStatus === 'connected') &&
                renderWaitingUI(
                    !receiverId ? senderAvatar : receiverAvatar,
                    !receiverId ? senderName : receiverName,
                    !receiverId ? senderId : receiverId,
                )}
            <Tag
                color={callStatus === 'connected' ? 'success' : callStatus === 'caller-waiting' || callStatus === 'callee-waiting' ? 'warning' : 'default'}
                style={{ position: 'absolute', top: 20, left: 20 }}
            >
                {callStatus === 'connected' ? formatDuration(callDuration) : callStatus === 'caller-waiting' ? '等待接听' : callStatus === 'callee-waiting' ? '待加入' : '已结束'}
            </Tag>

            {callStatus !== 'ended' && (
                <div
                    className='no-drag'
                    style={{
                        position: 'absolute',
                        bottom: 50,
                        display: 'flex',
                        justifyContent: 'center',
                        gap: 30,
                    }}
                >
                    {callStatus === 'callee-waiting' ? (
                        <Space size={40}>
                            <Button type="primary" danger shape="circle" icon={<CloseOutlined />} size="large" onClick={handleReject} />
                            <Button type="primary" shape="circle" icon={<CheckOutlined />} size="large" onClick={handleAccept} style={{ background: '#52c41a', borderColor: '#52c41a' }} />
                        </Space>
                    ) : (
                        <Space size={30}>
                            <Button shape="circle" icon={isMuted ? <AudioMutedOutlined /> : <AudioOutlined />} size="large" onClick={toggleMute} type={isMuted ? 'primary' : 'default'} danger={isMuted} />
                            <Button type="primary" danger shape="circle" icon={<PhoneOutlined rotate={135} />} size="large" onClick={handleHangup} />
                        </Space>
                    )}
                </div>
            )}
        </div>
    )
}

export default AudioCallPage
