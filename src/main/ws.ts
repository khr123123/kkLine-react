import WebSocket from 'ws'
import { MessageType } from './common/messageType'
import type { MessageSendDTO, InitMessageDTO } from './common/messageType'
interface LoginUser {
    token: string
    id: string | number
}

let ws: WebSocket | null = null
let wsUrl: string | null = null
let mainWindow: Electron.BrowserWindow | null = null

let needReconnect = true // Whether reconnection is needed
let maxRetryCount = 5 // Maximum number of retries
let retryCount = 0 // Current retry attempt
let userId: string | number | null = null

// Initialize WebSocket with user login info and the Electron main window
export const initWs = (loginUser: LoginUser, _mainWindow: Electron.BrowserWindow) => {
    mainWindow = _mainWindow
    const token = loginUser.token
    userId = loginUser.id
    console.log(`👤 当前用户Current User是: ${userId},token为: ${token}`);
    wsUrl = `ws://127.0.0.1:8081/ws?token=${token}`
    needReconnect = true
    maxRetryCount = 5
    retryCount = 0
    createWs(wsUrl)
}

// Create the WebSocket connection
export const createWs = (url: string) => {
    if (!url) return
    ws = new WebSocket(url)

    // Connection opened
    ws.onopen = () => {
        console.log(`✅ WebSocket 接続成功: ${url}`);
        ws?.send('💓 发送心跳') // Send heartbeat immediately
        retryCount = 0 // Reset retry counter
    }

    // Message received
    ws.onmessage = async (event: WebSocket.MessageEvent) => {
        try {
            const msgData: MessageSendDTO = JSON.parse(event.data.toString());
            const messageType = msgData.messageType;

            console.log(`📩 收到服务器消息，类型: ${messageType}`);

            switch (messageType) {
                case MessageType.INIT: {
                    console.log('🚀 初始化消息接收');
                    // 断言成 InitMessageDTO，处理初始化数据
                    const initData = msgData.content?.extraData as InitMessageDTO;
                    console.log('Init message received applyCount:', initData.applyCount);
                    console.log('Init message received chatMessageList:', initData.chatMessageList);
                    console.log('Init message received chatSessionVOList:', initData.chatSessionVOList);
                    // TODO: 这里做初始化界面或状态相关操作
                    break;
                }

                case MessageType.FILE_TRANSMITTING: {
                    // 处理文件上传进度
                    console.log('⬆️ 文件上传进度消息');
                    if (mainWindow?.webContents) {
                        console.log('上传进度数据发送到渲染进程 percent :', msgData.content?.extraData.percent, "%");
                        mainWindow.webContents.send('upload-progress', msgData.content?.extraData);
                    }
                    break;
                }

                // ===== 10–19 群组相关 =====
                case MessageType.GROUP_CREATE: { // 10 
                    console.log('🎉 收到新建群组消息');
                    console.log('群组信息:', msgData.contact);
                    console.log('群组信息头像:', msgData.content?.extraData);
                    console.log('消息:', msgData.content?.text);
                    break;
                }
                case MessageType.DISSOLUTION_GROUP: { // 11
                    console.log('⚠️ 收到解散群组的通知');
                    console.log('被解散的群组信息:', msgData.contact);
                    console.log('消息:', msgData.content?.text);
                    break;
                }

                case MessageType.GROUP_NAME_UPDATE: {
                    console.log('📝 群名称更新消息:', msgData.content?.text);
                    console.log('Group name update received:', msgData.content?.text || msgData.contact);
                    break;
                }

                default:
                    // 处理其它类型消息
                    console.warn('⚠️ 未处理的消息类型:', messageType);
            }

        } catch (error) {
            console.error('Error while processing server message:', error);
        }
    };

    // Connection closed
    ws.onclose = (event: WebSocket.CloseEvent) => {
        console.warn(`WebSocket connection closed, code: ${event.code}`)
        handleReconnect()
    }

    // Connection error
    ws.onerror = (event: WebSocket.ErrorEvent) => {
        console.error('WebSocket encountered an error:', event)
        handleReconnect()
    }

    // Heartbeat timer: keep the connection alive
    setInterval(() => {
        if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send('💓 发送心跳')
            console.log('Heartbeat sent')
        }
    }, 9000); // Send heartbeat every 8 seconds
}

let isReconnecting = false // Whether currently reconnecting
let retryDelay = 5000 // Initial delay for retries

// Handle reconnection logic
const handleReconnect = () => {
    if (isReconnecting) {
        console.log('Already attempting to reconnect, skipping this attempt')
        return
    }
    if (!needReconnect) {
        console.log('Reconnection disabled; skipping reconnect')
        return
    }
    if (retryCount >= maxRetryCount) {
        console.error('Maximum number of retries reached. Stopping reconnection.')
        needReconnect = false
        return
    }

    isReconnecting = true
    retryCount++
    retryDelay = Math.min(retryDelay * 2, 30000) // Exponential backoff with a cap
    console.log(`Attempting to reconnect... (${retryCount}/${maxRetryCount}), delay: ${retryDelay}ms`)

    setTimeout(() => {
        if (ws) {
            ws.removeAllListeners() // Clean up existing listeners
            ws.close() // Close the previous connection
        }
        console.log('Re-establishing WebSocket connection...')
        createWs(wsUrl!)
        isReconnecting = false
    }, retryDelay)
}

// Close WebSocket and disable reconnection
export const closeWs = () => {
    needReconnect = false
    if (ws) {
        console.log('Manually closing WebSocket connection')
        ws.close()
    }
}
