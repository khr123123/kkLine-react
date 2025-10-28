import React, { useEffect, useRef, useState } from 'react';
import { Modal, Button, Avatar, Typography, Space, message, Spin } from 'antd';
import request from '@renderer/http/request';
import { PhoneOutlined, PhoneFilled } from '@ant-design/icons';

const { Text, Title } = Typography;

interface CallData {
    senderId: number;
    senderName: string;
    senderAvatar: string;
    text: string;
    sdp: string;
}

const IncomingCallModal: React.FC = () => {
    const [visible, setVisible] = useState(false);
    const [callData, setCallData] = useState<CallData | null>(null);
    const [loading, setLoading] = useState(false);

    const localVideoRef = useRef<HTMLVideoElement>(null);
    const remoteVideoRef = useRef<HTMLVideoElement>(null);
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);

    const peerConnectionRef = useRef<RTCPeerConnection | null>(null);

    // -------------------------------
    // 接收 offer 和远端 ICE
    // -------------------------------
    useEffect(() => {
        const handleOffer = (_: any, data: CallData) => {
            message.success("📞 收到视频/语音通话请求");
            console.log('收到视频/语音通话请求:', data);
            setCallData(data);
            setVisible(true);
        };

        const handleRemoteIce = (_: any, data: any) => {
            const pc = peerConnectionRef.current;
            if (data.candidate && pc) {
                try {
                    pc.addIceCandidate(new RTCIceCandidate(JSON.parse(data.candidate)));
                } catch (err) {
                    console.error('❌ 添加远程 ICE 失败', err);
                }
            }
        };

        window.electron.ipcRenderer.on('reviced-videoAudeo-offer', handleOffer);
        window.electron.ipcRenderer.on('reviced-videoAudeo-candidate', handleRemoteIce);

        return () => {
            window.electron.ipcRenderer.removeAllListeners('reviced-videoAudeo-offer');
            window.electron.ipcRenderer.removeAllListeners('reviced-videoAudeo-candidate');
        };
    }, []);

    // -------------------------------
    // 接听
    // -------------------------------
    const handleAccept = async () => {
        if (!callData) return;
        setLoading(true);

        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            const obsCamera = devices.find(
                d => d.kind === 'videoinput' && d.label.includes('OBS')
            );
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { deviceId: obsCamera!.deviceId },
                audio: true
            });
            setLocalStream(stream);

            // 本地视频显示
            if (localVideoRef.current) {
                localVideoRef.current.srcObject = stream;
                localVideoRef.current.muted = true;
                await localVideoRef.current.play().catch(() => { });
            }

            // 创建 RTCPeerConnection
            const pc = new RTCPeerConnection({
                iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
            });
            peerConnectionRef.current = pc;

            // 添加本地流
            stream.getTracks().forEach(track => pc.addTrack(track, stream));

            // ✅ 绑定远端视频流
            pc.ontrack = e => {
                remoteVideoRef.current!.srcObject = e.streams[0];
            };


            // 发送 ICE
            pc.onicecandidate = (event) => {
                if (event.candidate) {
                    request.post('/chatVideoAudio/sendIce', {
                        receiverId: callData.senderId,
                        candidate: JSON.stringify(event.candidate),
                        messageType: 'ice',
                        type: 'video',
                    });
                }
            };

            // 设置远端 offer
            await pc.setRemoteDescription({ type: 'offer', sdp: callData.sdp });

            // 创建 answer
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);

            // 发送 answer
            await request.post('/chatVideoAudio/sendAnswer', {
                receiverId: callData.senderId,
                sdp: answer.sdp,
                type: 'video',
                messageType: 'answer',
            });

            message.success('✅ 已接听通话');
        } catch (err) {
            console.error(err);
            message.error('接听通话失败，请检查摄像头或麦克风权限');
        } finally {
            setLoading(false);
        }
    };

    // -------------------------------
    // 挂断
    // -------------------------------
    const handleReject = () => {
        setVisible(false);
        message.info('📴 已挂断通话');

        const pc = peerConnectionRef.current;
        pc?.getSenders().forEach(s => s.track?.stop());
        pc?.close();
        peerConnectionRef.current = null;

        if (localStream) {
            localStream.getTracks().forEach(t => t.stop());
            setLocalStream(null);
        }

        if (localVideoRef.current) localVideoRef.current.srcObject = null;
        if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;

        setCallData(null);
    };

    return (
        <Modal open={visible} centered footer={null} closable={false}>
            <Spin spinning={loading}>
                {callData && (
                    <Space direction="vertical" size="large" style={{ width: '100%' }}>
                        <Avatar size={80} src={callData.senderAvatar} />
                        <Title level={4}>{callData.senderName}</Title>
                        <Text>{callData.text || '正在发起视频通话…'}</Text>

                        <div className="grid grid-cols-2 gap-4">
                            <video
                                ref={localVideoRef}
                                autoPlay
                                playsInline
                                muted
                                style={{ width: 200, backgroundColor: 'black', borderRadius: 10 }}
                            />
                            <video
                                id="remoteVideo"
                                ref={remoteVideoRef}
                                autoPlay
                                playsInline
                                style={{ width: 200, backgroundColor: 'black', borderRadius: 10 }}
                            />
                        </div>

                        <Space size="large" style={{ marginTop: 20 }}>
                            <Button
                                size="large"
                                type="primary"
                                shape="round"
                                icon={<PhoneOutlined />}
                                style={{ backgroundColor: '#52c41a', borderColor: '#52c41a', width: 100 }}
                                onClick={handleAccept}
                            >
                                接听
                            </Button>
                            <Button
                                size="large"
                                type="primary"
                                shape="round"
                                icon={<PhoneFilled />}
                                style={{ backgroundColor: '#f5222d', borderColor: '#f5222d', width: 100 }}
                                onClick={handleReject}
                            >
                                挂断
                            </Button>
                        </Space>
                    </Space>
                )}
            </Spin>
        </Modal>
    );
};

export default IncomingCallModal;
