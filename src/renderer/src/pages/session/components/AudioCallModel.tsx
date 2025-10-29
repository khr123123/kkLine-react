import React, { useEffect, useRef, useState } from 'react'
import { Modal, Button, Space, Avatar, Typography, Flex, message, Tag } from 'antd'
import {
    PhoneOutlined,
    AudioMutedOutlined,
    AudioOutlined,
    SoundOutlined,
    CustomerServiceOutlined
} from '@ant-design/icons'
import { useUserStore } from '@renderer/store/useUserStore'
import './styles/AudioCallModal.css'

const { Text, Title } = Typography

/**
 * 语音通话弹窗组件属性
 */
interface AudioCallModalProps {
    visible: boolean // 是否显示弹窗
    onCancel: () => void // 取消/关闭回调
    receiverId: string // 接收方ID
}

/**
 * 语音通话弹窗组件
 * 支持发起语音通话、静音、免提等功能
 */
const AudioCallModal: React.FC<AudioCallModalProps> = ({ visible, onCancel, receiverId }) => {
    // ========== 状态管理 ==========
    const user = useUserStore((state) => state.user) // 当前用户信息
    const [callStatus, setCallStatus] = useState<'calling' | 'connected' | 'ended'>('calling') // 通话状态
    const [isMuted, setIsMuted] = useState(false) // 是否静音
    const [isSpeakerOn, setIsSpeakerOn] = useState(false) // 是否开启免提
    const [callDuration, setCallDuration] = useState(0) // 通话时长（秒）
    const [receiverInfo, setReceiverInfo] = useState<any>(null) // 接收方信息

    // ========== 音频流引用 ==========
    const localAudioRef = useRef<MediaStream | null>(null) // 本地音频流
    const remoteAudioRef = useRef<HTMLAudioElement>(null) // 远程音频元素
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
     * 初始化音频流
     * 获取用户麦克风权限
     */
    useEffect(() => {
        if (visible) {
            // 请求访问麦克风
            navigator.mediaDevices
                .getUserMedia({ audio: true })
                .then((stream) => {
                    localAudioRef.current = stream
                })
                .catch((err) => {
                    console.error('无法访问麦克风:', err)
                    message.error('无法访问麦克风，请检查权限设置')
                })
        }

        return () => {
            // 组件卸载时停止所有媒体流
            if (localAudioRef.current) {
                localAudioRef.current.getTracks().forEach((track) => track.stop())
            }
        }
    }, [visible])

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
        if (localAudioRef.current) {
            const audioTrack = localAudioRef.current.getAudioTracks()[0]
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled
                setIsMuted(!audioTrack.enabled)
            }
        }
    }

    /**
     * 切换免提状态
     */
    const toggleSpeaker = () => {
        setIsSpeakerOn(!isSpeakerOn)
        message.info(isSpeakerOn ? '免提已关闭' : '免提已开启')
    }

    /**
     * 挂断通话
     */
    const handleHangup = () => {
        setCallStatus('ended')
        setCallDuration(0)

        // 停止所有媒体流
        if (localAudioRef.current) {
            localAudioRef.current.getTracks().forEach((track) => track.stop())
        }

        message.info('通话已结束')
        onCancel()
    }

    /**
     * 获取通话状态的显示文本
     */
    const getStatusText = () => {
        switch (callStatus) {
            case 'calling':
                return '呼叫中...'
            case 'connected':
                return formatDuration(callDuration)
            case 'ended':
                return '通话已结束'
            default:
                return ''
        }
    }

    /**
     * 获取通话状态的标签颜色
     */
    const getStatusTagColor = () => {
        switch (callStatus) {
            case 'calling':
                return 'processing'
            case 'connected':
                return 'success'
            case 'ended':
                return 'default'
            default:
                return 'default'
        }
    }

    return (
        <Modal
            open={visible}
            onCancel={handleHangup}
            footer={null}
            width={400}
            bodyStyle={{
                height: 550,
                padding: 0,
                position: 'relative',
                overflow: 'hidden'
            }}
            closable={false}
            className="audio-call-modal"
        >
            <div
                style={{
                    width: '100%',
                    height: '100%',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '48px 32px 32px'
                }}
            >
                {/* 顶部状态标签 */}
                <Tag
                    color={getStatusTagColor()}
                    style={{
                        fontSize: 14,
                        padding: '6px 20px',
                        borderRadius: 20,
                        border: 'none'
                    }}
                >
                    {callStatus === 'calling' && '正在呼叫'}
                    {callStatus === 'connected' && '通话中'}
                    {callStatus === 'ended' && '已结束'}
                </Tag>

                {/* 中间内容区域 */}
                <Flex vertical align="center" gap={32} style={{ flex: 1, justifyContent: 'center' }}>
                    {/* 对方头像 */}
                    <div style={{ position: 'relative' }}>
                        <Avatar
                            size={140}
                            src={receiverInfo?.avatar}
                            style={{
                                border: '6px solid rgba(255,255,255,0.3)',
                                boxShadow: '0 8px 24px rgba(0,0,0,0.2)'
                            }}
                        >
                            {receiverInfo?.name?.[0] || 'U'}
                        </Avatar>

                        {/* 通话连接时的呼吸动画圆环 */}
                        {callStatus === 'connected' && (
                            <>
                                <div
                                    className="pulse-ring"
                                    style={{
                                        position: 'absolute',
                                        top: -8,
                                        left: -8,
                                        right: -8,
                                        bottom: -8,
                                        border: '3px solid rgba(255,255,255,0.5)',
                                        borderRadius: '50%',
                                        animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
                                    }}
                                />
                                <div
                                    className="pulse-ring"
                                    style={{
                                        position: 'absolute',
                                        top: -8,
                                        left: -8,
                                        right: -8,
                                        bottom: -8,
                                        border: '3px solid rgba(255,255,255,0.5)',
                                        borderRadius: '50%',
                                        animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                                        animationDelay: '1s'
                                    }}
                                />
                            </>
                        )}
                    </div>

                    {/* 对方名称 */}
                    <Flex vertical align="center" gap={8}>
                        <Title level={2} style={{ color: '#fff', margin: 0, fontWeight: 600 }}>
                            {receiverInfo?.name || '对方'}
                        </Title>
                        <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 18 }}>
                            {getStatusText()}
                        </Text>
                    </Flex>

                    {/* 状态指示器 */}
                    <Space size={16}>
                        {isMuted && (
                            <Tag
                                color="error"
                                icon={<AudioMutedOutlined />}
                                style={{ fontSize: 13, padding: '4px 12px' }}
                            >
                                静音中
                            </Tag>
                        )}
                        {isSpeakerOn && (
                            <Tag
                                color="warning"
                                icon={<SoundOutlined />}
                                style={{ fontSize: 13, padding: '4px 12px' }}
                            >
                                免提
                            </Tag>
                        )}
                    </Space>
                </Flex>

                {/* 底部控制按钮 */}
                <Space size={20} style={{ marginTop: 32 }}>
                    {/* 静音按钮 */}
                    <Flex vertical align="center" gap={8}>
                        <Button
                            type={isMuted ? 'primary' : 'default'}
                            danger={isMuted}
                            shape="circle"
                            size="large"
                            icon={isMuted ? <AudioMutedOutlined /> : <AudioOutlined />}
                            onClick={toggleMute}
                            style={{
                                width: 64,
                                height: 64,
                                fontSize: 24,
                                background: isMuted ? '#ff4d4f' : 'rgba(255,255,255,0.9)',
                                border: 'none',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                            }}
                        />
                        <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 12 }}>
                            {isMuted ? '取消静音' : '静音'}
                        </Text>
                    </Flex>

                    {/* 挂断按钮 */}
                    <Flex vertical align="center" gap={8}>
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
                                background: '#ff4d4f',
                                border: 'none',
                                boxShadow: '0 6px 16px rgba(255,77,79,0.4)'
                            }}
                        />
                        <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 12 }}>挂断</Text>
                    </Flex>

                    {/* 免提按钮 */}
                    <Flex vertical align="center" gap={8}>
                        <Button
                            type={isSpeakerOn ? 'primary' : 'default'}
                            shape="circle"
                            size="large"
                            icon={isSpeakerOn ? <SoundOutlined /> : <CustomerServiceOutlined />}
                            onClick={toggleSpeaker}
                            style={{
                                width: 64,
                                height: 64,
                                fontSize: 24,
                                background: isSpeakerOn
                                    ? 'rgba(24, 144, 255, 0.9)'
                                    : 'rgba(255,255,255,0.9)',
                                color: isSpeakerOn ? '#fff' : 'rgba(0,0,0,0.85)',
                                border: 'none',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                            }}
                        />
                        <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 12 }}>
                            {isSpeakerOn ? '关闭免提' : '免提'}
                        </Text>
                    </Flex>
                </Space>

                {/* 远程音频元素（隐藏） */}
                <audio ref={remoteAudioRef} autoPlay style={{ display: 'none' }} />
            </div>
        </Modal>
    )
}

export default AudioCallModal