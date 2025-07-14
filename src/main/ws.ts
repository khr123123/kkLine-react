import WebSocket from 'ws'
import type { InitMessageDTO, MessageSendDTO } from './common/messageType'
import { MessageType } from './common/messageType'
import { accumulateApplyCount, findSessionByUserAndContact, insertChatMessageRecordIgnore, insertChatSessionUserIgnore, updateContactInfo, updateSessionLastMessage, updateSessionNoReadCount } from "../db/dbService"
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
let userId: string | number

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
                // ===== 0 系统初始化 =====
                case MessageType.INIT: {  // 0 END
                    console.log('🚀 初始化消息接收');
                    const initData = msgData.content?.extraData as InitMessageDTO;
                    accumulateApplyCount(userId, initData.applyCount);
                    initData.chatMessageList.forEach((msg) => insertChatMessageRecordIgnore(msg));
                    initData.chatSessionVOList.forEach((session) => insertChatSessionUserIgnore(session, 0));
                    const sessionCountMap = new Map<string, { sessionId: string, count: number }>();
                    for (const msg of initData.chatMessageList) {
                        const sessionId = msg.sessionId
                        if (!sessionId) continue;
                        if (!sessionCountMap.has(sessionId)) {
                            sessionCountMap.set(sessionId, { sessionId, count: 0 });
                        }
                        sessionCountMap.get(sessionId)!.count++;
                    }
                    console.log("map", sessionCountMap);
                    for (const [_, { sessionId, count }] of sessionCountMap.entries()) {
                        updateSessionNoReadCount(userId, sessionId, count);
                    }
                    break;
                }

                // ===== 1–9 好友相关 =====
                case MessageType.ADD_FRIEND: { // 1   END
                    console.log('🤗 收到打招呼消息');
                    console.log('申请源头来自:', msgData.sender);
                    console.log('发送给:', msgData.contact);
                    console.log('消息:', msgData.content?.text);
                    console.log('对方信息:', msgData.content?.extraData);
                    insertChatMessageRecordIgnore({
                        id: msgData.messageId,
                        sessionId: msgData.contact?.chatSessionId,
                        messageType: msgData.messageType,
                        messageContent: msgData.content?.text,
                        sendUserId: msgData.sender?.userId,
                        sendUserName: msgData.sender?.userName,
                        sendTime: msgData.sendTime,
                        contactId: msgData.sender?.userId,
                        sendStatus: 0,
                    });
                    insertChatSessionUserIgnore({
                        userId: userId,
                        contactId: msgData.sender?.userId,
                        sessionId: msgData.contact?.chatSessionId,
                        contactName: msgData.sender?.userName,
                        contactAvatar: msgData.sender?.userAvatar,
                        contactType: msgData.contact?.contactType,
                        lastTime: msgData.sendTime,
                        lastMessage: msgData.content?.text,
                        memberCount: 0,
                    }, 1);
                    //TODO通知渲染线程 增加 session
                    break;
                }
                case MessageType.CONTACT_APPLY: { // 2   END
                    console.log('🔈 收到申请消息');
                    console.log('来自:', msgData.sender);
                    console.log('消息:', msgData.content?.text);
                    accumulateApplyCount(userId, 1); // 累加 1 条申请消息
                    //TODO通知渲染线程 添加申请消息
                    break;
                }
                case MessageType.EDIT_MY_NAME: { // 3   END
                    console.log('😶 收到朋友改名或者改头像消息');
                    console.log('改名朋友ID:', msgData.sender?.userId);
                    console.log(`改名朋友的新名字和头像:${msgData.sender?.userName},${msgData.sender?.userAvatar}`);
                    if (msgData.sender?.userId && userId) {
                        updateContactInfo(
                            userId,
                            msgData.sender.userId,
                            msgData.sender.userName,
                            msgData.sender.userAvatar
                        );
                    }
                    //TODO通知渲染线程 重新加载session信息
                    break;
                }

                // ===== 10–19 群组相关 =====
                case MessageType.GROUP_CREATE: { // 10   END
                    console.log('🎉 收到新建群组消息');
                    console.log('群组信息:', msgData.contact);
                    console.log('群组信息头像:', msgData.content?.extraData);
                    console.log('消息:', msgData.content?.text);
                    // 1. 插入一条系统消息
                    insertChatMessageRecordIgnore({
                        id: msgData.messageId,
                        sessionId: msgData.contact?.chatSessionId,
                        messageType: msgData.messageType,
                        messageContent: msgData.content?.text,
                        sendUserId: userId,
                        sendUserName: "",
                        sendTime: msgData.sendTime,
                        contactId: msgData.contact?.contactId,
                        sendStatus: 1,
                    });
                    // 2. 插入群会话（当前用户为 userId）
                    insertChatSessionUserIgnore({
                        userId,
                        contactId: msgData.contact?.contactId,
                        sessionId: msgData.contact?.chatSessionId,
                        contactName: msgData.contact?.contactName,
                        contactAvatar: msgData.content?.extraData,
                        contactType: msgData.contact?.contactType,
                        lastTime: msgData.sendTime,
                        lastMessage: msgData.content?.text,
                        memberCount: msgData.contact?.memberCount || 1,
                    }, 1);
                    //TODO通知渲染线程 重新加载session信息
                    break;
                }
                case MessageType.DISSOLUTION_GROUP: { // 11 END
                    console.log('⚠️ 收到解散群组的通知');
                    console.log('被解散的群组信息:', msgData.contact);
                    console.log('消息:', msgData.content?.text);
                    // 插入消息
                    insertChatMessageRecordIgnore({
                        id: msgData.messageId,
                        sessionId: msgData.contact?.chatSessionId,
                        messageType: msgData.messageType,
                        messageContent: msgData.content?.text,
                        sendUserId: msgData.sender?.userId || userId,
                        sendUserName: msgData.sender?.userName || '',
                        sendTime: msgData.sendTime,
                        contactId: msgData.contact?.contactId,
                        sendStatus: 1,
                    });
                    // 更新 session（如果已存在则更新 lastMessage / lastReceiveTime，不新增）
                    const sessionRow = findSessionByUserAndContact(userId, msgData.contact?.contactId!);
                    if (sessionRow) {
                        updateSessionLastMessage(
                            userId,
                            msgData.contact?.contactId!,
                            msgData.content?.text!,
                            msgData.sendTime!
                        );
                        updateSessionNoReadCount(userId, msgData.contact?.contactId!, sessionRow.noReadCount + 1);
                    } else {
                        // 如果没有记录，则插入一条新会话
                        insertChatSessionUserIgnore({
                            userId,
                            contactId: msgData.contact?.contactId,
                            sessionId: msgData.contact?.chatSessionId,
                            contactName: msgData.contact?.contactName,
                            contactAvatar: null,
                            contactType: msgData.contact?.contactType,
                            lastTime: msgData.sendTime,
                            lastMessage: msgData.content?.text
                        }, 1);
                    }
                    break;
                }
                case MessageType.ADD_GROUP: { // 12   END
                    console.log('😀 收到有人进群通知');
                    console.log('群组信息:', msgData.contact);
                    console.log('消息:', msgData.content?.text);
                    // 先插入消息
                    insertChatMessageRecordIgnore({
                        id: msgData.messageId,
                        sessionId: msgData.contact?.chatSessionId || '',
                        messageType: msgData.messageType,
                        messageContent: msgData.content?.text || '',
                        sendUserId: userId,
                        sendUserName: '', // 如果没有就空
                        sendTime: msgData.sendTime,
                        contactId: msgData.contact?.contactId || '',
                        sendStatus: 1,
                    });
                    // 插入或者忽略群聊session
                    // 更新 session（如果已存在则更新 lastMessage / lastReceiveTime，不新增）
                    const sessionRow = findSessionByUserAndContact(userId, msgData.contact?.contactId!);
                    if (sessionRow) {
                        updateSessionLastMessage(
                            userId,
                            msgData.contact?.contactId!,
                            msgData.content?.text!,
                            msgData.sendTime!
                        );
                        updateSessionNoReadCount(userId, msgData.contact?.contactId!, sessionRow.noReadCount + 1);
                    } else {
                        // 如果没有记录，则插入一条新会话
                        insertChatSessionUserIgnore({
                            userId,
                            contactId: msgData.contact?.contactId,
                            sessionId: msgData.contact?.chatSessionId,
                            contactName: msgData.contact?.contactName,
                            contactAvatar: null,
                            contactType: msgData.contact?.contactType,
                            lastTime: msgData.sendTime,
                            lastMessage: msgData.content?.text
                        }, 1);
                    }
                    break;
                }
                case MessageType.LEAVE_GROUP: { // 13  END
                    console.log('😒 收到有人退群通知');
                    console.log('群组信息:', msgData.contact);
                    console.log('消息:', msgData.content?.text);
                    // 先插入消息
                    insertChatMessageRecordIgnore({
                        id: msgData.messageId,
                        sessionId: msgData.contact?.chatSessionId || '',
                        messageType: msgData.messageType,
                        messageContent: msgData.content?.text || '',
                        sendUserId: userId,
                        sendUserName: '', // 如果没有就空
                        sendTime: msgData.sendTime,
                        contactId: msgData.contact?.contactId || '',
                        sendStatus: 1,
                    });
                    // 插入或者忽略群聊session
                    // 更新 session（如果已存在则更新 lastMessage / lastReceiveTime，不新增）
                    const sessionRow = findSessionByUserAndContact(userId, msgData.contact?.contactId!);
                    if (sessionRow) {
                        updateSessionLastMessage(
                            userId,
                            msgData.contact?.contactId!,
                            msgData.content?.text!,
                            msgData.sendTime!
                        );
                        updateSessionNoReadCount(userId, msgData.contact?.contactId!, sessionRow.noReadCount + 1);
                    } else {
                        // 如果没有记录，则插入一条新会话
                        insertChatSessionUserIgnore({
                            userId,
                            contactId: msgData.contact?.contactId,
                            sessionId: msgData.contact?.chatSessionId,
                            contactName: msgData.contact?.contactName,
                            contactAvatar: null,
                            contactType: msgData.contact?.contactType,
                            lastTime: msgData.sendTime,
                            lastMessage: msgData.content?.text
                        }, 1);
                    }
                    break;
                }
                case MessageType.REMOVE_GROUP: { // 14  TODO
                    console.log('😒 收到有人被踢出群的通知');
                    console.log('群组信息:', msgData.contact);
                    console.log('消息:', msgData.content?.text);
                    // 先插入消息
                    insertChatMessageRecordIgnore({
                        id: msgData.messageId,
                        sessionId: msgData.contact?.chatSessionId || '',
                        messageType: msgData.messageType,
                        messageContent: msgData.content?.text || '',
                        sendUserId: userId,
                        sendUserName: '', // 如果没有就空
                        sendTime: msgData.sendTime,
                        contactId: msgData.contact?.contactId || '',
                        sendStatus: 1,
                    });
                    // 插入或者忽略群聊session
                    // 更新 session（如果已存在则更新 lastMessage / lastReceiveTime，不新增）
                    const sessionRow = findSessionByUserAndContact(userId, msgData.contact?.contactId!);
                    if (sessionRow) {
                        updateSessionLastMessage(
                            userId,
                            msgData.contact?.contactId!,
                            msgData.content?.text!,
                            msgData.sendTime!
                        );
                        updateSessionNoReadCount(userId, msgData.contact?.contactId!, sessionRow.noReadCount + 1);
                    } else {
                        // 如果没有记录，则插入一条新会话
                        insertChatSessionUserIgnore({
                            userId,
                            contactId: msgData.contact?.contactId,
                            sessionId: msgData.contact?.chatSessionId,
                            contactName: msgData.contact?.contactName,
                            contactAvatar: null,
                            contactType: msgData.contact?.contactType,
                            lastTime: msgData.sendTime,
                            lastMessage: msgData.content?.text,
                        }, 1);
                    }
                    break;
                }
                case MessageType.GROUP_NAME_UPDATE: { // 15  END
                    console.log('📝 群名称更新消息,新群名字:', msgData.contact?.contactName);
                    console.log('更新后的群组信息:', msgData.contact);
                    updateContactInfo(
                        userId,
                        msgData.contact?.contactId!,
                        msgData.contact?.contactName,
                    );
                    //TODO 通知渲染进程重新渲染session
                    break;
                }
                // ===== 20–29 聊天相关 =====
                case MessageType.CHAT: { // 20  
                    console.log('💬 聊天消息');
                    console.log('发送方:', msgData.sender);
                    console.log('接收方:', msgData.contact);
                    console.log('消息:', msgData.content?.text);
                    console.log('消息ID:', msgData.messageId);
                    console.log('消息类型:', msgData.messageType);
                    // 先插入消息
                    insertChatMessageRecordIgnore({
                        id: msgData.messageId,
                        sessionId: msgData.contact?.chatSessionId || '',
                        messageType: msgData.messageType,
                        messageContent: msgData.content?.text || '',
                        sendUserId: msgData.sender?.userId,
                        sendUserName: msgData.sender?.userName,
                        sendTime: msgData.sendTime,
                        contactId: msgData.contact?.contactId || '',
                        sendStatus: 1,
                    });
                    // 更新 session（如果已存在则更新 lastMessage / lastReceiveTime，不新增）
                    const sessionRow = findSessionByUserAndContact(userId, msgData.contact?.contactId!);
                    if (sessionRow) {
                        updateSessionLastMessage(
                            userId,
                            msgData.contact?.contactId!,
                            msgData.content?.text!,
                            msgData.sendTime!
                        );
                        updateSessionNoReadCount(userId, msgData.contact?.contactId!, sessionRow.noReadCount + 1);
                    } else {
                        // 如果没有记录，则插入一条新会话
                        insertChatSessionUserIgnore({
                            userId,
                            contactId: msgData.contact?.contactId,
                            sessionId: msgData.contact?.chatSessionId,
                            contactName: msgData.contact?.contactName,
                            contactAvatar: msgData.sender?.userAvatar,
                            contactType: msgData.contact?.contactType,
                            lastTime: msgData.sendTime,
                            lastMessage: msgData.content?.text,
                        }, 1);
                    }
                }
                case MessageType.MEDIA_CHAT: { // 21  
                    console.log('🖼️ 媒体消息');
                    console.log('发送方:', msgData.sender);
                    console.log('接收方:', msgData.contact);
                    console.log('消息:', msgData.content?.text);
                    console.log('消息ID:', msgData.messageId);
                    console.log('消息类型:', msgData.messageType);
                }
                case MessageType.TYPING: { // 22  
                    console.log('✍ 对方正在输入中...');
                    console.log('接收方:', msgData.contact);
                    console.log('消息:', msgData.content?.text);
                    console.log('消息ID:', msgData.messageId);
                    console.log('消息类型:', msgData.messageType);
                    //TODO直接通知对方，对方正在输入中...
                }
                case MessageType.TYPING: { // 23  
                    console.log('🤟 对方正在输入输入结束');
                    console.log('接收方:', msgData.contact);
                    console.log('消息:', msgData.content?.text);
                    console.log('消息ID:', msgData.messageId);
                    console.log('消息类型:', msgData.messageType);
                    //TODO直接通知对方，对方结束输入中...
                }
                case MessageType.REVOKE_MESSAGE: { // 24  
                    console.log('🙃 对方撤回了一条消息');
                    console.log('发送方:', msgData.sender);
                    console.log('接收方:', msgData.contact);
                    console.log('消息:', msgData.content?.text);
                    console.log('消息ID:', msgData.messageId);
                    console.log('消息类型:', msgData.messageType);
                    //TODO删除消息即可
                }
                // ===== 30–39 文件传输相关 =====
                case MessageType.FILE_TRANSMITTING: {// 31 END
                    // 处理文件上传进度
                    console.log('⬆️ 文件上传进度消息');
                    if (mainWindow?.webContents) {
                        console.log('上传进度数据发送到渲染进程 percent :', msgData.content?.extraData.percent, "%");
                        mainWindow.webContents.send('upload-progress', msgData.content?.extraData);
                    }
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
