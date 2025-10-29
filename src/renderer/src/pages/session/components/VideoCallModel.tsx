import React, { useEffect, useRef, useState } from 'react'
import { Modal, Button, Space, Avatar, Typography, Flex, message, Tag } from 'antd'
import {
    PhoneOutlined,
    AudioMutedOutlined,
    AudioOutlined,
    VideoCameraOutlined,
    VideoCameraAddOutlined,
    FullscreenOutlined,
    SwapOutlined,
    CloseOutlined
} from '@ant-design/icons'
import { useUserStore } from '@renderer/store/useUserStore'
import './styles/VideoCallModal.css'

const { Text } = Typography

/**
 * 视频通话弹窗组件属性
 */
interface VideoCallModalProps {
    visible: boolean // 是否显示弹窗
    onCancel: () => void // 取消/关闭回调
    receiverId: string // 接收方ID
}

/**
 * 视频通话弹窗组件
 * 支持发起视频通话、音视频切换、全屏等功能
 */
const VideoCallModal: React.FC<VideoCallModalProps> = ({ visible, onCancel, receiverId }) => {
    // ========== 状态管理 ==========
    const user = useUserStore((state) => state.user) // 当前用户信息
    const [callStatus, setCallStatus] = useState<'calling' | 'connected' | 'ended'>('calling') // 通话状态
    const [isMuted, setIsMuted] = useState(false) // 是否静音
    const [isVideoEnabled, setIsVideoEnabled] = useState(true) // 是否开启视频
    const [callDuration, setCallDuration] = useState(0) // 通话时长（秒）
    const [receiverInfo, setReceiverInfo] = useState<any>(null) // 接收方信息
    const [isFullscreen, setIsFullscreen] = useState(false) // 是否全屏

    // ========== 视频流引用 ==========
    const localVideoRef = useRef<HTMLVideoElement>(null) // 本地视频流
    const remoteVideoRef = useRef<HTMLVideoElement>(null) // 远程视频流
    const timerRef = useRef<NodeJS.Timeout | null>(null) // 计时器引用

    /**
     * 格式化通话时长
     * @param seconds 秒数
     * @returns 格式化后的时间字符串 (mm:ss)
     */
    const formatDuration = (seconds: number): string => {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }

    /**
     * 初始化视频流
     * 获取用户摄像头和麦克风权限
     */
    useEffect(() => {
        if (visible && isVideoEnabled) {
            // 请求访问摄像头和麦克风
            navigator.mediaDevices
                .getUserMedia({ video: true, audio: true })
                .then((stream) => {
                    if (localVideoRef.current) {
                        localVideoRef.current.srcObject = stream
                    }
                })
                .catch((err) => {
                    console.error('无法访问摄像头/麦克风:', err)
                    message.error('无法访问摄像头或麦克风，请检查权限设置')
                })
        }

        return () => {
            // 组件卸载时停止所有媒体流
            if (localVideoRef.current?.srcObject) {
                const stream = localVideoRef.current.srcObject as MediaStream
                stream.getTracks().forEach((track) => track.stop())
            }
        }
    }, [visible, isVideoEnabled])

    /**
     * 通话计时器
     * 当通话连接后开始计时
     */
    useEffect(() => {
        if (callStatus === 'connected') {
            timerRef.current = setInterval(() => {
                setCallDuration((prev) => prev + 1)
            }, 1000)
        } else {
            if (timerRef.current) {
                clearInterval(timerRef.current)
                timerRef.current = null
            }
        }

        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current)
            }
        }
    }, [callStatus])

    /**
     * 模拟接通（实际项目中应通过WebRTC信令服务器处理）
     */
    useEffect(() => {
        if (visible && callStatus === 'calling') {
            // 模拟3秒后接通
            const timer = setTimeout(() => {
                setCallStatus('connected')
                message.success('通话已接通')
            }, 3000)

            return () => clearTimeout(timer)
        }
    }, [visible, callStatus])

    /**
     * 切换静音状态
     */
    const toggleMute = () => {
        if (localVideoRef.current?.srcObject) {
            const stream = localVideoRef.current.srcObject as MediaStream
            const audioTrack = stream.getAudioTracks()[0]
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled
                setIsMuted(!audioTrack.enabled)
            }
        }
    }

    /**
     * 切换视频开关
     */
    const toggleVideo = () => {
        if (localVideoRef.current?.srcObject) {
            const stream = localVideoRef.current.srcObject as MediaStream
            const videoTrack = stream.getVideoTracks()[0]
            if (videoTrack) {
                videoTrack.enabled = !videoTrack.enabled
                setIsVideoEnabled(videoTrack.enabled)
            }
        }
    }

    /**
     * 切换全屏模式
     */
    const toggleFullscreen = () => {
        setIsFullscreen(!isFullscreen)
    }

    /**
     * 挂断通话
     */
    const handleHangup = () => {
        setCallStatus('ended')
        setCallDuration(0)

        // 停止所有媒体流
        if (localVideoRef.current?.srcObject) {
            const stream = localVideoRef.current.srcObject as MediaStream
            stream.getTracks().forEach((track) => track.stop())
        }

        message.info('通话已结束')
        onCancel()
    }

    /**
     * 切换摄像头（前后摄像头切换）
     */
    const switchCamera = () => {
        message.info('切换摄像头功能开发中...')
        // 实际实现需要枚举设备并重新获取流
    }

    return (
        <Modal
            open={visible}
            onCancel={handleHangup}
            footer={null}
            width={isFullscreen ? '100vw' : 800}
            style={isFullscreen ? { top: 0, maxWidth: '100vw', padding: 0 } : {}}
            bodyStyle={
                isFullscreen
                    ? { height: '100vh', padding: 0 }
                    : { height: 600, padding: 0, position: 'relative' }
            }
            closable={false}
            className="video-call-modal"
        >
            <div
                style={{
                    width: '100%',
                    height: '100%',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    position: 'relative',
                    overflow: 'hidden'
                }}
            >
                {/* 远程视频画面（大画面） */}
                <div
                    style={{
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: '#000'
                    }}
                >
                    {callStatus === 'connected' ? (
                        <video
                            ref={remoteVideoRef}
                            autoPlay
                            playsInline
                            style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover'
                            }}
                        />
                    ) : (
                        // 呼叫中显示对方头像
                        <Flex vertical align="center" gap={24}>
                            <Avatar size={120} src={receiverInfo?.avatar} style={{ border: '4px solid #fff' }}>
                                {receiverInfo?.name?.[0] || 'U'}
                            </Avatar>
                            <Text style={{ color: '#fff', fontSize: 24, fontWeight: 500 }}>
                                {receiverInfo?.name || '对方'}
                            </Text>
                            <Tag color="processing" style={{ fontSize: 16, padding: '6px 16px' }}>
                                {callStatus === 'calling' ? '呼叫中...' : '通话已结束'}
                            </Tag>
                        </Flex>
                    )}
                </div>

                {/* 本地视频画面（小画面-右上角） */}
                {isVideoEnabled && (
                    <div
                        style={{
                            position: 'absolute',
                            top: 20,
                            right: 20,
                            width: isFullscreen ? 240 : 180,
                            height: isFullscreen ? 180 : 135,
                            borderRadius: 12,
                            overflow: 'hidden',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                            border: '2px solid rgba(255,255,255,0.3)',
                            background: '#000'
                        }}
                    >
                        <video
                            ref={localVideoRef}
                            autoPlay
                            playsInline
                            muted
                            style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                                transform: 'scaleX(-1)' // 镜像显示
                            }}
                        />
                    </div>
                )}

                {/* 顶部信息栏 */}
                <div
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        padding: '16px 24px',
                        background: 'linear-gradient(180deg, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0) 100%)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}
                >
                    <Space size={12}>
                        <Avatar size={40} src={receiverInfo?.avatar}>
                            {receiverInfo?.name?.[0] || 'U'}
                        </Avatar>
                        <Flex vertical gap={2}>
                            <Text strong style={{ color: '#fff', fontSize: 16 }}>
                                {receiverInfo?.name || '对方'}
                            </Text>
                            {callStatus === 'connected' && (
                                <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12 }}>
                                    {formatDuration(callDuration)}
                                </Text>
                            )}
                        </Flex>
                    </Space>

                    {/* 通话状态标签 */}
                    {callStatus === 'connected' && (
                        <Tag color="success" style={{ marginRight: 0 }}>
                            通话中
                        </Tag>
                    )}
                </div>

                {/* 底部控制栏 */}
                <div
                    style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        padding: '24px',
                        background: 'linear-gradient(0deg, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0) 100%)',
                        display: 'flex',
                        justifyContent: 'center'
                    }}
                >
                    <Space size={16}>
                        {/* 静音按钮 */}
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
                                border: 'none'
                            }}
                            title={isMuted ? '取消静音' : '静音'}
                        />

                        {/* 视频开关按钮 */}
                        <Button
                            type={!isVideoEnabled ? 'primary' : 'default'}
                            danger={!isVideoEnabled}
                            shape="circle"
                            size="large"
                            icon={isVideoEnabled ? <VideoCameraOutlined /> : <VideoCameraAddOutlined />}
                            onClick={toggleVideo}
                            style={{
                                width: 56,
                                height: 56,
                                fontSize: 22,
                                background: !isVideoEnabled ? '#ff4d4f' : 'rgba(255,255,255,0.9)',
                                border: 'none'
                            }}
                            title={isVideoEnabled ? '关闭视频' : '开启视频'}
                        />

                        {/* 挂断按钮 */}
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
                                fontSize: 24,
                                background: '#ff4d4f',
                                border: 'none'
                            }}
                            title="挂断"
                        />

                        {/* 切换摄像头按钮 */}
                        <Button
                            shape="circle"
                            size="large"
                            icon={<SwapOutlined />}
                            onClick={switchCamera}
                            style={{
                                width: 56,
                                height: 56,
                                fontSize: 22,
                                background: 'rgba(255,255,255,0.9)',
                                border: 'none'
                            }}
                            title="切换摄像头"
                        />

                        {/* 全屏按钮 */}
                        <Button
                            shape="circle"
                            size="large"
                            icon={isFullscreen ? <CloseOutlined /> : <FullscreenOutlined />}
                            onClick={toggleFullscreen}
                            style={{
                                width: 56,
                                height: 56,
                                fontSize: 22,
                                background: 'rgba(255,255,255,0.9)',
                                border: 'none'
                            }}
                            title={isFullscreen ? '退出全屏' : '全屏'}
                        />
                    </Space>
                </div>
            </div>
        </Modal>
    )
}

export default VideoCallModal