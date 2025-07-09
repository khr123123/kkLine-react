import WebSocket from 'ws'
import { DatabaseService } from '../db/BaseDAO.js'

interface LoginUser {
    token: string
    id: string | number
}

interface MessageData {
    messageType: number
    [key: string]: any
}

let ws: WebSocket | null = null
let wsUrl: string | null = null
let mainWindow: Electron.BrowserWindow | null = null

let needReconnect = true
let maxRetryCount = 5
let retryCount = 0
let userId: string | number | null = null

export const initWs = (loginUser: LoginUser, _mainWindow: Electron.BrowserWindow) => {
    mainWindow = _mainWindow
    console.log('🚀 ~ initWs ~ loginUser:', loginUser, _mainWindow)
    const token = loginUser.token
    userId = loginUser.id
    wsUrl = `ws://127.0.0.1:8081/ws?token=${token}`
    needReconnect = true
    maxRetryCount = 5
    retryCount = 0
    createWs(wsUrl)
}

export const createWs = (url: string) => {
    if (!url) return
    ws = new WebSocket(url)
    ws.onopen = () => {
        console.log(url + ' .. WebSocket连接成功')
        ws?.send('heart beat')
        retryCount = 0
    }
    ws.onmessage = async (event: WebSocket.MessageEvent) => {
        try {
            const msgData: MessageData = JSON.parse(event.data.toString());
            console.log('🚀 ~ Received message from server ~ Type:', msgData.messageType);
            if (msgData.messageType === 19) {
                if (mainWindow?.webContents) {
                    mainWindow.webContents.send('upload-progress', msgData.data);
                }
            }

        } catch (error) {
            console.error('Message handling error:', error);
        }
    };
    ws.onclose = (event: WebSocket.CloseEvent) => {
        console.log('ws.onclose ~ event:', event)
        handleReconnect(event)
    }
    ws.onerror = (event: WebSocket.ErrorEvent) => {
        console.log('ws.onerror ~ event:', event)
        handleReconnect(event)
    }
    // Heartbeat timer: ensure the WebSocket connection is open
    setInterval(() => {
        if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send('heart beat');
            console.log('sent Heartbeat sent');
        }
    }, 5000); // 30 秒

}

let isReconnecting = false
let retryDelay = 5000

const handleReconnect = (event: WebSocket.CloseEvent | WebSocket.ErrorEvent) => {
    if (isReconnecting) {
        console.log('已经在重连中了')
        return
    }
    if (!needReconnect) {
        console.log('不需要重连')
        return
    }
    if (retryCount >= maxRetryCount) {
        console.log('重试次数达到上限，不再重连')
        needReconnect = false
        return
    }
    isReconnecting = true
    retryCount++
    retryDelay = Math.min(retryDelay * 2, 30000)
    console.log(`尝试重连中... (${retryCount}/${maxRetryCount})，间隔: ${retryDelay}ms`)
    setTimeout(() => {
        if (ws) {
            ws.removeAllListeners()
            ws.close()
        }
        createWs(wsUrl!)
        isReconnecting = false
    }, retryDelay)
}

export const closeWs = () => {
    needReconnect = false
    if (ws) {
        console.log("close ws connection"); // 推荐
        ws.close()
    }
}
