import WebSocket from 'ws'

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

let needReconnect = true // Whether reconnection is needed
let maxRetryCount = 5 // Maximum number of retries
let retryCount = 0 // Current retry attempt
let userId: string | number | null = null

// Initialize WebSocket with user login info and the Electron main window
export const initWs = (loginUser: LoginUser, _mainWindow: Electron.BrowserWindow) => {
    mainWindow = _mainWindow
    console.log('Initializing WebSocket with login user info:', loginUser, _mainWindow)
    const token = loginUser.token
    userId = loginUser.id
    console.log('Current User is:', userId);
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
        console.log(`WebSocket connected successfully: ${url}`)
        ws?.send('heart beat') // Send heartbeat immediately
        retryCount = 0 // Reset retry counter
    }

    // Message received
    ws.onmessage = async (event: WebSocket.MessageEvent) => {
        try {
            const msgData: MessageData = JSON.parse(event.data.toString());
            console.log(`Received message from server, type: ${msgData.messageType}`);
            if (msgData.messageType === 19) {
                if (mainWindow?.webContents) {
                    console.log('Upload progress message sent to renderer process:', msgData.data)
                    mainWindow.webContents.send('upload-progress', msgData.data);
                }
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
            ws.send('heart beat');
            console.log('Heartbeat sent')
        }
    }, 8000); // Send heartbeat every 8 seconds
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
