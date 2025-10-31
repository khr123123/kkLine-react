import path from 'path'
import WebSocket from 'ws'
import { accumulateApplyCount, findSessionByUserAndContact, insertChatMessageRecordIgnore, insertChatSessionUserIgnore, revokeMessageById, updateContactInfo, updateMessageFileUrlAndStatus, updateSessionInfo, updateSessionLastMessage, updateSessionNoReadCount } from "../db/dbService"
import type { InitMessageDTO, MessageSendDTO } from './common/messageType'
import { MessageType } from './common/messageType'
const { exec } = require('child_process');
const recivePath = path.join(__dirname, '../../resources/recive.wav')

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
                case MessageType.INIT: {  // 0   END
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
                        sendStatus: 1,
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
                    if (mainWindow?.webContents) {
                        mainWindow.webContents.send('reload-session-list');
                    }
                    break;
                }
                case MessageType.CONTACT_APPLY: { // 2   END
                    console.log('🔈 收到申请消息');
                    console.log('来自:', msgData.sender);
                    console.log('消息:', msgData.content?.text);
                    const totleApplyCount = accumulateApplyCount(userId, 1); // 累加 1 条申请消息
                    if (mainWindow?.webContents) {
                        mainWindow.webContents.send('receive-apply', totleApplyCount);
                    }
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
                    if (mainWindow?.webContents) {
                        mainWindow.webContents.send('reload-session-list');
                    }
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
                    if (mainWindow?.webContents) {
                        mainWindow.webContents.send('reload-session-list');
                    }
                    break;
                }
                case MessageType.DISSOLUTION_GROUP: { // 11 END
                    console.log('⚠️ 收到解散群组的通知');
                    console.log('被解散的群组信息:', msgData.contact);
                    console.log('消息:', msgData.content?.text);
                    // 插入消息
                    const msgInfo = {
                        id: msgData.messageId,
                        sessionId: msgData.contact?.chatSessionId,
                        messageType: msgData.messageType,
                        messageContent: msgData.content?.text,
                        sendUserId: msgData.sender?.userId || userId,
                        sendUserName: msgData.sender?.userName || '',
                        sendTime: msgData.sendTime,
                        contactId: msgData.contact?.contactId,
                        sendStatus: 1,
                    }
                    insertChatMessageRecordIgnore(msgInfo);
                    // 更新 session（如果已存在则更新 lastMessage / lastReceiveTime，不新增）
                    const sessionRow = findSessionByUserAndContact(userId, msgData.sender?.userId!);
                    if (sessionRow) {
                        updateSessionLastMessage(
                            msgData.contact?.chatSessionId!,
                            msgData.content?.text!,
                            msgData.sendTime!
                        );
                        updateSessionNoReadCount(userId, msgData.contact?.chatSessionId!, sessionRow.noReadCount + 1);
                    } else {
                        // 如果没有记录，则插入一条新会话
                        insertChatSessionUserIgnore({
                            userId,
                            contactId: msgData.sender?.userId!,
                            sessionId: msgData.contact?.chatSessionId,
                            contactName: msgData.sender?.userName,
                            contactAvatar: msgData.sender?.userAvatar,
                            contactType: msgData.contact?.contactType,
                            lastTime: msgData.sendTime,
                            lastMessage: msgData.content?.text,
                        }, 1);
                    }
                    if (mainWindow?.webContents) {
                        mainWindow.webContents.send('receive-message', msgInfo);
                        mainWindow.webContents.send('change-group-session-info', {
                            chatSessionId: msgData.contact?.chatSessionId,
                            lastTime: msgData.sendTime,
                            lastMessage: msgData.content?.text,
                            memberCount: 0,
                        });
                    }
                    break;
                }
                case MessageType.ADD_GROUP: { // 12   END
                    console.log('😀 收到有人进群通知');
                    // 先插入消息
                    const msgInfo = {
                        id: msgData.messageId,
                        sessionId: msgData.contact?.chatSessionId || '',
                        messageType: msgData.messageType,
                        messageContent: msgData.content?.text || '',
                        sendUserId: userId,
                        sendUserName: '', // 如果没有就空
                        sendTime: msgData.sendTime,
                        contactId: msgData.contact?.contactId || '',
                        sendStatus: 1,
                    }
                    insertChatMessageRecordIgnore(msgInfo);
                    const sessionRow = findSessionByUserAndContact(userId, msgData.contact?.contactId!);
                    if (sessionRow) {
                        updateSessionInfo(
                            msgData.contact?.chatSessionId!,
                            msgData.content?.text!,
                            msgData.sendTime!,
                            msgData.contact?.memberCount!,
                        );
                        updateSessionNoReadCount(userId, msgData.contact?.chatSessionId!, sessionRow.noReadCount + 1);
                    } else {
                        // 如果没有记录，则插入一条新会话
                        insertChatSessionUserIgnore({
                            userId,
                            contactId: msgData.contact?.contactId!,
                            sessionId: msgData.contact?.chatSessionId,
                            contactName: msgData.contact?.contactName,
                            contactAvatar: msgData.content?.extraData,
                            contactType: msgData.contact?.contactType,
                            lastTime: msgData.sendTime,
                            lastMessage: msgData.content?.text,
                            memberCount: msgData.contact?.memberCount,
                        }, 1);
                        if (mainWindow?.webContents) {
                            mainWindow.webContents.send('reload-session-list');
                        }
                    }
                    if (mainWindow?.webContents) {
                        mainWindow.webContents.send('receive-message', msgInfo);
                        mainWindow.webContents.send('change-group-session-info', {
                            chatSessionId: msgData.contact?.chatSessionId,
                            lastTime: msgData.sendTime,
                            lastMessage: msgData.content?.text,
                            memberCount: msgData.contact?.memberCount!
                        });
                    }
                    break;
                }
                case MessageType.LEAVE_GROUP: { // 13  END
                    console.log('😒 收到有人退群通知');
                    const msgInfo = {
                        id: msgData.messageId,
                        sessionId: msgData.contact?.chatSessionId || '',
                        messageType: msgData.messageType,
                        messageContent: msgData.content?.text || '',
                        sendUserId: userId,
                        sendUserName: '', // 如果没有就空
                        sendTime: msgData.sendTime,
                        contactId: msgData.contact?.contactId || '',
                        sendStatus: 1,
                    }
                    // 先插入消息
                    insertChatMessageRecordIgnore(msgInfo);
                    const sessionRow = findSessionByUserAndContact(userId, msgData.contact?.contactId!);
                    if (sessionRow) {
                        updateSessionInfo(
                            msgData.contact?.chatSessionId!,
                            msgData.content?.text!,
                            msgData.sendTime!,
                            msgData.contact?.memberCount!,
                        );
                        updateSessionNoReadCount(userId, msgData.contact?.chatSessionId!, sessionRow.noReadCount + 1);
                    } else {
                        // 如果没有记录，则插入一条新会话
                        insertChatSessionUserIgnore({
                            userId,
                            contactId: msgData.contact?.contactId!,
                            sessionId: msgData.contact?.chatSessionId,
                            contactName: msgData.contact?.contactName,
                            contactAvatar: msgData.content?.extraData,
                            contactType: msgData.contact?.contactType,
                            lastTime: msgData.sendTime,
                            lastMessage: msgData.content?.text,
                            memberCount: msgData.contact?.memberCount,
                        }, 1);
                    }
                    if (mainWindow?.webContents) {
                        mainWindow.webContents.send('receive-message', msgInfo);
                        mainWindow.webContents.send('change-group-session-info', {
                            chatSessionId: msgData.contact?.chatSessionId,
                            lastTime: msgData.sendTime,
                            lastMessage: msgData.content?.text,
                            memberCount: msgData.contact?.memberCount!
                        });
                    }
                    break;
                }
                case MessageType.REMOVE_GROUP: { // 14  TODO
                    console.log('😒 收到有人被踢出群的通知');
                    const msgInfo = {
                        id: msgData.messageId,
                        sessionId: msgData.contact?.chatSessionId || '',
                        messageType: msgData.messageType,
                        messageContent: msgData.content?.text || '',
                        sendUserId: userId,
                        sendUserName: '', // 如果没有就空
                        sendTime: msgData.sendTime,
                        contactId: msgData.contact?.contactId || '',
                        sendStatus: 1,
                    }
                    // 先插入消息
                    insertChatMessageRecordIgnore(msgInfo);
                    const sessionRow = findSessionByUserAndContact(userId, msgData.contact?.contactId!);
                    if (sessionRow) {
                        updateSessionInfo(
                            msgData.contact?.chatSessionId!,
                            msgData.content?.text!,
                            msgData.sendTime!,
                            msgData.contact?.memberCount!,
                        );
                        updateSessionNoReadCount(userId, msgData.contact?.chatSessionId!, sessionRow.noReadCount + 1);
                    } else {
                        // 如果没有记录，则插入一条新会话
                        insertChatSessionUserIgnore({
                            userId,
                            contactId: msgData.contact?.contactId!,
                            sessionId: msgData.contact?.chatSessionId,
                            contactName: msgData.contact?.contactName,
                            contactAvatar: msgData.content?.extraData,
                            contactType: msgData.contact?.contactType,
                            lastTime: msgData.sendTime,
                            lastMessage: msgData.content?.text,
                            memberCount: msgData.contact?.memberCount,
                        }, 1);
                    }
                    if (mainWindow?.webContents) {
                        mainWindow.webContents.send('receive-message', msgInfo);
                        mainWindow.webContents.send('change-group-session-info', {
                            chatSessionId: msgData.contact?.chatSessionId,
                            lastReceiveTime: msgData.sendTime,
                            lastMessage: msgData.content?.text,
                            memberCount: msgData.contact?.memberCount!
                        });
                    }
                    break;
                }
                case MessageType.GROUP_NAME_UPDATE: { // 15  END
                    console.log("📝 群名称更新消息");
                    updateContactInfo(
                        userId,
                        msgData.contact?.contactId!,
                        msgData.contact?.contactName,
                        msgData.content?.extraData
                    );
                    if (mainWindow?.webContents) {
                        mainWindow.webContents.send('reload-session-list');
                    }
                    break;
                }
                // ===== 20–29 聊天相关 =====
                case MessageType.CHAT: { // 20  
                    exec(`powershell -c (New-Object Media.SoundPlayer '${recivePath}').PlaySync();`)
                    console.log('💬 聊天消息');
                    if (msgData.contact?.chatSessionId?.startsWith("G") && msgData.sender?.userId === userId) return
                    const msgInfo = {
                        id: msgData.messageId,
                        sessionId: msgData.contact?.chatSessionId || '',
                        messageType: msgData.messageType,
                        messageContent: msgData.content?.text || '',
                        sendUserId: msgData.sender?.userId,
                        sendUserName: msgData.sender?.userName,
                        sendTime: msgData.sendTime,
                        contactId: msgData.contact?.contactId || '',
                        sendStatus: 1,
                    }
                    // 先插入消息
                    insertChatMessageRecordIgnore(msgInfo);
                    // 更新 session（如果已存在则更新 lastMessage / lastReceiveTime，不新增）
                    if (msgData.contact?.chatSessionId?.startsWith("G")) {
                        const sessionRow = findSessionByUserAndContact(userId, msgData.contact?.contactId!);
                        if (sessionRow) {
                            updateSessionLastMessage(
                                msgData.contact?.chatSessionId!,
                                msgData.content?.text!,
                                msgData.sendTime!
                            );
                            updateSessionNoReadCount(userId, msgData.contact?.contactId!, sessionRow.noReadCount + 1);
                        } else {
                            // 如果没有记录，则插入一条新会话
                            insertChatSessionUserIgnore({
                                userId,
                                contactId: msgData.contact?.contactId!,
                                sessionId: msgData.contact?.chatSessionId,
                                contactName: msgData.contact?.contactName,
                                contactAvatar: msgData.content?.extraData,
                                contactType: msgData.contact?.contactType,
                                lastTime: msgData.sendTime,
                                lastMessage: msgData.content?.text,
                            }, 1);
                            if (mainWindow?.webContents) {
                                mainWindow.webContents.send('reload-session-list');
                            }
                        }
                    } else {
                        const sessionRow = findSessionByUserAndContact(userId, msgData.sender?.userId!);
                        if (sessionRow) {
                            console.log('sessionRow:', sessionRow);
                            updateSessionLastMessage(
                                msgData.contact?.chatSessionId!,
                                msgData.content?.text!,
                                msgData.sendTime!
                            );
                            updateSessionNoReadCount(userId, msgData.contact?.chatSessionId!, sessionRow.noReadCount + 1);
                        } else {
                            console.log('not found sessionRow');
                            // 如果没有记录，则插入一条新会话
                            insertChatSessionUserIgnore({
                                userId,
                                contactId: msgData.sender?.userId!,
                                sessionId: msgData.contact?.chatSessionId,
                                contactName: msgData.sender?.userName,
                                contactAvatar: msgData.sender?.userAvatar,
                                contactType: msgData.contact?.contactType,
                                lastTime: msgData.sendTime,
                                lastMessage: msgData.content?.text,
                            }, 1);
                            if (mainWindow?.webContents) {
                                mainWindow.webContents.send('reload-session-list');
                            }
                        }
                    }
                    if (mainWindow?.webContents) {
                        mainWindow.webContents.send('receive-message', msgInfo);
                        mainWindow.webContents.send('change-session-info', {
                            chatSessionId: msgData.contact?.chatSessionId!,
                            lastMessage: msgData.content?.text!,
                            lastReceiveTime: msgData.sendTime!
                        });
                    }
                    break;
                }
                case MessageType.MEDIA_CHAT: { // 21  
                    exec(`powershell -c (New-Object Media.SoundPlayer '${recivePath}').PlaySync();`)
                    console.log('🖼️ 媒体消息');
                    if (msgData.contact?.chatSessionId?.startsWith("G") && msgData.sender?.userId === userId) return
                    const msgInfo = {
                        id: msgData.messageId,
                        sessionId: msgData.contact?.chatSessionId || '',
                        messageType: msgData.messageType,
                        messageContent: msgData.content?.text || '',
                        sendUserId: msgData.sender?.userId,
                        sendUserName: msgData.sender?.userName,
                        sendTime: msgData.sendTime,
                        contactId: msgData.contact?.contactId || '',
                        fileUrl: msgData.file?.fileUrl || '',
                        fileSize: msgData.file?.fileSize || '',
                        fileName: msgData.file?.fileName || '',
                        fileType: msgData.file?.fileType || '',
                        sendStatus: 0,
                    }
                    // 先插入消息
                    insertChatMessageRecordIgnore(msgInfo);
                    // 更新 session（如果已存在则更新 lastMessage / lastReceiveTime，不新增）
                    if (msgData.contact?.chatSessionId?.startsWith("G")) {
                        const sessionRow = findSessionByUserAndContact(userId, msgData.contact?.contactId!);
                        if (sessionRow) {
                            updateSessionLastMessage(
                                msgData.contact?.chatSessionId!,
                                msgData.content?.text!,
                                msgData.sendTime!
                            );
                            updateSessionNoReadCount(userId, msgData.contact?.contactId!, sessionRow.noReadCount + 1);
                        } else {
                            // 如果没有记录，则插入一条新会话
                            insertChatSessionUserIgnore({
                                userId,
                                contactId: msgData.contact?.contactId!,
                                sessionId: msgData.contact?.chatSessionId,
                                contactName: msgData.contact?.contactName,
                                contactAvatar: msgData.content?.extraData,
                                contactType: msgData.contact?.contactType,
                                lastTime: msgData.sendTime,
                                lastMessage: msgData.content?.text,
                            }, 1);
                            if (mainWindow?.webContents) {
                                mainWindow.webContents.send('reload-session-list');
                            }
                        }
                    } else {
                        const sessionRow = findSessionByUserAndContact(userId, msgData.sender?.userId!);
                        if (sessionRow) {
                            console.log('sessionRow:', sessionRow);
                            updateSessionLastMessage(
                                msgData.contact?.chatSessionId!,
                                msgData.content?.text!,
                                msgData.sendTime!
                            );
                            updateSessionNoReadCount(userId, msgData.contact?.chatSessionId!, sessionRow.noReadCount + 1);
                        } else {
                            console.log('not found sessionRow');
                            // 如果没有记录，则插入一条新会话
                            insertChatSessionUserIgnore({
                                userId,
                                contactId: msgData.sender?.userId!,
                                sessionId: msgData.contact?.chatSessionId,
                                contactName: msgData.sender?.userName,
                                contactAvatar: msgData.sender?.userAvatar,
                                contactType: msgData.contact?.contactType,
                                lastTime: msgData.sendTime,
                                lastMessage: msgData.content?.text,
                            }, 1);
                            if (mainWindow?.webContents) {
                                mainWindow.webContents.send('reload-session-list');
                            }
                        }
                    }
                    if (mainWindow?.webContents) {
                        mainWindow.webContents.send('receive-message', msgInfo);
                        mainWindow.webContents.send('change-session-info', {
                            chatSessionId: msgData.contact?.chatSessionId!,
                            lastMessage: msgData.content?.text!,
                            lastReceiveTime: msgData.sendTime!
                        });
                    }
                    break;
                }
                case MessageType.TYPING: { // 22  END ✅
                    console.log('✍ 对方正在输入中...');
                    if (mainWindow?.webContents) {
                        mainWindow.webContents.send('typing', msgData.contact?.chatSessionId, true);
                    }
                    break;
                }
                case MessageType.TYPING_END: { // 23  END ✅
                    console.log('🤟 对方正在输入输入结束');
                    if (mainWindow?.webContents) {
                        mainWindow.webContents.send('typing', msgData.contact?.chatSessionId, false);
                    }
                    break;
                }
                case MessageType.REVOKE_MESSAGE: { // 24  
                    console.log('🙃 对方撤回了一条消息');
                    const newMsgContent = msgData.content?.text
                    const now = msgData.sendTime;
                    revokeMessageById(msgData.messageId?.toString()!, newMsgContent!, now!)
                    updateSessionLastMessage(msgData.contact?.chatSessionId!, newMsgContent!, now!)
                    if (mainWindow?.webContents) {
                        mainWindow.webContents.send('somebody-revoke-msg', {
                            messageId: msgData.messageId,
                            messageContent: newMsgContent,
                        });
                        mainWindow.webContents.send('change-session-info', {
                            chatSessionId: msgData.contact?.chatSessionId,
                            lastMessage: newMsgContent,
                            lastReceiveTime: now
                        });
                    }
                    break;
                }
                //  25  语音通话的offer
                case MessageType.CHAT_AUDIO_OFFER: {
                    console.log('视频/语音通话的offer');
                    exec(`powershell -c (New-Object Media.SoundPlayer '${recivePath}').PlaySync();`)
                    if (msgData.contact?.chatSessionId?.startsWith("G") && msgData.sender?.userId === userId) return
                    const msgInfo = {
                        id: msgData.messageId,
                        sessionId: msgData.contact?.chatSessionId || '',
                        messageType: msgData.messageType,
                        messageContent: msgData.content?.text || '',
                        sendUserId: msgData.sender?.userId,
                        sendUserName: msgData.sender?.userName,
                        sendTime: msgData.sendTime,
                        contactId: msgData.contact?.contactId || '',
                        sendStatus: 1,
                    }
                    // 先插入消息
                    // insertChatMessageRecordIgnore(msgInfo);
                    // 更新 session（如果已存在则更新 lastMessage / lastReceiveTime，不新增）
                    if (msgData.contact?.chatSessionId?.startsWith("G")) {
                        const sessionRow = findSessionByUserAndContact(userId, msgData.contact?.contactId!);
                        if (sessionRow) {
                            updateSessionLastMessage(
                                msgData.contact?.chatSessionId!,
                                msgData.content?.text!,
                                msgData.sendTime!
                            );
                            updateSessionNoReadCount(userId, msgData.contact?.contactId!, sessionRow.noReadCount + 1);
                        } else {
                            // 如果没有记录，则插入一条新会话
                            insertChatSessionUserIgnore({
                                userId,
                                contactId: msgData.contact?.contactId!,
                                sessionId: msgData.contact?.chatSessionId,
                                contactName: msgData.contact?.contactName,
                                contactAvatar: msgData.content?.extraData,
                                contactType: msgData.contact?.contactType,
                                lastTime: msgData.sendTime,
                                lastMessage: msgData.content?.text,
                            }, 1);
                            if (mainWindow?.webContents) {
                                mainWindow.webContents.send('reload-session-list');
                            }
                        }
                    } else {
                        const sessionRow = findSessionByUserAndContact(userId, msgData.sender?.userId!);
                        if (sessionRow) {
                            console.log('sessionRow:', sessionRow);
                            updateSessionLastMessage(
                                msgData.contact?.chatSessionId!,
                                msgData.content?.text!,
                                msgData.sendTime!
                            );
                            updateSessionNoReadCount(userId, msgData.contact?.chatSessionId!, sessionRow.noReadCount + 1);
                        } else {
                            console.log('not found sessionRow');
                            // 如果没有记录，则插入一条新会话
                            insertChatSessionUserIgnore({
                                userId,
                                contactId: msgData.sender?.userId!,
                                sessionId: msgData.contact?.chatSessionId,
                                contactName: msgData.sender?.userName,
                                contactAvatar: msgData.sender?.userAvatar,
                                contactType: msgData.contact?.contactType,
                                lastTime: msgData.sendTime,
                                lastMessage: msgData.content?.text,
                            }, 1);
                            if (mainWindow?.webContents) {
                                mainWindow.webContents.send('reload-session-list');
                            }
                        }
                    }
                    if (mainWindow?.webContents) {
                        mainWindow.webContents.send('receive-message', msgInfo);
                        mainWindow.webContents.send('change-session-info', {
                            chatSessionId: msgData.contact?.chatSessionId!,
                            lastMessage: msgData.content?.text!,
                            lastReceiveTime: msgData.sendTime!
                        });
                        mainWindow.webContents.send('receive-audio-offer', {
                            receiverId: null,
                            senderId: msgData.sender?.userId,
                            senderName: msgData.sender?.userName,
                            senderAvatar: msgData.sender?.userAvatar,
                            text: msgData.content?.text,
                            room: msgData.content?.extraData,
                        });
                    }
                    break;
                }
                //  26  视频通话的offer
                case MessageType.CHAT_VIDEO_OFFER: {
                    console.log('视频/语音通话的offer');
                    exec(`powershell -c (New-Object Media.SoundPlayer '${recivePath}').PlaySync();`)
                    if (msgData.contact?.chatSessionId?.startsWith("G") && msgData.sender?.userId === userId) return
                    const msgInfo = {
                        id: msgData.messageId,
                        sessionId: msgData.contact?.chatSessionId || '',
                        messageType: msgData.messageType,
                        messageContent: msgData.content?.text || '',
                        sendUserId: msgData.sender?.userId,
                        sendUserName: msgData.sender?.userName,
                        sendTime: msgData.sendTime,
                        contactId: msgData.contact?.contactId || '',
                        sendStatus: 1,
                    }
                    // 先插入消息
                    // insertChatMessageRecordIgnore(msgInfo);
                    // 更新 session（如果已存在则更新 lastMessage / lastReceiveTime，不新增）
                    if (msgData.contact?.chatSessionId?.startsWith("G")) {
                        const sessionRow = findSessionByUserAndContact(userId, msgData.contact?.contactId!);
                        if (sessionRow) {
                            updateSessionLastMessage(
                                msgData.contact?.chatSessionId!,
                                msgData.content?.text!,
                                msgData.sendTime!
                            );
                            updateSessionNoReadCount(userId, msgData.contact?.contactId!, sessionRow.noReadCount + 1);
                        } else {
                            // 如果没有记录，则插入一条新会话
                            insertChatSessionUserIgnore({
                                userId,
                                contactId: msgData.contact?.contactId!,
                                sessionId: msgData.contact?.chatSessionId,
                                contactName: msgData.contact?.contactName,
                                contactAvatar: msgData.content?.extraData,
                                contactType: msgData.contact?.contactType,
                                lastTime: msgData.sendTime,
                                lastMessage: msgData.content?.text,
                            }, 1);
                            if (mainWindow?.webContents) {
                                mainWindow.webContents.send('reload-session-list');
                            }
                        }
                    } else {
                        const sessionRow = findSessionByUserAndContact(userId, msgData.sender?.userId!);
                        if (sessionRow) {
                            console.log('sessionRow:', sessionRow);
                            updateSessionLastMessage(
                                msgData.contact?.chatSessionId!,
                                msgData.content?.text!,
                                msgData.sendTime!
                            );
                            updateSessionNoReadCount(userId, msgData.contact?.chatSessionId!, sessionRow.noReadCount + 1);
                        } else {
                            console.log('not found sessionRow');
                            // 如果没有记录，则插入一条新会话
                            insertChatSessionUserIgnore({
                                userId,
                                contactId: msgData.sender?.userId!,
                                sessionId: msgData.contact?.chatSessionId,
                                contactName: msgData.sender?.userName,
                                contactAvatar: msgData.sender?.userAvatar,
                                contactType: msgData.contact?.contactType,
                                lastTime: msgData.sendTime,
                                lastMessage: msgData.content?.text,
                            }, 1);
                            if (mainWindow?.webContents) {
                                mainWindow.webContents.send('reload-session-list');
                            }
                        }
                    }
                    if (mainWindow?.webContents) {
                        mainWindow.webContents.send('receive-message', msgInfo);
                        mainWindow.webContents.send('change-session-info', {
                            chatSessionId: msgData.contact?.chatSessionId!,
                            lastMessage: msgData.content?.text!,
                            lastReceiveTime: msgData.sendTime!
                        });
                        console.log(msgData.sender?.userId);
                        console.log(msgData.sender?.userName);
                        console.log(msgData.content?.extraData);
                        console.log(msgData.content?.text);
                        console.log(msgData.sender?.userAvatar);
                        mainWindow.webContents.send('reviced-video-offer', {
                            receiverId: null,
                            senderId: msgData.sender?.userId,
                            senderName: msgData.sender?.userName,
                            senderAvatar: msgData.sender?.userAvatar,
                            text: msgData.content?.text,
                            room: msgData.content?.extraData,
                        });
                    }
                    break;
                }
                //  27 or  28 视频通话结束END
                case MessageType.CHAT_AUDIO_END: {
                    console.log('视频通话的end');
                    exec(`powershell -c (New-Object Media.SoundPlayer '${recivePath}').PlaySync();`)
                    if (msgData.contact?.chatSessionId?.startsWith("G") && msgData.sender?.userId === userId) return
                    const msgInfo = {
                        id: msgData.messageId,
                        sessionId: msgData.contact?.chatSessionId || '',
                        messageType: msgData.messageType,
                        messageContent: msgData.content?.text || '',
                        sendUserId: msgData.sender?.userId,
                        sendUserName: msgData.sender?.userName,
                        sendTime: msgData.sendTime,
                        contactId: msgData.contact?.contactId || '',
                        sendStatus: 1,
                    }
                    console.log("msgInfo", msgInfo);
                    if (msgData.content?.extraData == "MYSELF") {
                        msgInfo.sendUserId = msgData.contact?.contactId as any
                        msgInfo.contactId = msgData.sender?.userId as any
                    }
                    // 先插入消息
                    insertChatMessageRecordIgnore(msgInfo);
                    // 更新 session（如果已存在则更新 lastMessage / lastReceiveTime，不新增）
                    if (msgData.contact?.chatSessionId?.startsWith("G")) {
                        const sessionRow = findSessionByUserAndContact(userId, msgData.contact?.contactId!);
                        if (sessionRow) {
                            updateSessionLastMessage(
                                msgData.contact?.chatSessionId!,
                                msgData.content?.text!,
                                msgData.sendTime!
                            );
                            updateSessionNoReadCount(userId, msgData.contact?.contactId!, sessionRow.noReadCount + 1);
                        } else {
                            insertChatSessionUserIgnore({
                                userId,
                                contactId: msgData.contact?.contactId!,
                                sessionId: msgData.contact?.chatSessionId,
                                contactName: msgData.contact?.contactName,
                                contactAvatar: msgData.content?.extraData,
                                contactType: msgData.contact?.contactType,
                                lastTime: msgData.sendTime,
                                lastMessage: msgData.content?.text,
                            }, 1);
                            if (mainWindow?.webContents) {
                                mainWindow.webContents.send('reload-session-list');
                            }
                        }
                    } else {
                        const sessionRow = findSessionByUserAndContact(userId, msgData.sender?.userId!);
                        if (sessionRow) {
                            console.log('sessionRow:', sessionRow);
                            updateSessionLastMessage(
                                msgData.contact?.chatSessionId!,
                                msgData.content?.text!,
                                msgData.sendTime!
                            );
                            updateSessionNoReadCount(userId, msgData.contact?.chatSessionId!, sessionRow.noReadCount + 1);
                        } else {
                            console.log('not found sessionRow');
                            // 如果没有记录，则插入一条新会话
                            insertChatSessionUserIgnore({
                                userId,
                                contactId: msgData.sender?.userId!,
                                sessionId: msgData.contact?.chatSessionId,
                                contactName: msgData.sender?.userName,
                                contactAvatar: msgData.sender?.userAvatar,
                                contactType: msgData.contact?.contactType,
                                lastTime: msgData.sendTime,
                                lastMessage: msgData.content?.text,
                            }, 1);
                            if (mainWindow?.webContents) {
                                mainWindow.webContents.send('reload-session-list');
                            }
                        }
                    }
                    if (mainWindow?.webContents) {
                        mainWindow.webContents.send('receive-message', msgInfo);
                        mainWindow.webContents.send('change-session-info', {
                            chatSessionId: msgData.contact?.chatSessionId!,
                            lastMessage: msgData.content?.text!,
                            lastReceiveTime: msgData.sendTime!
                        });
                    }
                    break;
                }
                case MessageType.CHAT_VIDEO_END: {
                    console.log('视频通话的end');
                    exec(`powershell -c (New-Object Media.SoundPlayer '${recivePath}').PlaySync();`)
                    if (msgData.contact?.chatSessionId?.startsWith("G") && msgData.sender?.userId === userId) return
                    const msgInfo = {
                        id: msgData.messageId,
                        sessionId: msgData.contact?.chatSessionId || '',
                        messageType: msgData.messageType,
                        messageContent: msgData.content?.text || '',
                        sendUserId: msgData.sender?.userId,
                        sendUserName: msgData.sender?.userName,
                        sendTime: msgData.sendTime,
                        contactId: msgData.contact?.contactId || '',
                        sendStatus: 1,
                    }
                    console.log("msgInfo", msgInfo);
                    if (msgData.content?.extraData == "MYSELF") {
                        msgInfo.sendUserId = msgData.contact?.contactId as any
                        msgInfo.contactId = msgData.sender?.userId as any
                    }
                    // 先插入消息
                    insertChatMessageRecordIgnore(msgInfo);
                    // 更新 session（如果已存在则更新 lastMessage / lastReceiveTime，不新增）
                    if (msgData.contact?.chatSessionId?.startsWith("G")) {
                        const sessionRow = findSessionByUserAndContact(userId, msgData.contact?.contactId!);
                        if (sessionRow) {
                            updateSessionLastMessage(
                                msgData.contact?.chatSessionId!,
                                msgData.content?.text!,
                                msgData.sendTime!
                            );
                            updateSessionNoReadCount(userId, msgData.contact?.contactId!, sessionRow.noReadCount + 1);
                        } else {
                            insertChatSessionUserIgnore({
                                userId,
                                contactId: msgData.contact?.contactId!,
                                sessionId: msgData.contact?.chatSessionId,
                                contactName: msgData.contact?.contactName,
                                contactAvatar: msgData.content?.extraData,
                                contactType: msgData.contact?.contactType,
                                lastTime: msgData.sendTime,
                                lastMessage: msgData.content?.text,
                            }, 1);
                            if (mainWindow?.webContents) {
                                mainWindow.webContents.send('reload-session-list');
                            }
                        }
                    } else {
                        const sessionRow = findSessionByUserAndContact(userId, msgData.sender?.userId!);
                        if (sessionRow) {
                            console.log('sessionRow:', sessionRow);
                            updateSessionLastMessage(
                                msgData.contact?.chatSessionId!,
                                msgData.content?.text!,
                                msgData.sendTime!
                            );
                            updateSessionNoReadCount(userId, msgData.contact?.chatSessionId!, sessionRow.noReadCount + 1);
                        } else {
                            console.log('not found sessionRow');
                            // 如果没有记录，则插入一条新会话
                            insertChatSessionUserIgnore({
                                userId,
                                contactId: msgData.sender?.userId!,
                                sessionId: msgData.contact?.chatSessionId,
                                contactName: msgData.sender?.userName,
                                contactAvatar: msgData.sender?.userAvatar,
                                contactType: msgData.contact?.contactType,
                                lastTime: msgData.sendTime,
                                lastMessage: msgData.content?.text,
                            }, 1);
                            if (mainWindow?.webContents) {
                                mainWindow.webContents.send('reload-session-list');
                            }
                        }
                    }
                    if (mainWindow?.webContents) {
                        mainWindow.webContents.send('receive-message', msgInfo);
                        mainWindow.webContents.send('change-session-info', {
                            chatSessionId: msgData.contact?.chatSessionId!,
                            lastMessage: msgData.content?.text!,
                            lastReceiveTime: msgData.sendTime!
                        });
                    }
                    break;
                }
                // ===== 30–39 文件传输相关 =====
                // 30号上传完成的消息 弃用，改用上传监听
                case MessageType.FILE_TRANSMITTING: {// 31 END ✅
                    // 处理文件上传进度
                    console.log('⬆️ 文件上传进度消息');
                    if (msgData.messageId) {
                        console.log("messageID", msgData.messageId);
                        if (msgData.content?.extraData?.fileUrl) {
                            updateMessageFileUrlAndStatus(msgData.messageId, msgData.content.extraData.fileUrl, 1);
                        }
                        if (mainWindow?.webContents) {
                            console.log('fileMsg上传进度数据发送到渲染进程 percent :', msgData.content?.extraData.percent, "%");
                            mainWindow.webContents.send('file-msg-progress', msgData.messageId, msgData.content?.extraData);
                        }
                    } else {
                        if (mainWindow?.webContents) {
                            console.log('avatar上传进度数据发送到渲染进程 percent :', msgData.content?.extraData.percent, "%");
                            mainWindow.webContents.send('upload-progress', msgData.content?.extraData);
                        }
                    }
                    break;
                }
                // ===== 40–49 系统类 =====
                case MessageType.FORCE_OFF_LINE: { // 强制下线 40 　TODO
                }
                case MessageType.ADVERTISEMENT: { // 广告消息 41   　TODO
                    console.log('📢 收到了广告消息');
                    exec(`powershell -c (New-Object Media.SoundPlayer '${recivePath}').PlaySync();`)
                    const msgInfo = {
                        id: msgData.messageId,
                        sessionId: msgData.contact?.chatSessionId || '',
                        messageType: msgData.messageType,
                        messageContent: JSON.stringify(msgData.content?.extraData || {}),
                        sendUserId: "AD",
                        sendUserName: "AD",
                        sendTime: msgData.sendTime,
                        contactId: '',
                        fileUrl: '',
                        fileSize: '',
                        fileName: '',
                        fileType: '',
                        sendStatus: 1,
                    }
                    // 先插入消息
                    insertChatMessageRecordIgnore(msgInfo);
                    const sessionRow = findSessionByUserAndContact(userId, msgData.contact?.chatSessionId!);
                    if (sessionRow) {
                        updateSessionLastMessage(
                            msgData.contact?.chatSessionId!,
                            msgData.content?.extraData.adTitle,
                            msgData.sendTime!
                        );
                        updateSessionNoReadCount(userId, msgData.contact?.chatSessionId!, sessionRow.noReadCount + 1);
                    } else {
                        // 如果没有记录，则插入一条新会话
                        insertChatSessionUserIgnore({
                            userId,
                            contactId: msgData.contact?.chatSessionId!,
                            sessionId: msgData.contact?.chatSessionId,
                            contactName: msgData.content?.extraData.adCategory.name,
                            contactAvatar: msgData.content?.extraData.adCategory.iconUrl,
                            contactType: "",
                            lastTime: msgData.sendTime,
                            lastMessage: msgData.content?.extraData.adTitle,
                        }, 1);
                        if (mainWindow?.webContents) {
                            mainWindow.webContents.send('reload-session-list');
                        }
                    }
                    if (mainWindow?.webContents) {
                        mainWindow.webContents.send('receive-message', msgInfo);
                        mainWindow.webContents.send('change-ad-session-info', {
                            chatSessionId: msgData.contact?.chatSessionId!,
                            lastMessage: msgData.content?.extraData.adTitle,
                            lastReceiveTime: msgData.sendTime!,
                            noReadCount: 1
                        });
                    }
                    break;
                }
                // ===== 50–51 互动类 =====
                case MessageType.SHARE_CONTACT: {// 50
                    // 收到了邀请消息
                    console.log('🙌 收到了邀请消息');
                    console.log("messageID", msgData.messageId);
                    exec(`powershell -c (New-Object Media.SoundPlayer '${recivePath}').PlaySync();`)
                    const msgInfo = {
                        id: msgData.messageId,
                        sessionId: msgData.contact?.chatSessionId || '',
                        messageType: msgData.messageType,
                        messageContent: msgData.content?.extraData || '',
                        sendUserId: msgData.sender?.userId,
                        sendUserName: msgData.sender?.userName,
                        sendTime: msgData.sendTime,
                        contactId: msgData.contact?.contactId || '',
                        sendStatus: 1,
                    }
                    // 先插入消息
                    insertChatMessageRecordIgnore(msgInfo);
                    //先判断是否为发送给自己的
                    if (msgData.sender?.userId === userId && !msgData.contact?.chatSessionId?.startsWith("G")) {
                        const shareUserInfo = JSON.parse(msgData.content?.summary!)
                        console.log("shareUserInfo", shareUserInfo);
                        const sessionRow = findSessionByUserAndContact(userId, shareUserInfo.id);
                        if (sessionRow) {
                            console.log('sessionRow:', sessionRow);
                            updateSessionLastMessage(
                                msgData.contact?.chatSessionId!,
                                msgData.content?.text!,
                                msgData.sendTime!
                            );
                            updateSessionNoReadCount(userId, shareUserInfo.id, sessionRow.noReadCount + 1);
                        } else {
                            console.log('not found sessionRow');
                            // 如果没有记录，则插入一条新会话
                            insertChatSessionUserIgnore({
                                userId,
                                contactId: shareUserInfo.id,
                                sessionId: msgData.contact?.chatSessionId,
                                contactName: shareUserInfo?.userName,
                                contactAvatar: shareUserInfo?.userAvatar,
                                contactType: msgData.contact?.contactType,
                                lastTime: msgData.sendTime,
                                lastMessage: msgData.content?.text,
                            }, 1);
                            if (mainWindow?.webContents) {
                                mainWindow.webContents.send('reload-session-list');
                            }
                        }
                    } else {
                        // 更新 session（如果已存在则更新 lastMessage / lastReceiveTime，不新增）
                        if (msgData.contact?.chatSessionId?.startsWith("G")) {
                            const sessionRow = findSessionByUserAndContact(userId, msgData.contact?.contactId!);
                            if (sessionRow) {
                                updateSessionLastMessage(
                                    msgData.contact?.chatSessionId!,
                                    msgData.content?.text!,
                                    msgData.sendTime!
                                );
                                updateSessionNoReadCount(userId, msgData.contact?.contactId!, sessionRow.noReadCount + 1);
                            } else {
                                // 如果没有记录，则插入一条新会话
                                insertChatSessionUserIgnore({
                                    userId,
                                    contactId: msgData.contact?.contactId!,
                                    sessionId: msgData.contact?.chatSessionId,
                                    contactName: msgData.contact?.contactName,
                                    contactAvatar: msgData.content?.summary,
                                    contactType: msgData.contact?.contactType,
                                    lastTime: msgData.sendTime,
                                    lastMessage: msgData.content?.text,
                                }, 1);
                                if (mainWindow?.webContents) {
                                    mainWindow.webContents.send('reload-session-list');
                                }
                            }
                        } else {
                            const sessionRow = findSessionByUserAndContact(userId, msgData.sender?.userId!);
                            if (sessionRow) {
                                console.log('sessionRow:', sessionRow);
                                updateSessionLastMessage(
                                    msgData.contact?.chatSessionId!,
                                    msgData.content?.text!,
                                    msgData.sendTime!
                                );
                                updateSessionNoReadCount(userId, msgData.sender?.userId!, sessionRow.noReadCount + 1);
                            } else {
                                console.log('not found sessionRow');
                                // 如果没有记录，则插入一条新会话
                                insertChatSessionUserIgnore({
                                    userId,
                                    contactId: msgData.sender?.userId!,
                                    sessionId: msgData.contact?.chatSessionId,
                                    contactName: msgData.sender?.userName,
                                    contactAvatar: msgData.sender?.userAvatar,
                                    contactType: msgData.contact?.contactType,
                                    lastTime: msgData.sendTime,
                                    lastMessage: msgData.content?.text,
                                }, 1);
                                if (mainWindow?.webContents) {
                                    mainWindow.webContents.send('reload-session-list');
                                }
                            }
                        }
                    }
                    if (mainWindow?.webContents) {
                        mainWindow.webContents.send('receive-message', msgInfo);
                        mainWindow.webContents.send('change-session-info', {
                            chatSessionId: msgData.contact?.chatSessionId!,
                            lastMessage: msgData.content?.text!,
                            lastReceiveTime: msgData.sendTime!
                        });
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
