import React, { useEffect, useRef, useState } from "react";
import { Modal, Button, message, Spin } from "antd";
import request from "@renderer/http/request";

interface VideoCallModalProps {
    visible: boolean;
    onCancel: () => void;
    receiverId: string;
    type?: "video" | "audio";
}

const VideoCallModal: React.FC<VideoCallModalProps> = ({
    visible,
    onCancel,
    receiverId,
    type = "video",
}) => {
    const localVideoRef = useRef<HTMLVideoElement>(null);
    const remoteVideoRef = useRef<HTMLVideoElement>(null);
    const [loading, setLoading] = useState(false);
    const [peerConnection, setPeerConnection] = useState<RTCPeerConnection | null>(null);
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);

    useEffect(() => {
        if (visible) {
            initLocalStream();
        } else {
            hangUp();
        }
    }, [visible]);

    const initLocalStream = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: type === "video",
                audio: true,
            });
            if (localVideoRef.current) localVideoRef.current.srcObject = stream;
            setLocalStream(stream);

            const pc = new RTCPeerConnection({
                iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
            });

            // 添加本地轨道
            stream.getTracks().forEach(track => pc.addTrack(track, stream));

            // 调试：监听远程 track
            pc.ontrack = e => {
                console.log("Remote tracks received:", e.streams);
                if (remoteVideoRef.current && e.streams.length > 0) {
                    remoteVideoRef.current.srcObject = e.streams[0];
                }
            };

            // ICE candidate
            pc.onicecandidate = event => {
                console.log("Local ICE candidate:", event.candidate);
                if (event.candidate) sendIceCandidate(event.candidate);
            };

            // ICE connection 状态调试
            pc.oniceconnectionstatechange = () => {
                console.log("ICE connection state:", pc.iceConnectionState);
            };

            setPeerConnection(pc);

            // 创建 offer
            await createOffer(pc);
        } catch (err) {
            console.error(err);
            message.error("无法访问摄像头或麦克风");
        }
    };

    const createOffer = async (pc: RTCPeerConnection) => {
        setLoading(true);
        try {
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);

            await request.post("/chatVideoAudio/sendOffer", {
                receiverId,
                type,
                messageType: "offer",
                sdp: offer.sdp,
            });
            message.success("已发送视频通话请求");
        } catch (err) {
            console.error(err);
            message.error("创建 Offer 失败");
        } finally {
            setLoading(false);
        }
    };

    const sendIceCandidate = async (candidate: RTCIceCandidate) => {
        await request.post("/chatVideoAudio/sendIce", {
            receiverId,
            type,
            messageType: "ice",
            candidate: JSON.stringify(candidate),
        });
    };

    // 接收 answer & remote ICE
    useEffect(() => {
        const handleAnswer = async (_: any, data: any) => {
            console.log("Received remote answer:", data);
            if (data.sdp && peerConnection) {
                try {
                    await peerConnection.setRemoteDescription(
                        new RTCSessionDescription({ type: "answer", sdp: data.sdp })
                    );
                    message.success("通话已建立");
                } catch (err) {
                    console.error("设置远端 SDP 失败", err);
                }
            }
        };

        const handleRemoteIce = async (_: any, data: any) => {
            console.log("Received remote ICE candidate:", data);
            if (data.candidate && peerConnection) {
                try {
                    await peerConnection.addIceCandidate(
                        new RTCIceCandidate(JSON.parse(data.candidate))
                    );
                } catch (err) {
                    console.error("添加远程 ICE 失败", err);
                }
            }
        };

        window.electron.ipcRenderer.on("reviced-videoAudeo-answer", handleAnswer);
        window.electron.ipcRenderer.on("reviced-videoAudeo-candidate", handleRemoteIce);

        return () => {
            window.electron.ipcRenderer.removeAllListeners("reviced-videoAudeo-answer");
            window.electron.ipcRenderer.removeAllListeners("reviced-videoAudeo-candidate");
        };
    }, [peerConnection]);

    const hangUp = () => {
        peerConnection?.getSenders().forEach(sender => sender.track?.stop());
        peerConnection?.close();
        setPeerConnection(null);

        if (localStream) {
            localStream.getTracks().forEach(t => t.stop());
            setLocalStream(null);
        }

        if (localVideoRef.current?.srcObject) localVideoRef.current.srcObject = null;
        if (remoteVideoRef.current?.srcObject) remoteVideoRef.current.srcObject = null;

        onCancel();
    };

    return (
        <Modal
            title="视频通话"
            open={visible}
            onCancel={hangUp}
            footer={[
                <Button key="hangup" danger onClick={hangUp}>
                    挂断
                </Button>,
            ]}
            width={800}
            centered
        >
            <Spin spinning={loading}>
                <div className="grid grid-cols-2 gap-4">
                    <video
                        ref={localVideoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full rounded-xl shadow"
                        style={{ width: 200, backgroundColor: 'black', borderRadius: 10 }}

                    />
                    <video
                        ref={remoteVideoRef}
                        autoPlay
                        playsInline
                        controls
                        className="w-full rounded-xl shadow"
                        style={{ width: 200, backgroundColor: 'black', borderRadius: 10 }}

                    />
                </div>
            </Spin>
        </Modal>
    );
};

export default VideoCallModal;
